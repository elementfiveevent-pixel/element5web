#!/bin/sh

# ==========================================
# ELEMENT 5 — POSTGRESQL MIGRATION RUNNER
# ==========================================

set -e

echo "⏳ Running database migrations via Node.js pg client..."
node "$(dirname "$0")/migrate.js"

echo "🚀 Database environment is fully up-to-date and ready!"
