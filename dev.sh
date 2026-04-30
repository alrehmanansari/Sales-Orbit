#!/bin/bash
# SalesOrbit — daily dev launcher (assumes MySQL + DB already set up)
# Usage: ./dev.sh

cd "$(dirname "$0")"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

# Ensure MySQL is running
if ! mysqladmin ping -u root --silent 2>/dev/null; then
  echo -e "${YELLOW}→ Starting MySQL...${NC}"
  brew services start mysql 2>/dev/null || mysql.server start 2>/dev/null || true
  sleep 2
fi
if ! mysqladmin ping -u root --silent 2>/dev/null; then
  echo -e "${RED}✗ MySQL is not running. Run ./start.sh first.${NC}"
  exit 1
fi

# Kill anything leftover on 5001
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

echo ""
echo -e "${GREEN}  Frontend → http://localhost:3000${NC}"
echo -e "${GREEN}  Backend  → http://localhost:5001${NC}"
echo -e "${YELLOW}  Press Ctrl+C to stop${NC}"
echo ""

# Start backend
node backend/server.js &
BACKEND_PID=$!
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM EXIT

sleep 1
kill -0 $BACKEND_PID 2>/dev/null || { echo -e "${RED}Backend crashed — check backend/.env${NC}"; exit 1; }

# Start frontend
npm run dev
