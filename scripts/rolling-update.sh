#!/usr/bin/env bash
# Оновлення застосунку до нової версії без простою (rolling update у Docker Compose).
# Використання: ./scripts/rolling-update.sh 1.1
#
# 1. Збирає образ нової версії.
# 2. Поруч зі старими екземплярами запускає стільки ж нових і чекає, поки вони стануть healthy.
# 3. По одному зупиняє старі екземпляри: nginx уже шле запити на нові.
set -euo pipefail

NEW_VERSION="${1:?Вкажіть нову версію, наприклад: $0 1.1}"
cd "$(dirname "$0")/.."

# Запам'ятовуємо версію в .env, щоб наступний "docker compose up" не повернув стару
if grep -q '^APP_VERSION=' .env; then
  sed -i "s/^APP_VERSION=.*/APP_VERSION=${NEW_VERSION}/" .env
else
  echo "APP_VERSION=${NEW_VERSION}" >> .env
fi
export APP_VERSION="${NEW_VERSION}"

echo ">>> Збираю образ версії ${NEW_VERSION}"
docker compose build app

OLD_IDS=$(docker compose ps -q app)
COUNT=$(echo "${OLD_IDS}" | grep -c . || true)
if [ "${COUNT}" -eq 0 ]; then
  echo "Застосунок не запущено, просто стартую стек"
  docker compose up -d
  exit 0
fi

echo ">>> Запускаю ${COUNT} нових екземплярів поруч зі старими"
docker compose up -d --no-deps --no-recreate --scale app=$((COUNT * 2)) app

NEW_IDS=$(docker compose ps -q app | grep -v -F "${OLD_IDS}")
for id in ${NEW_IDS}; do
  echo -n "    чекаю healthy: $(docker inspect -f '{{.Name}}' "${id}") "
  for _ in $(seq 1 60); do
    [ "$(docker inspect -f '{{.State.Health.Status}}' "${id}")" = "healthy" ] && break
    echo -n "."; sleep 2
  done
  if [ "$(docker inspect -f '{{.State.Health.Status}}' "${id}")" != "healthy" ]; then
    echo " новий екземпляр не став healthy, старі залишаю працювати"; exit 1
  fi
  echo " ok"
done

echo ">>> Зупиняю старі екземпляри"
for id in ${OLD_IDS}; do
  docker stop -t 10 "${id}" >/dev/null
  docker rm "${id}" >/dev/null
  echo "    видалено $(echo "${id}" | cut -c1-12)"
done

echo ">>> Готово:"
docker compose ps app
