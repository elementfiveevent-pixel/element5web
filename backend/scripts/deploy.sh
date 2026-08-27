#!/bin/sh

# ==========================================
# ELEMENT 5 — PRODUCTION DEPLOYMENT UTILITY
# ==========================================

set -e

echo "🚀 Starting Element 5 Platform Deployment..."

# 1. Pull latest images and build container stacks
echo "🐳 Rebuilding Docker Compose service layers..."
docker-compose -f docker-compose.yml build --no-cache

# 2. Restart container stacks
echo "🐳 Booting up postgres, redis, backend, and nginx..."
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml up -d

# 3. Wait for PostgreSQL container health check
echo "⏳ Waiting for PostgreSQL database to become healthy..."
until [ "$(docker inspect --format='{{json .State.Health.Status}}' element5_postgres)" = "\"healthy\"" ]; do
    sleep 2
    printf "."
done
echo ""

# 4. Run Prisma database migrations and seed inside the container
echo "⚙️ Executing database migrations and seeding..."
docker exec -it element5_backend ./scripts/migrate.sh

echo "🎉 Deployment finished successfully! NGINX reverse proxy is listening on ports 80/443."
