# SalesOrbit CRM — VPS Deployment Guide

Ubuntu 22.04 LTS · Nginx · PM2 · Node.js 20 · MySQL or SQLite

---

## Prerequisites

| | Minimum | Recommended |
|---|---|---|
| RAM | 1 GB | 2 GB |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 | Ubuntu 24.04 |

A domain name pointed to the VPS IP address (A record).

---

## Step 1 — Initial server setup

```bash
# Log in as root, then create a deploy user
adduser deploy
usermod -aG sudo deploy
su - deploy

# Firewall — allow SSH, HTTP, HTTPS only
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

> Port 5001 (Node.js) is **not** opened — Nginx proxies to it internally.

---

## Step 2 — Install Node.js (via nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

nvm install 20
nvm use 20
nvm alias default 20
node -v    # v20.x.x
```

---

## Step 3 — Install Nginx

```bash
sudo apt update && sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
curl http://localhost   # should return Nginx welcome page
```

---

## Step 4 — Install PM2 (process manager)

```bash
npm install -g pm2
pm2 startup            # follow the printed command (runs PM2 on boot)
```

---

## Step 5 — Install MySQL (optional — skip to use SQLite)

SQLite works well for teams up to ~20 users. Use MySQL for larger teams or if you need concurrent write performance.

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

Inside the MySQL shell:
```sql
CREATE DATABASE salesorbit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'salesorbit_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON salesorbit.* TO 'salesorbit_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Import the schema:
```bash
mysql -u salesorbit_user -p salesorbit < /var/www/salesorbit/database/schema.sql
```

---

## Step 6 — Clone the repository

```bash
sudo mkdir -p /var/www/salesorbit
sudo chown deploy:deploy /var/www/salesorbit

cd /var/www/salesorbit
git clone https://github.com/alrehmanansari/Sales-Orbit.git .
```

---

## Step 7 — Configure the backend

```bash
cd /var/www/salesorbit/backend
cp .env.example .env
nano .env   # fill in all values
```

Key values to set:

```env
NODE_ENV=production
PORT=5001

# SQLite (default — no extra setup):
DB_ENGINE=sqlite

# OR MySQL:
# DB_ENGINE=mysql
# DB_HOST=localhost
# DB_USER=salesorbit_user
# DB_PASSWORD=strong_password_here
# DB_NAME=salesorbit

# Generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=<64-char random hex>

SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=https://yourdomain.com
```

Install dependencies:
```bash
npm install --omit=dev
```

---

## Step 8 — Seed sample data (optional)

```bash
cd /var/www/salesorbit/backend
node scripts/seed.js
```

Test accounts after seeding: `alice@salesorbit.io`, `bob@salesorbit.io`, etc.

---

## Step 9 — Build the frontend

```bash
cd /var/www/salesorbit
npm install --omit=dev
npm run build   # outputs → dist/
```

If the API is on a **different domain** (e.g. `api.yourdomain.com`), create `.env.production` first:
```bash
echo "VITE_API_URL=https://api.yourdomain.com/api/v1" > .env.production
npm run build
```

For the standard single-domain setup (frontend + backend on the same domain), no `.env.production` is needed.

---

## Step 10 — Configure Nginx

```bash
# Update the server_name in the config first
nano /var/www/salesorbit/nginx/salesorbit.conf
# Replace every 'yourdomain.com' with your actual domain

# Symlink into Nginx
sudo ln -s /var/www/salesorbit/nginx/salesorbit.conf /etc/nginx/sites-enabled/salesorbit

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 11 — SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot automatically edits the Nginx config to add SSL and sets up auto-renewal.

Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 12 — Start the backend with PM2

```bash
cd /var/www/salesorbit/backend

# Create log directory
sudo mkdir -p /var/log/salesorbit
sudo chown deploy:deploy /var/log/salesorbit

# Start
pm2 start ecosystem.config.js --env production

# Persist across reboots
pm2 save
```

---

## Step 13 — Verify everything is working

```bash
# Backend health
curl https://yourdomain.com/health

# Backend logs
pm2 logs salesorbit --lines 50

# Nginx status
sudo systemctl status nginx

# PM2 status
pm2 status
```

Open `https://yourdomain.com` in a browser — the app should load.

---

## Deploying updates

After pushing new code to GitHub, run on the VPS:

```bash
cd /var/www/salesorbit
./deploy.sh
```

The script: pulls latest → installs deps → builds frontend → reloads backend → health-checks.

---

## Environment quick reference

| Variable | Dev default | Production |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `DB_ENGINE` | `sqlite` | `sqlite` or `mysql` |
| `PORT` | `5001` | `5001` |
| `JWT_SECRET` | dev-only string | 48+ char random hex |
| `BCRYPT_ROUNDS` | `10` | `12` |
| `FRONTEND_URL` | `http://localhost:3000` | `https://yourdomain.com` |
| `SMTP_USER` | (blank → OTP in API) | Gmail / SMTP |

---

## Useful PM2 commands

```bash
pm2 status                    # process list
pm2 logs salesorbit           # tail logs
pm2 logs salesorbit --lines 200 --err   # errors only
pm2 restart salesorbit        # restart
pm2 reload salesorbit         # zero-downtime reload
pm2 stop salesorbit           # stop
pm2 monit                     # real-time CPU/memory
```

---

## Troubleshooting

| Symptom | Check |
|---|---|
| 502 Bad Gateway | Backend not running: `pm2 status` and `pm2 logs salesorbit` |
| Cannot connect to DB | Check `DB_ENGINE`, credentials in `.env`, MySQL service status |
| CORS error | `FRONTEND_URL` in `.env` must match exact browser URL (with https://) |
| OTP not arriving | `SMTP_USER` / `SMTP_PASS` in `.env`; or check spam folder |
| JWT errors | `JWT_SECRET` mismatch between old and new `.env`; clear browser localStorage |
| 404 on page refresh | Nginx `try_files` directive — check Nginx config is loaded |
| SSL errors | `sudo certbot renew` and `sudo systemctl reload nginx` |

---

## Local development

```bash
# Terminal 1 — backend
cd backend && npm run dev    # → http://localhost:5001

# Terminal 2 — frontend  
npm run dev                  # → http://localhost:3000
```

Or use the helper script (installs MySQL if not present, seeds DB, starts both):
```bash
./start.sh
```
