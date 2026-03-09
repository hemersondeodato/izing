#!/usr/bin/env bash

set -Eeuo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${REPO_DIR}/.env.production"
EXAMPLE_ENV_FILE="${REPO_DIR}/.env.production.example"
COMPOSE_FILE="${REPO_DIR}/docker-compose.production.yml"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  printf '\n[ERRO] %s\n' "$*" >&2
  exit 1
}

require_root() {
  if [ "${EUID}" -ne 0 ]; then
    fail "execute como root"
  fi
}

require_ubuntu() {
  if ! grep -qi 'ubuntu' /etc/os-release; then
    fail "script suportado apenas em Ubuntu"
  fi
}

install_base_packages() {
  log "Instalando pacotes base"
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    openssl \
    apt-transport-https \
    software-properties-common
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    log "Docker ja instalado"
    return
  fi

  log "Instalando Docker Engine e Compose plugin"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  . /etc/os-release
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

  systemctl enable docker
  systemctl restart docker
}

ensure_env_file() {
  if [ ! -f "${ENV_FILE}" ]; then
    log "Criando ${ENV_FILE} a partir do modelo"
    cp "${EXAMPLE_ENV_FILE}" "${ENV_FILE}"
  fi
}

set_env_var() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" "${ENV_FILE}"; then
    sed -i "s|^${key}=.*$|${key}=${value}|" "${ENV_FILE}"
  else
    printf '%s=%s\n' "${key}" "${value}" >> "${ENV_FILE}"
  fi
}

maybe_generate_secret() {
  local key="$1"
  local current
  current="$(grep "^${key}=" "${ENV_FILE}" | cut -d= -f2- || true)"
  if [ -z "${current}" ] || [[ "${current}" == gere-* ]]; then
    set_env_var "${key}" "$(openssl rand -base64 32 | tr -d '\n')"
  fi
}

load_env() {
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
}

validate_dns() {
  log "Validando DNS"
  getent hosts "${BACKEND_DOMAIN}" >/dev/null 2>&1 || fail "DNS do backend nao resolve: ${BACKEND_DOMAIN}"
  getent hosts "${FRONTEND_DOMAIN}" >/dev/null 2>&1 || fail "DNS do frontend nao resolve: ${FRONTEND_DOMAIN}"
}

deploy_stack() {
  log "Subindo stack em producao"
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build
}

run_seeds_if_requested() {
  if [ "${RUN_SEEDS:-false}" = "true" ]; then
    log "Executando seeds iniciais"
    docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" --profile tools run --rm backend_seed
  else
    log "Seeds nao executadas automaticamente. Use RUN_SEEDS=true se o banco estiver vazio."
  fi
}

show_status() {
  log "Status dos containers"
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps
}

main() {
  require_root
  require_ubuntu
  install_base_packages
  install_docker
  ensure_env_file

  set_env_var "FRONTEND_DOMAIN" "appizing.hdtech.dev.br"
  set_env_var "BACKEND_DOMAIN" "minhaapi.hdtech.dev.br"
  set_env_var "VUE_URL_API" "https://minhaapi.hdtech.dev.br"
  set_env_var "BACKEND_URL" "https://minhaapi.hdtech.dev.br"
  set_env_var "FRONTEND_URL" "https://appizing.hdtech.dev.br"
  maybe_generate_secret "JWT_SECRET"
  maybe_generate_secret "JWT_REFRESH_SECRET"

  load_env
  validate_dns
  deploy_stack
  run_seeds_if_requested
  show_status

  log "Concluido"
  log "Frontend: https://${FRONTEND_DOMAIN}"
  log "Backend: https://${BACKEND_DOMAIN}/health"
}

main "$@"
