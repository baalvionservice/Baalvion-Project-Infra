#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start-backend.sh — Boot the Baalvion backend cluster locally
# Run from repo root: ./start-backend.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE_DIR="deploy/consolidated"
ENV_FILE="$COMPOSE_DIR/.env"
BASE_COMPOSE="$COMPOSE_DIR/docker-compose.yml"
LOCAL_COMPOSE="$COMPOSE_DIR/docker-compose.local.yml"

echo "🚀 Baalvion Backend — Local Dev Startup"
echo "========================================"

# Check Docker is running
if ! docker info &>/dev/null; then
  echo "❌ Docker is not running. Please start Docker Desktop first."
  exit 1
fi
echo "✅ Docker is running"

# Check .env exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE not found. Creating from example..."
  cp "$COMPOSE_DIR/.env.example" "$ENV_FILE"
  echo "⚠️  Edit $ENV_FILE and set your secrets, then re-run."
  exit 1
fi
echo "✅ $ENV_FILE exists"

# Build & start
echo ""
echo "📦 Building images (first run takes ~5min, subsequent runs are fast)..."
docker compose \
  --env-file "$ENV_FILE" \
  -f "$BASE_COMPOSE" \
  -f "$LOCAL_COMPOSE" \
  up -d --build

echo ""
echo "⏳ Waiting for auth-service health check..."
for i in {1..30}; do
  if curl -sf http://localhost:3001/health &>/dev/null; then
    echo "✅ auth-service is healthy!"
    break
  fi
  sleep 5
  echo "   still waiting... ($((i*5))s)"
done

echo ""
echo "🎉 Backend cluster is up!"
echo ""
echo "Service Endpoints:"
echo "  Auth Service:       http://localhost:3001/health"
echo "  Auth Gateway (BFF): http://localhost:3026"
echo "  Realtime (WS):      ws://localhost:3040"
echo "  Community Service:  http://localhost:3064/health"
echo "  Admin Service:      http://localhost:3021/health"
echo "  Notification Svc:   http://localhost:3031/health"
echo ""
echo "Frontend at:          http://localhost:9004"
echo ""
echo "To view logs:         docker compose -f $BASE_COMPOSE -f $LOCAL_COMPOSE logs -f"
echo "To stop:              docker compose -f $BASE_COMPOSE -f $LOCAL_COMPOSE down"
