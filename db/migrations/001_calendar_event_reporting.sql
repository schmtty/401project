-- Upgrade existing databases: event outcome reporting on calendar_events

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS report_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS report_milestones JSONB DEFAULT NULL;

ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_status_check;
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_status_check
  CHECK (status IN ('planned', 'happened', 'fell_through'));
