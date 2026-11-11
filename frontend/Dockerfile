# ==============================================================================
# MEDINEX FRONTEND MULTI-STAGE DOCKERFILE
# Language / Runtime: Node.js 22 LTS on Alpine Linux
# Framework: Next.js 15 App Router
# Security: Non-root execution, minimal attack surface, standalone output
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependencies Installation
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Production Build
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build (inline NEXT_PUBLIC_* into client bundle)
ARG NEXT_PUBLIC_APP_NAME="MediNex"
ARG NEXT_PUBLIC_APP_TAGLINE="Connecting Technology, Research & Healthcare Innovation."
ARG NEXT_PUBLIC_APP_URL="http://localhost:3002"
ARG NEXT_PUBLIC_API_BASE_URL=""

ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_PUBLIC_APP_TAGLINE=${NEXT_PUBLIC_APP_TAGLINE}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Minimal Production Runner
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install wget for Docker health check
RUN apk add --no-cache wget

# Create non-root system user & group
RUN addgroup --system --gid 10001 nodejs && \
    adduser --system --uid 10001 nextjs

# Copy public static files
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Docker healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
