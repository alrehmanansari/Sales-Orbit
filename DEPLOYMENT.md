# SalesOrbit CRM — cPanel Deployment Guide

## Prerequisites

- cPanel hosting with **Node.js** support (via "Setup Node.js App")
- MySQL database created in cPanel → **MySQL Databases**
- Domain / subdomain pointed to `public_html`

---

## Step 1 — Import the MySQL Schema

1. Open **cPanel → phpMyAdmin**
2. Select your database (or create one)
3. Click the **Import** tab
4. Choose `database/schema.sql` → click **Go**

All six tables will be created: `users`, `otps`, `leads`, `opportunities`, `stage_history`, `activities`, `kpis`.

---

## Step 2 — Deploy the Backend

### 2a — Upload backend files

Upload the entire `backend/` folder to your server. Recommended path:

```
/home/<cpanel_user>/salesorbit-backend/
```

Do **not** place it inside `public_html` — it should be outside the web root.

### 2b — Create the Node.js App in cPanel

1. cPanel → **Setup Node.js App** → **Create Application**
2. Fill in:
   | Field | Value |
   |---|---|
   | Node.js version | 18 (or latest available) |
   | Application mode | Production |
   | Application root | `salesorbit-backend` |
   | Application URL | `yourdomain.com` (leave path blank — API prefix handled by app) |
   | Application startup file | `server.js` |
3. Click **Create**

### 2c — Install dependencies

In the cPanel Node.js panel, click **Run NPM Install** (or SSH into the server and run):

```bash
cd ~/salesorbit-backend
npm install
```

### 2d — Set environment variables

In the cPanel Node.js panel add these environment variables (or create `~/salesorbit-backend/.env`):

```
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_USER=cpanel_dbusername
DB_PASSWORD=your_db_password
DB_NAME=cpanel_dbname
JWT_SECRET=long-random-secret-here
JWT_EXPIRES_IN=7d
OTP_EXPIRES_MS=600000
BCRYPT_ROUNDS=10
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=SalesOrbit CRM
FRONTEND_URL=https://yourdomain.com
```

> **cPanel DB prefix**: cPanel prepends your username to DB names and users, e.g. `alice_salesorbit` and `alice_dbuser`. Use the full prefixed names.

### 2e — Restart the app

Click **Restart** in the cPanel Node.js panel. Verify it is running by visiting:

```
https://yourdomain.com:5000/health
```

---

## Step 3 — Configure Apache to Proxy API Requests

cPanel uses Apache in front of your Node.js app. Add the following to the `.htaccess` in `public_html/` (this file is already included in the project root and will be copied in Step 4):

```apache
Options -MultiViews
RewriteEngine On

# Forward /api requests to the Node.js backend
RewriteCond %{REQUEST_URI} ^/api [NC]
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]

# React Router — fall back to index.html for all other paths
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

> If your host does not allow `mod_proxy` (some shared hosts restrict it), you may need to run the backend on a **subdomain** (e.g. `api.yourdomain.com`) and update `FRONTEND_URL` and the Vite proxy / `src/services/api.js` base URL accordingly.

---

## Step 4 — Build and Deploy the Frontend

### 4a — Set the production API URL

For most cPanel setups where the API is proxied from the same domain, the existing `src/services/api.js` base path `/api/v1` works without any change.

If your backend is on a **separate subdomain**, create a `.env.production` file in the project root:

```
VITE_API_URL=https://api.yourdomain.com/api/v1
```

Then update `src/services/api.js` line 1:
```js
const BASE = import.meta.env.VITE_API_URL || '/api/v1'
```

### 4b — Build

```bash
# From the project root (not /backend)
npm run build
```

This produces a `dist/` folder.

### 4c — Upload to public_html

Upload the **contents** of `dist/` to `public_html/`:

```
public_html/
  index.html
  assets/
  .htaccess       ← copy from project root
```

Make sure `.htaccess` is in `public_html/` — it enables React Router on Apache.

---

## Step 5 — Seed Sample Data (optional)

SSH into the server and run:

```bash
cd ~/salesorbit-backend
node scripts/seed.js
```

This creates 4 users, 3 leads, 1 opportunity, stage history, activities, and KPI records.

Test logins: `alice@salesorbit.io`, `bob@salesorbit.io`, `clara@salesorbit.io`, `david@salesorbit.io`

---

## Step 6 — Verify

| Check | URL |
|---|---|
| Backend health | `https://yourdomain.com/api/health` (or `:5000/health`) |
| Frontend loads | `https://yourdomain.com` |
| Login works | Enter a seeded email → OTP sent (or check mail logs) |

---

## Local Development

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # fill in DB creds + JWT_SECRET
npm run dev            # → http://localhost:5000

# Terminal 2 — frontend
npm run dev            # → http://localhost:3000
                       # Vite proxy forwards /api → localhost:5000
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER` / `DB_PASSWORD` in `.env` |
| `ER_NO_SUCH_TABLE` | Schema not imported — run Step 1 again |
| `404` on page refresh | `.htaccess` missing from `public_html/` |
| API returns `401` | JWT_SECRET mismatch between frontend token and backend |
| OTP not arriving | Check `SMTP_PASS` is an App Password, not your account password |
| `mod_proxy` blocked | Move backend to a subdomain — see Step 3 note |
