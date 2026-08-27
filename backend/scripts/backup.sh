#!/bin/sh

# ==========================================
# ELEMENT 5 — POSTGRESQL BACKUP SCRIPT
# ==========================================

# Exit immediately if any command fails
set -e

BACKUP_DIR="/var/backups/element5"
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/element5_db_backup_${DATE}.sql.gz"

# Create backup folder if not exists
mkdir -p "${BACKUP_DIR}"

echo "📅 [$(date)] Starting PostgreSQL Backup..."

# Run pg_dump inside the docker container or directly
# Check if running under Docker Compose
if docker ps | grep -q "element5_postgres"; then
    echo "🐳 Exporting Postgres container database..."
    docker exec element5_postgres pg_dump -U element5_user -d element5_db | gzip > "${BACKUP_FILE}"
else
    echo "💻 Exporting local host database..."
    pg_dump -h localhost -U element5_user -d element5_db | gzip > "${BACKUP_FILE}"
fi

# Keep only the last 30 backups to avoid disk exhaustion
find "${BACKUP_DIR}" -type f -name "element5_db_backup_*.sql.gz" -mtime +30 -delete

echo "✅ Backup complete: ${BACKUP_FILE}"
echo "📁 Current disk usage in backup directory:"
du -sh "${BACKUP_DIR}"
