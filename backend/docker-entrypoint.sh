#!/bin/sh

set -eu

echo "Aguardando dependencias..."
sleep 3

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Aplicando migrations..."
  npx sequelize-cli db:migrate
fi

echo "Iniciando backend..."
exec pm2-docker start ./dist/server.js
