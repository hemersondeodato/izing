# Deploy em Docker para `appizing.hdtech.dev.br` e `minhaapi.hdtech.dev.br`

Esta stack sobe o projeto inteiro em containers:

- `postgres`
- `redis`
- `backend`
- `frontend`
- `caddy` com HTTPS automatico

## Premissas

- O DNS de `appizing.hdtech.dev.br` e `minhaapi.hdtech.dev.br` deve apontar para o IP da VPS.
- As portas `80` e `443` precisam estar liberadas.
- Docker e Docker Compose plugin precisam estar instalados na VPS.

## 1. Preparar variaveis

Na raiz do projeto:

```bash
cp .env.production.example .env.production
```

Edite o arquivo `.env.production` e ajuste pelo menos:

- `FRONTEND_DOMAIN`
- `BACKEND_DOMAIN`
- `LETSENCRYPT_EMAIL`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ADMIN_DOMAIN`

Gerar segredos:

```bash
openssl rand -base64 32
openssl rand -base64 32
```

## 2. Subir a stack

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

Ou usar o instalador unico:

```bash
chmod +x scripts/install_production_ubuntu.sh
./scripts/install_production_ubuntu.sh
```

## 3. Popular dados iniciais

As seeds deste projeto nao sao idempotentes. Por isso elas nao rodam automaticamente no boot.

Execute apenas na primeira instalacao, com banco vazio:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml --profile tools run --rm backend_seed
```

Usuarios padrao criados pelas seeds:

- `super@izing.io`
- `admin@izing.io`
- senha: `123456`

## 4. Verificar containers

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs -f caddy
docker compose --env-file .env.production -f docker-compose.production.yml logs -f backend
```

## 5. Atualizar

```bash
git pull
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

## Observacoes

- O backend fica interno na rede Docker e e publicado pelo `caddy`.
- O frontend usa `VUE_URL_API=https://minhaapi.hdtech.dev.br`.
- Uploads e autenticacao do WhatsApp ficam persistidos em volumes Docker.
- `RUN_MIGRATIONS=true` e o backend aplica migrations ao iniciar.
