#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:?Usage: rollback.sh <image-tag>}"
DEPLOY_ROOT="/opt/gamenight-hub"
IMAGE="ghcr.io/sergio-416/gamenight-hub/backend"
CONTAINER="gamenight-hub-backend-1"

cd "${DEPLOY_ROOT}"

docker pull "${IMAGE}:${IMAGE_TAG}"
docker tag "${IMAGE}:${IMAGE_TAG}" "${IMAGE}:latest"

docker compose -f docker-compose.prod.yml up -d --no-deps backend

SECONDS_WAITED=0
MAX_WAIT=60

while [ "${SECONDS_WAITED}" -lt "${MAX_WAIT}" ]; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${CONTAINER}" 2>/dev/null || echo "unknown")
  if [ "${STATUS}" = "healthy" ]; then
    echo "Rollback successful to ${IMAGE}:${IMAGE_TAG}"
    exit 0
  fi
  sleep 2
  SECONDS_WAITED=$((SECONDS_WAITED + 2))
done

echo "Rollback health check failed after ${MAX_WAIT}s (status: ${STATUS})"
exit 1
