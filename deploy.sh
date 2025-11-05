#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/expertauto_working_1"
DC="docker compose --env-file ${APP_DIR}/.env -f ${APP_DIR}/infra/docker-compose.prod.yml"

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
