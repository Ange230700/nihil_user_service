# user\Dockerfile

# Base stage
FROM node:24-alpine3.21 AS base
WORKDIR /app

# --- Deps + Dev toolchain ---
FROM base AS deps
COPY package*.json ./
RUN npm i

# --- Build target workspace ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json tsconfig.json
COPY src src
COPY scripts scripts
RUN npm run build

# --- Prod deps only (clean, small) ---
FROM base AS prod-deps
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi


# --- Runtime ---
FROM node:24-alpine3.21
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S appgroup && adduser -S -G appgroup appuser
COPY --from=build /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package*.json ./
RUN mkdir -p ./src/api
COPY src/api/swagger.yaml ./src/api/swagger.yaml
USER appuser
EXPOSE 3000
CMD ["node", "dist/api/server.js"]
