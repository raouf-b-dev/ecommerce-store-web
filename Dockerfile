# syntax=docker/dockerfile:1
# Storefront production image: Next.js standalone output, following the
# official example (vercel/next.js examples/with-docker).

# -- Stage 1: deps --------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# -- Stage 2: build -------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time config. next build inlines NEXT_PUBLIC_* and standalone output
# freezes next.config.ts, so these cannot change at run time (.env.example).
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_STOREFRONT_ORIGIN
ARG NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS=
ARG NEXT_PUBLIC_ALLOW_LOOPBACK_ORIGIN=
ARG IMAGES_ALLOW_LOCAL_IP=
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT_STANDALONE=true
RUN npm run build

# -- Stage 3: production --------------------------------------------------------
FROM node:24-alpine AS production
WORKDIR /app

# tini: proper PID 1 init - forwards SIGTERM to Node.js for graceful shutdown
RUN apk add --no-cache tini

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100
ENV HOSTNAME=0.0.0.0

# Run-time config: API_BASE_URL (browser, via /runtime-config.js) and
# API_INTERNAL_BASE_URL (server-side fetches). Both default to the build-time
# NEXT_PUBLIC_API_BASE_URL.
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE $PORT

# Liveness check - static asset, no API call
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:${PORT}/icon.svg || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["node", "server.js"]
