# Atualizacao em Producao Sem Docker

Este fluxo serve para instalacoes antigas do iZing que rodam com:

- `backend` em `PM2`
- `frontend` em `PM2`
- `PostgreSQL` fora de Docker
- `Redis` fora de Docker

O script abaixo atualiza o codigo sem apagar os dados do banco.

## O que o script faz

Antes de atualizar:

- gera backup do banco com `pg_dump`
- gera backup de `backend/public`
- gera backup de `backend/.wwebjs_auth`

Depois:

- faz `git fetch` e `git pull --ff-only`
- instala dependencias do backend
- builda backend
- aplica `sequelize db:migrate`
- reinicia o backend no `PM2`
- instala dependencias do frontend
- builda frontend
- reinicia o frontend no `PM2`
- executa `pm2 save`

## Requisitos

- Ubuntu
- `git`
- `node` e `npm`
- `pm2`
- `pg_dump` disponível
- arquivos `.env` já configurados em:
  - `backend/.env`
  - `frontend/.env`

Se faltar `pg_dump`, instale:

```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
```

## Uso

Na raiz do projeto:

```bash
chmod +x scripts/update_production_non_docker.sh
./scripts/update_production_non_docker.sh
```

## Variaveis opcionais

```bash
BRANCH=master
REMOTE_NAME=origin
PM2_BACKEND_NAME=izing-backend
PM2_FRONTEND_NAME=izing-frontend
RUN_DB_BACKUP=true
RUN_FILES_BACKUP=true
ALLOW_DIRTY_WORKTREE=false
```

Exemplo:

```bash
BRANCH=master PM2_BACKEND_NAME=izing-backend PM2_FRONTEND_NAME=izing-frontend ./scripts/update_production_non_docker.sh
```

## Onde ficam os backups

Os backups sao gravados em:

```bash
backups/AAAAmmdd-HHMMSS/
```

Arquivos esperados:

- `database-<nome-do-banco>.sql.gz`
- `backend-data.tar.gz`

## Cuidados

- o script nao executa `db:seed:all`
- o script nao remove nem recria o banco
- o script nao apaga `public` nem `.wwebjs_auth`
- se houver alteracoes locais versionadas, ele aborta por seguranca
