#!/bin/sh

# ==========================================
# ELEMENT 5 — POSTGRESQL RESTORE SCRIPT
# ==========================================

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Please specify the path to the backup file."
    echo "Usage: ./restore.sh /path/to/backup_file.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Error: Backup file not found at ${BACKUP_FILE}"
    exit 1
fi

echo "⚠️ WARNING: This will overwrite the current 'element5_db' database!"
echo "Press Ctrl+C to abort, or Enter to continue..."
read -r _unused_input

echo "⏳ Restoring database from ${BACKUP_FILE}..."

# Decompress and feed into psql
if docker ps | grep -q "element5_postgres"; then
    echo "🐳 Restoring inside element5_postgres container..."
    gunzip -c "${BACKUP_FILE}" | docker exec -i element5_postgres psql -U element5_user -d element5_db
else
    echo "💻 Restoring inside local host postgres..."
    gunzip -c "${BACKUP_FILE}" | psql -h localhost -U element5_user -d element5_db
fi

echo "✅ Database restore completed successfully!"
