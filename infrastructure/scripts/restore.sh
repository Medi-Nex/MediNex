#!/usr/bin/env bash
# ==============================================================================
# MediNex PostgreSQL Database Restore Utility
# ==============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${POSTGRES_CONTAINER:-medinex-postgres}"
DB_NAME="${POSTGRES_DB:-medinex_db}"
DB_USER="${POSTGRES_USER:-medinex_user}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' not found."
    exit 1
fi

echo "[$(date -u)] Restoring database '${DB_NAME}' from '${BACKUP_FILE}'..."

if [[ "${BACKUP_FILE}" == *.gz ]]; then
    gzip -dc "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"
else
    docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" < "${BACKUP_FILE}"
fi

echo "[$(date -u)] Restore completed successfully."
