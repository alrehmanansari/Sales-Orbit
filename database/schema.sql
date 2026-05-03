-- SalesOrbit CRM — MySQL Schema
-- Import this file into phpMyAdmin before starting the backend.
-- Requires MySQL 5.7+ (JSON column type used for competitors field).

CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(50)  UNIQUE NOT NULL,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  designation VARCHAR(100) NOT NULL,
  role        ENUM('Manager','Rep') NOT NULL DEFAULT 'Rep',
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
);

-- OTPs (TTL enforced via expires_at check; expired rows pruned on each use)
CREATE TABLE IF NOT EXISTS otps (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  otp_hash   VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS leads (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  lead_id           VARCHAR(50)  UNIQUE NOT NULL,
  contact_person    VARCHAR(255) NOT NULL,
  company_name      VARCHAR(255) NOT NULL,
  website           VARCHAR(255) NOT NULL DEFAULT '',
  email             VARCHAR(255) NOT NULL DEFAULT '',
  phone             VARCHAR(50)  NOT NULL DEFAULT '',
  city              VARCHAR(100) NOT NULL DEFAULT '',
  lead_source       VARCHAR(100) NOT NULL DEFAULT '',
  lead_source_other VARCHAR(100) NOT NULL DEFAULT '',
  vertical          VARCHAR(100) NOT NULL DEFAULT '',
  nature_of_business VARCHAR(100) NOT NULL DEFAULT '',
  lead_owner        VARCHAR(100) NOT NULL DEFAULT '',
  priority          ENUM('Hot','Warm','Cold') NOT NULL DEFAULT 'Cold',
  notes             TEXT,
  status            ENUM('New','Contacted','Qualified','Converted','Lost') NOT NULL DEFAULT 'New',
  created_by        VARCHAR(100) NOT NULL DEFAULT '',
  converted_at      DATETIME NULL,
  opportunity_id    VARCHAR(50) NULL,
  last_activity_at  DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status     (status),
  INDEX idx_priority   (priority),
  INDEX idx_lead_owner (lead_owner),
  INDEX idx_email      (email)
);

CREATE TABLE IF NOT EXISTS opportunities (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  opportunity_id           VARCHAR(50)  UNIQUE NOT NULL,
  lead_id                  VARCHAR(50)  NULL,
  opportunity_name         VARCHAR(255) NOT NULL,
  company_name             VARCHAR(255) NOT NULL,
  contact_person           VARCHAR(255) NOT NULL DEFAULT '',
  email                    VARCHAR(255) NOT NULL DEFAULT '',
  phone                    VARCHAR(50)  NOT NULL DEFAULT '',
  city                     VARCHAR(100) NOT NULL DEFAULT '',
  website                  VARCHAR(255) NOT NULL DEFAULT '',
  lead_source              VARCHAR(100) NOT NULL DEFAULT '',
  vertical                 VARCHAR(100) NOT NULL DEFAULT '',
  nature_of_business       VARCHAR(100) NOT NULL DEFAULT '',
  lead_owner               VARCHAR(100) NOT NULL DEFAULT '',
  priority                 ENUM('Hot','Warm','Cold') NOT NULL DEFAULT 'Cold',
  expected_monthly_volume  DECIMAL(15,2) NOT NULL DEFAULT 0,
  expected_monthly_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  expected_close_date      DATE NULL,
  decision_maker           VARCHAR(255) NOT NULL DEFAULT '',
  competitors              JSON NULL,
  deal_notes               TEXT,
  stage                    ENUM('Prospecting','Won','Onboarded','Activated','Lost','On Hold') NOT NULL DEFAULT 'Prospecting',
  lost_reason              VARCHAR(100) NOT NULL DEFAULT '',
  on_hold_review_date      DATE NULL,
  client_id                VARCHAR(100) NOT NULL DEFAULT '',
  kyc_agent                VARCHAR(100) NOT NULL DEFAULT '',
  created_by               VARCHAR(100) NOT NULL DEFAULT '',
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stage      (stage),
  INDEX idx_lead_owner (lead_owner),
  INDEX idx_priority   (priority),
  INDEX idx_lead_id    (lead_id)
);

CREATE TABLE IF NOT EXISTS stage_history (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  opportunity_id  VARCHAR(50) NOT NULL,
  stage           VARCHAR(50) NOT NULL,
  entered_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  exited_at       DATETIME NULL,
  note            TEXT,
  changed_by      VARCHAR(100) NOT NULL DEFAULT '',
  INDEX idx_opportunity_id (opportunity_id)
);

CREATE TABLE IF NOT EXISTS activities (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  activity_id         VARCHAR(50) UNIQUE NOT NULL,
  entity_type         ENUM('lead','opportunity') NOT NULL,
  entity_id           VARCHAR(50) NOT NULL,
  type                ENUM('Call','Email','Meeting','WhatsApp','Note') NOT NULL,
  call_type           VARCHAR(100) NOT NULL DEFAULT '',
  call_outcome        VARCHAR(100) NOT NULL DEFAULT '',
  date_time           DATETIME NOT NULL,
  next_follow_up_date DATE NULL,
  notes               TEXT,
  logged_by           VARCHAR(100) NOT NULL DEFAULT '',
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity    (entity_type, entity_id),
  INDEX idx_logged_by (logged_by),
  INDEX idx_date_time (date_time)
);

CREATE TABLE IF NOT EXISTS kpis (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    VARCHAR(50)  NOT NULL,
  user_name  VARCHAR(255) NOT NULL,
  quarter    ENUM('Q1','Q2','Q3','Q4') NOT NULL,
  year       INT NOT NULL,
  tc_target  INT NOT NULL DEFAULT 0,
  tc_ach     INT NOT NULL DEFAULT 0,
  ac_target  INT NOT NULL DEFAULT 0,
  ac_ach     INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_kpi (user_id, quarter, year)
);
