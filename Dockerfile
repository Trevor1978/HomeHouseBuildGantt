# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime: serve static app + persisted API
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV DATA_FILE=/data/project.json
COPY --from=build /app/dist ./dist
COPY server.mjs ./server.mjs
VOLUME ["/data"]
EXPOSE 3100
HEALTHCHECK CMD wget -qO- http://127.0.0.1:3100/ || exit 1
CMD ["node", "server.mjs"]
