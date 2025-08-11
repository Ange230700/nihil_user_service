# user\Dockerfile

# --- Deps + Dev toolchain ---
FROM node:24-alpine3.21 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY user/package.json user/package.json
COPY post/package.json post/package.json
RUN npm ci

# --- Build target workspace ---
FROM node:24-alpine3.21 AS build
WORKDIR /app
COPY --from=deps /app /app/
COPY tsconfig.base.json tsconfig.base.json
COPY user/tsconfig.json user/tsconfig.json
COPY user/src user/src
RUN npm run --workspace=@nihil_backend/user build

# --- Runtime ---
FROM node:24-alpine3.21
WORKDIR /app
RUN addgroup -S appgroup && adduser -S -G appgroup appuser
COPY --from=build /app/user/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY user/package.json user/package.json
RUN npm prune --omit=dev
COPY user/src/api/swagger.yaml ./src/api/swagger.yaml
USER appuser
EXPOSE 3000
CMD ["node", "dist/api/server.js"]
