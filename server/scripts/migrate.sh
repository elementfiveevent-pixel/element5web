#!/bin/sh

# ==========================================
# ELEMENT 5 — PRISMA MIGRATION RUNNER
# ==========================================

set -e

echo "⏳ [Prisma] Running migrations..."
npx prisma migrate deploy

echo "⏳ [Prisma] Generating client types..."
npx prisma generate

echo "⏳ [Prisma] Seeding initial database records..."
npx prisma db seed

echo "🚀 [Prisma] Database environment is fully up-to-date and ready!"
