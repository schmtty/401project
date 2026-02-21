-- Area Book 2.0 - PostgreSQL Schema
-- 5 tables: users, user_settings, connections, calendar_events, goals

-- Users: profiles (max 5 per app, Netflix-style)
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  pin VARCHAR(10) DEFAULT NULL,
  avatar VARCHAR(10) NOT NULL DEFAULT '👨',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings: theme and language per user
CREATE TABLE user_settings (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'pastel', 'comfort', 'sunset')),
  language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es', 'zh')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections: people the user is tracking
CREATE TABLE connections (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL DEFAULT 0,
  phone VARCHAR(50) DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  notes TEXT DEFAULT '',
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  relationship VARCHAR(20) NOT NULL CHECK (relationship IN ('family', 'friend', 'connection')),
  liked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATE NOT NULL,
  milestones JSONB NOT NULL DEFAULT '{"dates":0,"heldHands":false,"kissed":false,"metParents":false,"contactStreak":0}',
  created_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events: dates, hangouts, calls, etc.
CREATE TABLE calendar_events (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time VARCHAR(10) NOT NULL DEFAULT '12:00',
  location VARCHAR(500) DEFAULT '',
  notes TEXT DEFAULT '',
  type VARCHAR(20) NOT NULL CHECK (type IN ('date', 'hangout', 'call', 'text', 'other')),
  connection_id VARCHAR(50) REFERENCES connections(id) ON DELETE SET NULL,
  color VARCHAR(20) DEFAULT NULL,
  lat DOUBLE PRECISION DEFAULT NULL,
  lng DOUBLE PRECISION DEFAULT NULL,
  created_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Goals: measurable or completion-based goals
CREATE TABLE goals (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('measurable', 'completion')),
  measure VARCHAR(255) DEFAULT '',
  actions TEXT DEFAULT '',
  target_date DATE NOT NULL,
  notes TEXT DEFAULT '',
  category VARCHAR(20) NOT NULL CHECK (category IN ('love', 'fitness', 'school', 'work', 'social')),
  target INTEGER NOT NULL DEFAULT 0,
  current INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  history JSONB DEFAULT '[]',
  created_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_settings_user ON user_settings(user_id);
CREATE INDEX idx_connections_user ON connections(user_id);
CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
CREATE INDEX idx_calendar_events_connection ON calendar_events(connection_id);
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_category ON goals(category);
