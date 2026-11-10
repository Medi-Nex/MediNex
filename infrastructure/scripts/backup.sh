#!/usr/bin/env bash
# ==============================================================================
# MediNex PostgreSQL Database Backup Utility
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="${POSTGRES_CONTAINER:-medinex-postgres}"
DB_NAME="${POSTGRES_DB:-medinex_db}"
DB_USER="${POSTGRES_USER:-medinex_user}"
BACKUP_FILE="${BACKUP_DIR}/medinex_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u)] Starting database backup for '${DB_NAME}' from container '${CONTAINER_NAME}'..."
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner | gzip > "${BACKUP_FILE}"

echo "[$(date -u)] Backup completed successfully: ${BACKUP_FILE}"

# Keep last 14 days of backups
find "${BACKUP_DIR}" -name "medinex_backup_*.sql.gz" -mtime +14 -exec rm {} \; 2>/dev/null || true
echo "[$(date -u)] Backup retention policy applied (14 days retained)."
