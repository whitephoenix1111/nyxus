-- db/schema.sql — Chạy 1 lần trên Neon console để tạo bảng
--
-- Thứ tự tạo bảng quan trọng: parent trước, child sau (FK constraint)
-- Neon dùng PostgreSQL chuẩn — không cần extension đặc biệt

-- ── LAYER 1: IDENTITY ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL CHECK (role IN ('salesperson', 'manager')),
  avatar        TEXT NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  company     TEXT NOT NULL,
  avatar      TEXT NOT NULL,
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  industry    TEXT NOT NULL DEFAULT 'Unknown',
  country     TEXT NOT NULL DEFAULT '',
  website     TEXT NOT NULL DEFAULT '',
  tags        TEXT[] NOT NULL DEFAULT '{}',
  notes       TEXT NOT NULL DEFAULT '',
  created_at  DATE NOT NULL,
  archived_at DATE
);

-- ── LAYER 2: PIPELINE ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS opportunities (
  id             TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL REFERENCES clients(id),
  owner_id       TEXT NOT NULL REFERENCES users(id),
  title          TEXT NOT NULL,
  value          NUMERIC NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('Lead','Qualified','Proposal','Negotiation','Won','Lost')),
  confidence     INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  date           DATE NOT NULL,
  notes          TEXT,
  status_history JSONB NOT NULL DEFAULT '[]'
);

-- ── LAYER 3: ACTIVITY ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activities (
  id                     TEXT PRIMARY KEY,
  client_id              TEXT NOT NULL REFERENCES clients(id),
  opportunity_id         TEXT REFERENCES opportunities(id),
  type                   TEXT NOT NULL CHECK (type IN ('call','email','meeting','demo','note')),
  title                  TEXT NOT NULL,
  date                   DATE NOT NULL,
  outcome                TEXT NOT NULL CHECK (outcome IN ('positive','neutral','negative')),
  next_action            TEXT NOT NULL DEFAULT '',
  next_action_date       DATE,
  promote_opportunity_to TEXT CHECK (promote_opportunity_to IN ('Lead','Qualified','Proposal','Negotiation','Won','Lost')),
  notes                  TEXT NOT NULL DEFAULT '',
  created_at             DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id             TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL REFERENCES clients(id),
  opportunity_id TEXT REFERENCES opportunities(id),
  title          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done')),
  due_date       DATE,
  assigned_to    TEXT REFERENCES users(id),
  created_from   TEXT REFERENCES activities(id),
  notes          TEXT,
  created_at     DATE NOT NULL,
  completed_at   TIMESTAMPTZ
);

-- ── LAYER 4: ASSETS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id             TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL REFERENCES clients(id),
  opportunity_id TEXT REFERENCES opportunities(id),
  uploaded_by    TEXT NOT NULL REFERENCES users(id),
  name           TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('pdf','doc','xls','img','other')),
  category       TEXT NOT NULL,
  size           TEXT NOT NULL DEFAULT '',
  url            TEXT,
  starred        BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_at    TIMESTAMPTZ NOT NULL
);

-- ── INDEXES ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_opportunities_client ON opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner  ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_activities_client    ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_date      ON activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_client         ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned       ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_documents_client     ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_owner        ON clients(owner_id);
