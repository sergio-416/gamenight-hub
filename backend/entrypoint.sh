#!/bin/sh
set -e
echo "Starting application..."
exec node --import tsx dist/backend/src/main.js
