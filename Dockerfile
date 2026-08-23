# Stage 1: Base
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Stage 3: Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Stage 4: Production
FROM base AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001

# Copy standalone output and static files
COPY --from=builder --chown=bunuser:bunuser /app/public ./public
COPY --from=builder --chown=bunuser:bunuser /app/.next/standalone ./
COPY --from=builder --chown=bunuser:bunuser /app/.next/static ./.next/static

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Switch to non-root user
USER bunuser

# Expose port
EXPOSE 3000

# Health check — package.json sets "type": "module", so Bun runs this in ESM mode.
# Must use dynamic import() instead of require() (which is undefined in ESM).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun -e "import('http').then(http => { http.get('http://localhost:3000', r => process.exit(r.statusCode === 200 ? 0 : 1)) }).catch(() => process.exit(1))"

# Start standalone application (use `bun run` for proper script resolution)
CMD ["bun", "run", "server.js"]