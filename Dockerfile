# Build the static client, then run the game server (which serves it).
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY shared ./shared
COPY --from=build /app/client/dist ./client/dist
# must match fly.toml's internal_port/PORT — Fly's launch scanner reads this
EXPOSE 8080
CMD ["node", "server/index.js"]
