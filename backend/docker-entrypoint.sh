#!/bin/sh
# Arranque del contenedor del backend.
# 1. Si la base llega por partes (DB_HOST, DB_PORT, DB_NAME), arma DB_URL.
# 2. Si la base está vacía, aplica los scripts de database/, porque el backend usa
#    ddl-auto=validate y no crea las tablas por su cuenta.
# 3. Arranca la aplicación en el puerto que indique PORT (8080 por defecto).
set -e

if [ -z "$DB_URL" ] && [ -n "$DB_HOST" ]; then
  export DB_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
fi

if [ -n "$DB_HOST" ]; then
  export PGHOST="$DB_HOST" PGPORT="${DB_PORT:-5432}" PGDATABASE="$DB_NAME" \
         PGUSER="$DB_USERNAME" PGPASSWORD="$DB_PASSWORD" PGCLIENTENCODING=UTF8
  tablas=$(psql -At -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")
  if [ "$tablas" = "0" ]; then
    echo "Base vacía: aplicando los scripts de database/"
    for archivo in 01_shopcloud_postgresql.sql 02_suscripciones_prueba_gratuita.sql 03_datos_iniciales_planes.sql; do
      psql -q -v ON_ERROR_STOP=1 -f "/app/database/$archivo"
      echo "Aplicado: $archivo"
    done
  fi
  unset PGPASSWORD
fi

exec java -XX:MaxRAMPercentage=75 -jar /app/app.jar --server.port="${PORT:-8080}"
