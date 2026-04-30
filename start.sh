#!/bin/bash
# SalesOrbit — one-command full setup + launch
# First run  : ./start.sh          (installs MySQL, seeds DB, starts both servers)
# Daily use  : ./dev.sh            (just starts both servers)

set -e
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   SalesOrbit CRM — Local Setup       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Node.js ───────────────────────────────────────────────────────────────────
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
command -v node &>/dev/null || fail "Node.js not found. Install nvm first: https://github.com/nvm-sh/nvm"
ok "Node.js $(node -v)"

# ── Homebrew ──────────────────────────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  [ -f /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
  [ -f /usr/local/bin/brew ]    && eval "$(/usr/local/bin/brew shellenv)"
fi
if ! command -v brew &>/dev/null; then
  info "Installing Homebrew (you will be asked for your Mac password)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  [ -f /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
  [ -f /usr/local/bin/brew ]    && eval "$(/usr/local/bin/brew shellenv)"
fi
command -v brew &>/dev/null || fail "Homebrew install failed"
ok "Homebrew $(brew --version | head -1 | awk '{print $2}')"

# ── MySQL ──────────────────────────────────────────────────────────────────────
if ! command -v mysql &>/dev/null; then
  info "Installing MySQL via Homebrew (takes 2–3 min)..."
  HOMEBREW_NO_AUTO_UPDATE=1 brew install mysql
fi
ok "MySQL $(mysql --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"

# Start MySQL
if ! mysqladmin ping -u root --silent 2>/dev/null; then
  info "Starting MySQL service..."
  brew services start mysql
  sleep 3
fi
mysqladmin ping -u root --silent 2>/dev/null || fail "MySQL failed to start — try: brew services restart mysql"
ok "MySQL running"

# ── Database & schema ─────────────────────────────────────────────────────────
info "Creating database..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS salesorbit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
info "Importing schema..."
mysql -u root salesorbit < database/schema.sql
ok "Database and schema ready"

# ── Dependencies ──────────────────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  info "Installing frontend dependencies..."
  npm install
fi
ok "Frontend node_modules"

if [ ! -d "backend/node_modules" ]; then
  info "Installing backend dependencies..."
  (cd backend && npm install)
fi
ok "Backend node_modules"

# ── Seed ─────────────────────────────────────────────────────────────────────
info "Seeding sample data..."
node backend/scripts/seed.js
ok "Sample data seeded"

# ── Launch ────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════╗"
echo "║      Launching SalesOrbit CRM        ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo -e "${GREEN}  Frontend → http://localhost:3000${NC}"
echo -e "${GREEN}  Backend  → http://localhost:5001${NC}"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop${NC}"
echo ""

# Kill anything on 5001 that isn't us
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Start backend
node backend/server.js &
BACKEND_PID=$!
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM EXIT

sleep 2
kill -0 $BACKEND_PID 2>/dev/null || fail "Backend crashed — check backend/.env"

# Start frontend (stays in foreground, shows Vite output)
npm run dev
