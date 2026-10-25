# Образ Mini Task Manager: багатоетапна збірка (React-клієнт + Express-сервер).
# Збірка:  docker build -t mini-task-manager:1.0 --build-arg APP_VERSION=1.0 .
# Запуск:  docker run -d -p 3000:3000 --env-file .env mini-task-manager:1.0

# ---------- Етап 1: збірка React-клієнта (Vite) ----------
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---------- Етап 2: production-залежності бекенду ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- Етап 3: фінальний образ ----------
FROM node:22-alpine
LABEL maintainer="Yurii (SilentProg) <https://github.com/SilentProg>" \
      org.opencontainers.image.title="mini-task-manager" \
      org.opencontainers.image.source="https://github.com/SilentProg/mini-task-manager"

ARG APP_VERSION=dev
ENV NODE_ENV=production \
    PORT=3000 \
    APP_VERSION=${APP_VERSION}

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json server.js db.js init.sql ./
COPY --from=client-build /app/client/dist ./client/dist

# Процес працює не від root
USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
