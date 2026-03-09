#!/usr/bin/env bash

set -Eeuo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${BACKEND_DIR:-${REPO_DIR}/backend}"
FRONTEND_DIR="${FRONTEND_DIR:-${REPO_DIR}/frontend}"
BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-${BACKEND_DIR}/.env}"
FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE:-${FRONTEND_DIR}/.env}"
BACKUP_ROOT="${BACKUP_ROOT:-${REPO_DIR}/backups}"
BRANCH="${BRANCH:-master}"
REMOTE_NAME="${REMOTE_NAME:-origin}"
PM2_BACKEND_NAME="${PM2_BACKEND_NAME:-izing-backend}"
PM2_FRONTEND_NAME="${PM2_FRONTEND_NAME:-izing-frontend}"
RUN_DB_BACKUP="${RUN_DB_BACKUP:-true}"
RUN_FILES_BACKUP="${RUN_FILES_BACKUP:-true}"
ALLOW_DIRTY_WORKTREE="${ALLOW_DIRTY_WORKTREE:-false}"
BACKEND_NPM_INSTALL_ARGS="${BACKEND_NPM_INSTALL_ARGS:-}"
FRONTEND_NPM_INSTALL_ARGS="${FRONTEND_NPM_INSTALL_ARGS:-}"

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

warn() {
  printf '\n[AVISO] %s\n' "$*" >&2
}

fail() {
  printf '\n[ERRO] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "comando obrigatorio nao encontrado: $1"
}

require_file() {
  [ -f "$1" ] || fail "arquivo obrigatorio nao encontrado: $1"
}

load_env_file() {
  local env_file="$1"

  if [ -f "${env_file}" ]; then
    set -a
    # shellcheck disable=SC1090
    source "${env_file}"
    set +a
  fi
}

check_worktree() {
  if [ "${ALLOW_DIRTY_WORKTREE}" = "true" ]; then
    return
  fi

  if [ -n "$(git -C "${REPO_DIR}" status --porcelain --untracked-files=no)" ]; then
    fail "existem alteracoes locais versionadas. Faça commit/stash antes de atualizar ou use ALLOW_DIRTY_WORKTREE=true"
  fi
}

prepare_backup_dir() {
  mkdir -p "${BACKUP_DIR}"
}

backup_database() {
  [ "${RUN_DB_BACKUP}" = "true" ] || return

  require_cmd pg_dump

  local db_host="${POSTGRES_HOST:-localhost}"
  local db_port="${DB_PORT:-5432}"
  local db_name="${POSTGRES_DB:-wchats}"
  local db_user="${POSTGRES_USER:-postgres}"
  local db_password="${POSTGRES_PASSWORD:-}"
  local output_file="${BACKUP_DIR}/database-${db_name}.sql.gz"

  log "Gerando backup do banco em ${output_file}"
  PGPASSWORD="${db_password}" \
    pg_dump \
      --host "${db_host}" \
      --port "${db_port}" \
      --username "${db_user}" \
      --dbname "${db_name}" \
      --no-owner \
      --no-privileges \
    | gzip > "${output_file}"
}

backup_files() {
  [ "${RUN_FILES_BACKUP}" = "true" ] || return

  local files_to_backup=()

  if [ -d "${BACKEND_DIR}/public" ]; then
    files_to_backup+=("public")
  fi

  if [ -d "${BACKEND_DIR}/.wwebjs_auth" ]; then
    files_to_backup+=(".wwebjs_auth")
  fi

  if [ "${#files_to_backup[@]}" -eq 0 ]; then
    warn "nenhuma pasta de arquivos persistentes encontrada para backup"
    return
  fi

  log "Gerando backup dos arquivos persistentes"
  tar -C "${BACKEND_DIR}" -czf "${BACKUP_DIR}/backend-data.tar.gz" "${files_to_backup[@]}"
}

update_code() {
  log "Atualizando codigo do branch ${BRANCH}"
  git -C "${REPO_DIR}" fetch "${REMOTE_NAME}" "${BRANCH}"
  git -C "${REPO_DIR}" checkout "${BRANCH}"
  git -C "${REPO_DIR}" pull --ff-only "${REMOTE_NAME}" "${BRANCH}"
}

backend_install_and_build() {
  log "Instalando dependencias do backend"
  (
    cd "${BACKEND_DIR}"
    npm install ${BACKEND_NPM_INSTALL_ARGS}
  )

  log "Buildando backend"
  (
    cd "${BACKEND_DIR}"
    npm run build
  )
}

run_backend_migrations() {
  log "Aplicando migrations do backend"
  (
    cd "${BACKEND_DIR}"
    npx sequelize db:migrate
  )
}

restart_backend() {
  log "Reiniciando backend no PM2"

  if pm2 describe "${PM2_BACKEND_NAME}" >/dev/null 2>&1; then
    pm2 restart "${PM2_BACKEND_NAME}"
    return
  fi

  if [ -f "${BACKEND_DIR}/ecosystem.config.js" ]; then
    (
      cd "${BACKEND_DIR}"
      pm2 start ecosystem.config.js --only "${PM2_BACKEND_NAME}"
    )
    return
  fi

  (
    cd "${BACKEND_DIR}"
    pm2 start dist/server.js --name "${PM2_BACKEND_NAME}"
  )
}

frontend_install_and_build() {
  log "Instalando dependencias do frontend"
  (
    cd "${FRONTEND_DIR}"
    npm install ${FRONTEND_NPM_INSTALL_ARGS}
  )

  log "Buildando frontend"
  (
    cd "${FRONTEND_DIR}"
    npm run build
  )
}

restart_frontend() {
  log "Reiniciando frontend no PM2"

  if pm2 describe "${PM2_FRONTEND_NAME}" >/dev/null 2>&1; then
    pm2 restart "${PM2_FRONTEND_NAME}"
    return
  fi

  (
    cd "${FRONTEND_DIR}"
    pm2 start server.js --name "${PM2_FRONTEND_NAME}"
  )
}

save_pm2() {
  log "Salvando estado do PM2"
  pm2 save
}

show_summary() {
  log "Atualizacao concluida"
  printf 'Backups: %s\n' "${BACKUP_DIR}"
  pm2 list

  if [ -n "${BACKEND_URL:-}" ]; then
    printf 'Backend: %s/health\n' "${BACKEND_URL}"
  fi

  if [ -n "${FRONTEND_URL:-}" ]; then
    printf 'Frontend: %s\n' "${FRONTEND_URL}"
  fi
}

main() {
  require_cmd git
  require_cmd npm
  require_cmd node
  require_cmd pm2
  require_cmd tar

  require_file "${BACKEND_ENV_FILE}"
  require_file "${FRONTEND_DIR}/package.json"
  require_file "${BACKEND_DIR}/package.json"

  load_env_file "${BACKEND_ENV_FILE}"
  load_env_file "${FRONTEND_ENV_FILE}"

  check_worktree
  prepare_backup_dir
  backup_database
  backup_files
  update_code
  backend_install_and_build
  run_backend_migrations
  restart_backend
  frontend_install_and_build
  restart_frontend
  save_pm2
  show_summary
}

main "$@"
