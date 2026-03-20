#!/usr/bin/env bash
set -euo pipefail

TARBALL="${1:?Usage: deploy-frontend.sh <path-to-tarball>}"
DEPLOY_ROOT="/opt/gamenight-hub"
DIST_DIR="${DEPLOY_ROOT}/frontend/dist/gamenight-hub"

mkdir -p "${DIST_DIR}"

rm -rf "${DIST_DIR}/browser.new"
mkdir -p "${DIST_DIR}/browser.new"
tar -xzf "${TARBALL}" -C "${DIST_DIR}/browser.new"

if [ -d "${DIST_DIR}/browser" ]; then
  mv "${DIST_DIR}/browser" "${DIST_DIR}/browser.old"
fi

mv "${DIST_DIR}/browser.new" "${DIST_DIR}/browser"

rm -rf "${DIST_DIR}/browser.old"

docker restart gamenight-hub-nginx-1

echo "Frontend deployed successfully from ${TARBALL}"
