#!/bin/sh
set -e

echo "Waiting for MySQL to start..."
# Aguardar até que o MySQL esteja disponível
until nc -z -v -w30 mysql 3306
do
  echo "Waiting for MySQL to be available..."
  sleep 2
done
echo "MySQL is up and running!"

# Executar migrações do Prisma
echo "Running database migrations..."
npx prisma migrate deploy

# Iniciar a aplicação
echo "Starting application..."
exec "$@"

