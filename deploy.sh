#!/bin/bash
# SalesOrbit — production deploy / update script
# Run on the VPS after first-time setup is complete.
# Usage: ./deploy.sh

set -e

# Auto-detect app directory: use the folder this script lives in
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="/var/log/salesorbit"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; }

echo ""
echo "╔══════════════════════════════════╗"
echo "║   SalesOrbit — Deploy / Update   ║"
echo "╚══════════════════════════════════╝"
echo ""

cd "$APP_DIR"

# ── Pull latest code ──────────────────────────────────────────────────────────
info "Pulling latest code from main..."
git pull origin main
ok "Code updated"

# ── Backend dependencies (production only — no devDeps needed at runtime) ─────
info "Installing backend dependencies..."
cd backend
npm install --omit=dev
cd ..
ok "Backend dependencies installed"

# ── Frontend build ────────────────────────────────────────────────────────────
# NOTE: must use full `npm install` (NOT --omit=dev) because vite and
# @vitejs/plugin-react are devDependencies required at build time.
info "Installing frontend dependencies (including build tools)..."
npm install
info "Building frontend..."
npm run build
ok "Frontend built → dist/"

# ── Restart backend ───────────────────────────────────────────────────────────
info "Restarting backend with PM2..."
mkdir -p "$LOG_DIR"
if pm2 describe salesorbit > /dev/null 2>&1; then
  pm2 reload salesorbit --update-env
else
  pm2 start backend/ecosystem.config.js --env production
fi
pm2 save
ok "Backend restarted"

# ── Health check ──────────────────────────────────────────────────────────────
info "Checking health endpoint..."
sleep 3
if curl -sf http://localhost:5001/health > /dev/null; then
  ok "Backend is healthy"
else
  err "Health check failed — checking PM2 logs..."
  pm2 logs salesorbit --lines 20 --nostream || true
  exit 1
fi

echo ""
ok "Deploy complete! App is live."
pm2 status salesorbit
