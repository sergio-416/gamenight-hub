# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# Copy workspace config first (for layer caching)
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY frontend/package.json ./frontend/

# Install ALL workspace dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY frontend/ ./frontend/

# Build frontend (still uses ng build — bun is package manager only)
WORKDIR /app/frontend
RUN bun run build

# ─── Stage 2: Static files via Nginx ─────────────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/frontend/dist/gamenight-hub/browser /usr/share/nginx/html

# SPA fallback + security headers
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s \
  CMD wget -q --spider http://localhost/ || exit 1
