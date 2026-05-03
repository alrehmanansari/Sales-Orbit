-- SalesOrbit CRM — SQLite Schema (auto-loaded by db.js on first run)

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT UNIQUE NOT NULL,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  designation TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'Rep',
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  otp_hash   TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_otps_email   ON otps(email);
CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at);

CREATE TABLE IF NOT EXISTS leads (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id            TEXT UNIQUE NOT NULL,
  contact_person     TEXT NOT NULL,
  company_name       TEXT NOT NULL,
  website            TEXT NOT NULL DEFAULT '',
  email              TEXT NOT NULL DEFAULT '',
  phone              TEXT NOT NULL DEFAULT '',
  city               TEXT NOT NULL DEFAULT '',
  lead_source        TEXT NOT NULL DEFAULT '',
  lead_source_other  TEXT NOT NULL DEFAULT '',
  vertical           TEXT NOT NULL DEFAULT '',
  nature_of_business TEXT NOT NULL DEFAULT '',
  lead_owner         TEXT NOT NULL DEFAULT '',
  priority           TEXT NOT NULL DEFAULT 'Cold',
  notes              TEXT,
  status             TEXT NOT NULL DEFAULT 'New',
  created_by         TEXT NOT NULL DEFAULT '',
  converted_at       TEXT,
  opportunity_id     TEXT,
  last_activity_at   TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority   ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_lead_owner ON leads(lead_owner);
CREATE INDEX IF NOT EXISTS idx_leads_email      ON leads(email);

CREATE TABLE IF NOT EXISTS opportunities (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  opportunity_id           TEXT UNIQUE NOT NULL,
  lead_id                  TEXT,
  opportunity_name         TEXT NOT NULL,
  company_name             TEXT NOT NULL,
  contact_person           TEXT NOT NULL DEFAULT '',
  email                    TEXT NOT NULL DEFAULT '',
  phone                    TEXT NOT NULL DEFAULT '',
  city                     TEXT NOT NULL DEFAULT '',
  website                  TEXT NOT NULL DEFAULT '',
  lead_source              TEXT NOT NULL DEFAULT '',
  vertical                 TEXT NOT NULL DEFAULT '',
  nature_of_business       TEXT NOT NULL DEFAULT '',
  lead_owner               TEXT NOT NULL DEFAULT '',
  priority                 TEXT NOT NULL DEFAULT 'Cold',
  expected_monthly_volume  REAL NOT NULL DEFAULT 0,
  expected_monthly_revenue REAL NOT NULL DEFAULT 0,
  expected_close_date      TEXT,
  decision_maker           TEXT NOT NULL DEFAULT '',
  competitors              TEXT,
  deal_notes               TEXT,
  stage                    TEXT NOT NULL DEFAULT 'Prospecting',
  lost_reason              TEXT NOT NULL DEFAULT '',
  on_hold_review_date      TEXT,
  client_id                TEXT NOT NULL DEFAULT '',
  kyc_agent                TEXT NOT NULL DEFAULT '',
  created_by               TEXT NOT NULL DEFAULT '',
  created_at               TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_opps_stage      ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opps_lead_owner ON opportunities(lead_owner);

CREATE TABLE IF NOT EXISTS stage_history (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  opportunity_id TEXT NOT NULL,
  stage          TEXT NOT NULL,
  entered_at     TEXT NOT NULL DEFAULT (datetime('now')),
  exited_at      TEXT,
  note           TEXT,
  changed_by     TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_sh_opp_id ON stage_history(opportunity_id);

CREATE TABLE IF NOT EXISTS activities (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id         TEXT UNIQUE NOT NULL,
  entity_type         TEXT NOT NULL,
  entity_id           TEXT NOT NULL,
  type                TEXT NOT NULL,
  call_type           TEXT NOT NULL DEFAULT '',
  call_outcome        TEXT NOT NULL DEFAULT '',
  date_time           TEXT NOT NULL,
  next_follow_up_date TEXT,
  notes               TEXT,
  logged_by           TEXT NOT NULL DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_acts_entity    ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_acts_logged_by ON activities(logged_by);
CREATE INDEX IF NOT EXISTS idx_acts_date_time ON activities(date_time);

CREATE TABLE IF NOT EXISTS kpis (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  user_name  TEXT NOT NULL,
  quarter    TEXT NOT NULL,
  year       INTEGER NOT NULL,
  tc_target  INTEGER NOT NULL DEFAULT 0,
  tc_ach     INTEGER NOT NULL DEFAULT 0,
  ac_target  INTEGER NOT NULL DEFAULT 0,
  ac_ach     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, quarter, year)
);
