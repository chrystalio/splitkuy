# syntax=docker/dockerfile:1
#
# SplitKuy — self-hosted Docker image
#
# Build:  docker build -t splitkuy .
# Run:    docker run -p 3000:3000 splitkuy
#
# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files only — layer cache stays valid when only source changes.
COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY . .

# Bundle the Next.js application.
RUN bun run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user (uid 1001) for the runtime.
# The uid/gid match common CI/container environments so volumes are readable.
RUN adduser -D -u 1001 nextjs

# curl is used by the HEALTHCHECK below (alpine doesn't ship it by default).
RUN apk add --no-cache curl

# Copy the standalone output from the build stage.
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./

# Copy static assets (public/ and .next/static/) that standalone doesn't include.
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Liveness probe: verify the server actually answers HTTP on /.
# Interval 30s, 3 retries, 5s timeout — sensible defaults for a Next.js server.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
