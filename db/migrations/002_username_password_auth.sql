-- Upgrade existing databases: username/password auth model

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(50),
  ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill usernames from existing display names.
-- We normalize to lowercase with underscore separators and append a numeric
-- suffix when collisions occur.
WITH normalized AS (
  SELECT
    id,
    CASE
      WHEN trim(regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g'), '_') = '' THEN 'user'
      ELSE trim(regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g'), '_')
    END AS base_username
  FROM users
),
ranked AS (
  SELECT
    id,
    base_username,
    row_number() OVER (PARTITION BY base_username ORDER BY created_at, id) AS rn
  FROM normalized
),
backfill AS (
  SELECT
    id,
    CASE
      WHEN rn = 1 THEN base_username
      ELSE base_username || '_' || rn::text
    END AS generated_username
  FROM ranked
)
UPDATE users u
SET username = b.generated_username
FROM backfill b
WHERE u.id = b.id
  AND (u.username IS NULL OR trim(u.username) = '');

ALTER TABLE users
  ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);

-- Legacy accounts need to set a password after migration.
UPDATE users
SET must_reset_password = TRUE
WHERE password_hash IS NULL OR trim(password_hash) = '';
