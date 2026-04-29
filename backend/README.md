# SalesOrbit CRM — Backend API

REST API for the SalesOrbit CRM. Built with **Node.js + Express + MongoDB**.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MongoDB 6+ (via Mongoose 8) |
| Auth | Email OTP → JWT |
| OTP Security | bcryptjs (hashed, TTL-indexed) |
| Validation | Joi |
| Security | Helmet, CORS, express-rate-limit |
| Email | Nodemailer (Gmail / any SMTP) |

---

## Prerequisites

- **Node.js** ≥ 18 (`node -v`)
- **MongoDB** running locally on port `27017`  
  Install: https://www.mongodb.com/docs/manual/installation/  
  Or use a free cloud cluster: https://cloud.mongodb.com

---

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/salesorbit
JWT_SECRET=pick-a-long-random-string-here
JWT_EXPIRES_IN=7d
OTP_EXPIRES_MS=600000
BCRYPT_ROUNDS=10

# Optional — if left blank, OTP is only returned in the API response (dev mode)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=noreply@salesorbit.io
FROM_NAME=SalesOrbit CRM

FRONTEND_URL=http://localhost:3000
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords.  
> Use the 16-character generated password as `SMTP_PASS`.

### 3. Seed the database (optional but recommended for testing)

```bash
npm run seed
```

This creates 4 users, 3 leads, 1 opportunity, 2 activities, and KPI records.

### 4. Start the server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

Server starts at **http://localhost:5000**

---

## Testing the API

### Health check

```bash
curl http://localhost:5000/health
```

Expected: `{"status":"ok","ts":"..."}`

---

## Authentication Flow

SalesOrbit uses **email-based OTP** — no passwords.

### Step 1 — Sign up (new user)

```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@salesorbit.io",
    "designation": "Head of Sales"
  }'
```

**Response (dev mode — OTP is included):**
```json
{
  "success": true,
  "message": "Account created. OTP sent.",
  "userId": "USR-1714000000000",
  "otp": "483921"
}
```

> In **production** (`NODE_ENV=production`), `otp` is NOT returned — it is emailed instead.

### Step 2 — Log in (existing user)

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@salesorbit.io"}'
```

Response includes `otp` (dev mode) or sends it by email.

### Step 3 — Verify OTP → get JWT

```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@salesorbit.io",
    "otp": "483921"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "USR-...",
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@salesorbit.io",
    "designation": "Head of Sales",
    "role": "Manager"
  }
}
```

Save the `token` — pass it in the `Authorization` header for all protected endpoints:

```
Authorization: Bearer <token>
```

### Get current user

```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## Seeded Test Users

After running `npm run seed`:

| Email | Role |
|---|---|
| alice@salesorbit.io | Manager (Head of Sales) |
| bob@salesorbit.io | Rep |
| clara@salesorbit.io | Rep |
| david@salesorbit.io | Rep |

Use any of these emails in the login flow to get an OTP.

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

All protected endpoints require: `Authorization: Bearer <token>`

---

### Auth `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | No | Register new user |
| POST | `/auth/login` | No | Request OTP for existing user |
| POST | `/auth/verify-otp` | No | Verify OTP, receive JWT |
| GET | `/auth/me` | Yes | Get current user profile |
| PUT | `/auth/me` | Yes | Update profile (firstName, lastName, designation) |

---

### Users `/users`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/users` | Yes | Manager | List all active users |
| GET | `/users/:id` | Yes | Any | Get user by userId |
| DELETE | `/users/:id` | Yes | Manager | Deactivate user (soft delete) |

---

### Leads `/leads`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/leads` | Yes | List leads (paginated, filterable) |
| POST | `/leads` | Yes | Create lead |
| POST | `/leads/bulk` | Yes | Bulk import leads |
| GET | `/leads/export` | Yes | Download leads as CSV |
| GET | `/leads/:id` | Yes | Get lead + its activities |
| PUT | `/leads/:id` | Yes | Update lead |
| DELETE | `/leads/:id` | Yes | Delete lead (and its activities) |
| POST | `/leads/:id/convert` | Yes | Convert lead to opportunity |

**Query params for `GET /leads`:**

| Param | Example | Description |
|---|---|---|
| `page` | `1` | Page number |
| `limit` | `25` | Items per page (max 100) |
| `status` | `New` | Filter by status |
| `priority` | `Hot` | Filter by priority |
| `owner` | `Alice Johnson` | Filter by lead owner |
| `vertical` | `IT Services` | Filter by vertical |
| `search` | `NexaTech` | Full-text search |
| `sortBy` | `-createdAt` | Sort field (prefix `-` for desc) |

**Create lead body:**
```json
{
  "contactPerson": "John Doe",
  "companyName": "Acme Corp",
  "email": "john@acme.com",
  "phone": "5559876543",
  "city": "Dubai",
  "leadSource": "Cold Outreach",
  "vertical": "IT Services",
  "natureOfBusiness": "Software Development",
  "leadOwner": "Alice Johnson",
  "priority": "Warm",
  "notes": "Met at DevConf 2026"
}
```

**Bulk import body:**
```json
{
  "leads": [
    { "contactPerson": "...", "companyName": "...", ... },
    { "contactPerson": "...", "companyName": "...", ... }
  ]
}
```

**Convert lead body:**
```json
{
  "opportunityName": "Acme Corp – Software Deal",
  "expectedMonthlyVolume": 100000,
  "expectedMonthlyRevenue": 5000,
  "expectedCloseDate": "2026-07-01",
  "decisionMaker": "John Doe",
  "dealNotes": "Budget approved, closing next quarter"
}
```

---

### Opportunities `/opportunities`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/opportunities` | Yes | List opportunities (paginated, filterable) |
| POST | `/opportunities` | Yes | Create opportunity |
| GET | `/opportunities/export` | Yes | Download opportunities as CSV |
| GET | `/opportunities/:id` | Yes | Get opportunity + its activities |
| PUT | `/opportunities/:id` | Yes | Update opportunity |
| DELETE | `/opportunities/:id` | Yes | Delete opportunity |
| PATCH | `/opportunities/:id/stage` | Yes | Move stage |

**Query params for `GET /opportunities`:**

| Param | Example | Description |
|---|---|---|
| `stage` | `Prospecting` | Filter by stage |
| `priority` | `Hot` | Filter by priority |
| `owner` | `Alice Johnson` | Filter by owner |
| `nob` | `IT Services` | Filter by nature of business |
| `search` | `NexaTech` | Full-text search |
| `page`, `limit`, `sortBy` | — | Pagination & sorting |

**Move stage body:**
```json
{
  "stage": "Won",
  "note": "Contract signed",
  "lostReason": "",
  "onHoldReviewDate": null
}
```

Valid stages: `Prospecting`, `Won`, `Onboarded`, `Activated`, `Lost`, `On Hold`

For `Lost`: include `lostReason` (Pricing, Competitor, User Experience, Product Feature, Risk & Compliance, No Response)  
For `On Hold`: include `onHoldReviewDate` (ISO date string)

---

### Activities `/activities`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/activities` | Yes | List activities (paginated, filterable) |
| POST | `/activities` | Yes | Log an activity |
| GET | `/activities/:id` | Yes | Get activity by ID |
| GET | `/activities/entity/:type/:id` | Yes | Get all activities for a lead or opportunity |

**Log activity body:**
```json
{
  "entityType": "lead",
  "entityId": "LD-20260218-1001",
  "type": "Call",
  "callType": "Discovery Call",
  "callOutcome": "Connected – Interested",
  "dateTime": "2026-04-29T10:00:00.000Z",
  "nextFollowUpDate": "2026-05-02",
  "notes": "Client interested, sending proposal"
}
```

Valid `type`: `Call`, `Email`, `Meeting`, `WhatsApp`, `Note`

**Get activities for a lead:**
```bash
curl http://localhost:5000/api/v1/activities/entity/lead/LD-20260218-1001 \
  -H "Authorization: Bearer <token>"
```

---

### KPIs `/kpis`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/kpis?year=2026` | Yes | Any | Get KPIs (Reps see own, Managers see all) |
| GET | `/kpis/:userId?year=2026` | Yes | Any | Get KPIs for specific user |
| PUT | `/kpis` | Yes | Manager | Bulk upsert KPI records |

**Bulk upsert body:**
```json
{
  "kpis": [
    {
      "userId": "USR-1714000000000",
      "userName": "Alice Johnson",
      "quarter": "Q2",
      "year": 2026,
      "tcTarget": 60,
      "tcAch": 45,
      "acTarget": 12,
      "acAch": 9
    }
  ]
}
```

---

### Dashboard `/dashboard`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/stats?range=month` | Yes | Key stats (leads, conversions, revenue) |
| GET | `/dashboard/pipeline` | Yes | Opportunities grouped by stage |
| GET | `/dashboard/leaderboard?range=month` | Yes | BD performance ranking |
| GET | `/dashboard/activity-breakdown?range=month` | Yes | Activity charts data |

**Range values:** `week`, `month`, `quarter`, `year` (default: `month`)

**Stats response:**
```json
{
  "stats": {
    "totalLeads": 42,
    "convertedLeads": 18,
    "conversionRate": 42.9,
    "totalOpportunities": 18,
    "activeOpportunities": 14,
    "wonOpportunities": 9,
    "totalRevenue": 112500,
    "totalActivities": 87,
    "callActivities": 54
  }
}
```

---

## Role-Based Access

| Role | Designation | Data Visibility |
|---|---|---|
| **Manager** | Head of Sales, Country Manager, Head of MENA | All team data |
| **Rep** | Everything else | Own data only (leadOwner / loggedBy = their name) |

---

## Security

- **OTP**: Hashed with bcrypt (cost factor 10) before DB storage. MongoDB TTL index deletes OTP documents after 10 minutes automatically.
- **JWT**: Signed with `JWT_SECRET` (HS256). Default expiry 7 days.
- **Rate limiting**: 200 req/15min globally; 20 req/15min on `/auth` endpoints.
- **Headers**: Helmet sets `X-Content-Type-Options`, `X-Frame-Options`, CSP, etc.
- **CORS**: Restricted to `FRONTEND_URL`.
- **Input validation**: All inputs validated with Joi before DB operations.
- **No plaintext secrets**: `.env` is in `.gitignore`.

---

## Common curl Examples

```bash
BASE=http://localhost:5000/api/v1
TOKEN=<your-jwt-token>

# List leads
curl "$BASE/leads" -H "Authorization: Bearer $TOKEN"

# Create a lead
curl -X POST "$BASE/leads" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contactPerson":"Jane","companyName":"Beta LLC","priority":"Hot"}'

# Log a call
curl -X POST "$BASE/activities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType":"lead","entityId":"LD-20260218-1001",
    "type":"Call","callType":"Follow-Up Call",
    "callOutcome":"Connected – Interested",
    "dateTime":"2026-04-29T09:00:00Z",
    "notes":"Follow-up confirmed"
  }'

# Move opportunity stage
curl -X PATCH "$BASE/opportunities/OPP-20260220-1001/stage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage":"Activated","note":"Client went live"}'

# Dashboard stats (last month)
curl "$BASE/dashboard/stats?range=month" -H "Authorization: Bearer $TOKEN"

# Export leads as CSV
curl "$BASE/leads/export" -H "Authorization: Bearer $TOKEN" -o leads.csv
```

---

## Folder Structure

```
backend/
├── scripts/
│   └── seed.js              # Populates DB with sample data
├── src/
│   ├── app.js               # Express app setup, middleware, routes
│   ├── config/
│   │   ├── db.js            # MongoDB connection
│   │   └── mail.js          # Nodemailer transporter + OTP email
│   ├── controllers/
│   │   ├── auth.js          # Signup, login, OTP verify
│   │   ├── users.js         # User management
│   │   ├── leads.js         # Lead CRUD + bulk import + convert
│   │   ├── opportunities.js # Opportunity CRUD + stage move
│   │   ├── activities.js    # Activity logging
│   │   ├── kpis.js          # KPI targets & achievements
│   │   └── dashboard.js     # Stats, pipeline, leaderboard
│   ├── middleware/
│   │   ├── auth.js          # JWT verification, role guard
│   │   └── error.js         # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Otp.js           # TTL-indexed OTP records
│   │   ├── Lead.js
│   │   ├── Opportunity.js
│   │   ├── Activity.js
│   │   └── Kpi.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── leads.js
│   │   ├── opportunities.js
│   │   ├── activities.js
│   │   ├── kpis.js
│   │   └── dashboard.js
│   └── utils/
│       ├── response.js      # Consistent JSON response helpers
│       └── csvExport.js     # CSV generation + streaming
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js                # Entry point — loads .env, connects DB, starts server
```

---

## Troubleshooting

**`MongoServerError: connect ECONNREFUSED`**  
MongoDB is not running. Start it: `mongod` (or `brew services start mongodb-community` on Mac)

**OTP not arriving by email**  
In `NODE_ENV=development`, the OTP is returned directly in the API response — no email needed for testing.

**`JWT_SECRET` error on startup**  
Make sure `.env` exists and `JWT_SECRET` is set.

**Rate limit hit (429)**  
The auth endpoints allow 20 requests per 15 minutes per IP. Wait or restart in development.
