# syntax=docker/dockerfile:1

# Multi-target build: `docker build --target server .` or `--target client .`
# docker-compose.yml builds both.

ARG NODE_VERSION=22-bookworm-slim

# ---------- Server ----------
FROM node:${NODE_VERSION} AS server-deps
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

FROM node:${NODE_VERSION} AS server
ENV NODE_ENV=production
WORKDIR /app
COPY --from=server-deps /app/node_modules ./node_modules
COPY server/package.json server/tsconfig.json ./
COPY server/src ./src
USER node
EXPOSE 3001
# tsx runs the TypeScript directly and resolves the "@/..." tsconfig paths
CMD ["node_modules/.bin/tsx", "src/index.ts"]

# ---------- Client ----------
FROM node:${NODE_VERSION} AS client-deps
WORKDIR /app
COPY client/package.json client/package-lock.json ./
RUN npm ci

FROM node:${NODE_VERSION} AS client-build
WORKDIR /app
# Both are baked in at build time: NEXT_PUBLIC_* is inlined into the bundle,
# and the /api rewrite destination is serialized into the standalone server
ARG NEXT_PUBLIC_API_URL=/api
ARG SERVER_API_URL=http://server:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
	SERVER_API_URL=${SERVER_API_URL} \
	NEXT_TELEMETRY_DISABLED=1
COPY --from=client-deps /app/node_modules ./node_modules
COPY client/ ./
RUN npm run build

FROM node:${NODE_VERSION} AS client
ENV NODE_ENV=production \
	NEXT_TELEMETRY_DISABLED=1 \
	HOSTNAME=0.0.0.0 \
	PORT=3000
WORKDIR /app
COPY --from=client-build --chown=node:node /app/.next/standalone ./
COPY --from=client-build --chown=node:node /app/.next/static ./.next/static
COPY --from=client-build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
