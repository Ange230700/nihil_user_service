# user\Dockerfile

# --- Build Stage ---
FROM node:24-alpine3.21 AS build
WORKDIR /app
COPY user ./user
COPY tsconfig.base.json .
WORKDIR /app/user
RUN npm i
RUN npm run build

# --- Production Stage ---
FROM node:24-alpine3.21
WORKDIR /app
RUN addgroup -S appgroup && \
    adduser -S -G appgroup appuser
COPY --from=build /app/user/dist ./dist
COPY --from=build /app/user/package*.json ./
COPY --from=build /app/user/node_modules ./node_modules
USER appuser
EXPOSE 3000
CMD ["node", "dist/src/api/server.js"]
