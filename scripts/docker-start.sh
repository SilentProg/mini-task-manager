#!/usr/bin/env bash
# Запуск Mini Task Manager у Docker однією командою.
# Використання:
#   ./scripts/docker-start.sh               # зібрати й запустити стек nginx + app + MySQL
#   ./scripts/docker-start.sh --monitoring  # те саме + cAdvisor і Prometheus
#   ./scripts/docker-start.sh stop          # зупинити стек (дані MySQL зберігаються)
#   ./scripts/docker-start.sh status        # стан контейнерів
#   ./scripts/docker-start.sh logs          # журнали застосунку
#
# Якщо .env немає, скрипт створить його з .env.example і згенерує випадкові паролі та JWT_SECRET.
set -euo pipefail

cd "$(dirname "$0")/.."

COMMAND="up"
MONITORING=0
for arg in "$@"; do
  case "${arg}" in
    --monitoring|-m) MONITORING=1 ;;
    up|stop|status|logs) COMMAND="${arg}" ;;
    *) echo "Невідомий параметр: ${arg}"; sed -n '2,8p' "$0"; exit 1 ;;
  esac
done

COMPOSE_FILES=(-f docker-compose.yml)
compose() { docker compose "${COMPOSE_FILES[@]}" "$@"; }

random_secret() { head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

# Значення змінної з .env (або типове)
env_value() {
  local value
  value=$(grep -E "^$1=" .env | tail -n1 | cut -d= -f2- || true)
  echo "${value:-$2}"
}

check_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker не встановлено: https://docs.docker.com/engine/install/"; exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    echo "Потрібен плагін Docker Compose v2 (команда \"docker compose\")"; exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "Немає доступу до Docker daemon: запустіть його або виконайте скрипт через sudo"; exit 1
  fi
}

prepare_env() {
  if [ -f .env ]; then
    if grep -qE '=change_me' .env; then
      echo "Увага: у .env лишилися значення change_me_*, замініть їх на свої паролі"
    fi
    return
  fi
  echo ">>> Створюю .env з .env.example і генерую паролі"
  cp .env.example .env
  sed -i \
    -e "s/^MYSQL_ROOT_PASSWORD=.*/MYSQL_ROOT_PASSWORD=$(random_secret)/" \
    -e "s/^DB_PASSWORD=.*/DB_PASSWORD=$(random_secret)/" \
    -e "s/^JWT_SECRET=.*/JWT_SECRET=$(random_secret)/" \
    .env
  chmod 600 .env
}

# Порт зайнятий іншим процесом, а не нашим nginx
port_busy() {
  command -v ss >/dev/null 2>&1 || return 1
  ss -ltn | awk '{print $4}' | grep -qE "[:.]$1\$" || return 1
  ! compose ps -q nginx 2>/dev/null | grep -q .
}

wait_healthy() {
  local url="http://localhost:$1/api/health"
  echo -n ">>> Чекаю, поки застосунок відповість на ${url} "
  for _ in $(seq 1 60); do
    if curl -fsS "${url}" >/dev/null 2>&1 || wget -qO- "${url}" >/dev/null 2>&1; then
      echo " ok"
      return 0
    fi
    echo -n "."; sleep 3
  done
  echo
  echo "Застосунок не відповів за 3 хвилини. Журнали: ./scripts/docker-start.sh logs"
  return 1
}

check_docker

# Моніторинг підключаємо, якщо його попросили або він уже запущений
if [ "${MONITORING}" -eq 1 ] || docker ps -q --filter name=cadvisor | grep -q .; then
  COMPOSE_FILES+=(-f docker-compose.monitoring.yml)
fi

case "${COMMAND}" in
  stop)
    compose down
    exit 0 ;;
  status)
    compose ps
    exit 0 ;;
  logs)
    compose logs -f --tail=100 app
    exit 0 ;;
esac

prepare_env
NGINX_PORT=$(env_value NGINX_PORT 8088)

if port_busy "${NGINX_PORT}"; then
  echo "Порт ${NGINX_PORT} уже зайнятий іншим процесом. Змініть NGINX_PORT у .env або звільніть порт:"
  echo "  sudo ss -ltnp 'sport = :${NGINX_PORT}'"
  exit 1
fi

echo ">>> Збираю образ і запускаю стек"
compose up -d --build

wait_healthy "${NGINX_PORT}"

echo
compose ps
echo
# Порти опубліковано лише на 127.0.0.1, назовні все доступно через nginx на хості (docker/nginx/host-proxy.conf)
echo "Застосунок:  http://localhost:${NGINX_PORT}   https://tasks.kprojectgemfk.xyz"
if [ "${#COMPOSE_FILES[@]}" -gt 2 ]; then
  echo "cAdvisor:    http://localhost:8082   https://cadvisor.kprojectgemfk.xyz"
  echo "Prometheus:  http://localhost:9090   https://prometheus.kprojectgemfk.xyz"
fi
echo "(localhost-адреси працюють лише на самому сервері)"
