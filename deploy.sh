#!/usr/bin/env bash
set -Eeuo pipefail

# Надёжный PATH для non-login SSH
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

APP_DIR="/opt/expertauto_working_1"
COMPOSE_FILE="${APP_DIR}/infra/docker-compose.prod.yml"
ENV_FILE="${APP_DIR}/.env"

# Говорим git, что этот каталог безопасный
git config --global --add safe.directory "${APP_DIR}" || true

# Находим docker + compose v2
DOCKER_BIN="$(command -v docker || true)"
if [ -z "$DOCKER_BIN" ]; then
  echo "ERROR: docker не найден в PATH=${PATH}" >&2
  exit 1
fi
if $DOCKER_BIN compose version >/dev/null 2>&1; then
  DC="$DOCKER_BIN compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE}"
else
  echo "ERROR: 'docker compose' (v2) недоступен." >&2
  exit 1
fi

echo "== Debug =="
echo "USER=$(whoami) HOST=$(hostname)"
echo "Docker: $($DOCKER_BIN --version)"
echo "Compose: $($DOCKER_BIN compose version)"
echo "APP_DIR=${APP_DIR}"
echo "ENV exists? $( [ -f "${ENV_FILE}" ] && echo yes || echo no )"
echo "================"

echo "[1/6] Pull latest code…"
cd "$APP_DIR"
git fetch --all --prune
git reset --hard origin/main

echo "[2/6] Build/Update images…"
$DC build --pull

echo "[3/6] Apply migrations…"
$DC run --rm -w /app backend python manage.py migrate --noinput

echo "[4/6] Collect static…"
$DC run --rm -w /app backend python manage.py collectstatic --noinput

echo "[5/6] Up containers…"
$DC up -d

echo "[6/6] Post-deploy check…"
$DC ps

echo "OK: deployed $(date -u +%Y-%m-%dT%H:%M:%SZ)"
