#!/bin/bash
set -euo pipefail

ENV_FILE="/opt/gamenight-hub/.env"
BACKUP_DIR="/opt/gamenight-hub/backups"
COMPOSE_PROJECT="gamenight-hub"
CONTAINER="${COMPOSE_PROJECT}-postgres-1"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

source "${ENV_FILE}"

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

docker exec "${CONTAINER}" pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup complete: ${BACKUP_FILE}"
