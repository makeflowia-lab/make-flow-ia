-- ============================================
-- Make Flow IA - Webex Clone
-- Schema para Neon PostgreSQL
-- ============================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar        TEXT,
  role          VARCHAR(50)  DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- MEETINGS
-- ============================================
CREATE TABLE IF NOT EXISTS meetings (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  host_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_name        VARCHAR(255) UNIQUE NOT NULL,
  status           VARCHAR(50)  DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended')),
  starts_at        TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  max_participants INTEGER      DEFAULT 200 CHECK (max_participants BETWEEN 2 AND 200),
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_host ON meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_room ON meetings(room_name);

-- ============================================
-- MEETING PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS meeting_participants (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id  UUID        NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(50)  DEFAULT 'participant' CHECK (role IN ('host', 'co-host', 'participant')),
  joined_at   TIMESTAMPTZ  DEFAULT NOW(),
  left_at     TIMESTAMPTZ,
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON meeting_participants(user_id);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(255) NOT NULL,
  resource   VARCHAR(255),
  metadata   JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
