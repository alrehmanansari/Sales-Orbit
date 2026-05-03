#!/bin/bash
# SalesOrbit — production deploy / update script
# Run on the VPS after first-time setup is complete (see DEPLOYMENT.md).
# Usage: ./deploy.sh

set -e

APP_DIR="/var/www/salesorbit"
LOG_DIR="/var/log/salesorbit"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

echo ""
echo "╔══════════════════════════════════╗"
echo "║   SalesOrbit — Deploy / Update   ║"
echo "╚══════════════════════════════════╝"
echo ""

cd "$APP_DIR"

# ── Pull latest code ─────────────────────────────────────────────────────────
info "Pulling latest code from main..."
git pull origin main
ok "Code updated"

# ── Backend dependencies ──────────────────────────────────────────────────────
info "Installing backend dependencies..."
cd backend
npm install --omit=dev
cd ..
ok "Backend dependencies installed"

# ── Frontend build ────────────────────────────────────────────────────────────
info "Installing frontend dependencies..."
npm install --omit=dev
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
sleep 2
if curl -sf http://localhost:5001/health > /dev/null; then
  ok "Backend is healthy"
else
  echo "⚠  Health check failed — check: pm2 logs salesorbit"
  exit 1
fi

echo ""
ok "Deploy complete! App is live."
pm2 status salesorbit
