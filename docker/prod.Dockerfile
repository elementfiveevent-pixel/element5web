# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install only production dependencies and prisma CLI for migrations
RUN npm ci --only=production && npm install prisma

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "dist/main"]
