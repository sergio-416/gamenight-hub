# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# Copy workspace config first (for layer caching)
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY backend/ ./backend/

# Build backend (still uses Node/tsc — bun is package manager only)
WORKDIR /app/backend
RUN bun run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copy workspace config
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

COPY --from=builder /usr/local/bin/bun /usr/local/bin/bun
RUN bun install --frozen-lockfile --production && bun add tsx

# Copy built output and shared source (consumed as TypeScript source)
COPY packages/shared/ ./packages/shared/
COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/src/database/migrations ./backend/src/database/migrations
COPY backend/entrypoint.sh ./backend/entrypoint.sh

WORKDIR /app/backend

# Non-root user for security
RUN addgroup -g 1001 -S nestjs && \
    adduser -S nestjs -u 1001 -G nestjs && \
    chmod +x /app/backend/entrypoint.sh
USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD ["node", "-e", "fetch('http://localhost:3000/api/v1/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]

ENTRYPOINT ["/app/backend/entrypoint.sh"]
