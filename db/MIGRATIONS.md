# Database Migrations

This document describes the migration strategy for the Keeper database, the purpose of each migration file, and how to apply them to an existing database.

---

## Overview

The source-of-truth schema is **`db/schema.sql`**. It always reflects the latest, fully-up-to-date table structure. Use it when setting up a fresh database.

Migrations in **`db/migrations/`** are incremental SQL scripts for upgrading an *existing* database that was created from an older version of `schema.sql`. They are numbered sequentially and must be applied in order.

---

## When to use schema.sql vs migrations

| Situation | What to run |
|-----------|-------------|
| Fresh clone / first-time setup | `schema.sql` then `seed.sql` |
| Existing database, pulling updates | Only the new migration files you haven't run yet |
| Recreating the database from scratch | Drop, recreate, `schema.sql`, then `seed.sql` |

---

## Applying migrations

Run each new migration against your existing database with `psql`:

```bash
psql -U postgres -d ab2 -f db/migrations/001_calendar_event_reporting.sql
psql -U postgres -d ab2 -f db/migrations/002_username_password_auth.sql
```

All migration scripts are written to be **safe to re-run** — they use `IF NOT EXISTS` guards or `DROP CONSTRAINT IF EXISTS` before adding constraints, so running a migration twice will not cause an error.

---

## Migration history

### 001 — Calendar event reporting
**File:** `db/migrations/001_calendar_event_reporting.sql`

Adds outcome reporting columns to `calendar_events` so users can record whether a past event happened or fell through, include notes, and optionally check off relationship milestones.

**Columns added to `calendar_events`:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `status` | `VARCHAR(20)` | `'planned'` | Lifecycle state: `planned`, `happened`, or `fell_through` |
| `reported_at` | `TIMESTAMPTZ` | `NULL` | Timestamp when the outcome was first recorded |
| `report_notes` | `TEXT` | `NULL` | Free-text notes added during outcome reporting |
| `report_milestones` | `JSONB` | `NULL` | Milestone checkboxes recorded during a `happened` report |

A `CHECK` constraint enforces that `status` is one of the three valid values.

---

### 002 — Username and password authentication
**File:** `db/migrations/002_username_password_auth.sql`

Replaces the legacy PIN-based profile selection with a proper username + password authentication model.

**Columns added to `users`:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `username` | `VARCHAR(50)` | — | Unique login handle; backfilled from existing display names |
| `password_hash` | `TEXT` | `NULL` | scrypt hash of the user's password (see `backend/auth/passwords.js`) |
| `must_reset_password` | `BOOLEAN` | `TRUE` | Forces a password-reset flow for accounts migrated from PIN auth |

**Migration logic:**
1. Adds the three columns.
2. Backfills `username` for all existing rows by normalizing the display `name` to lowercase with underscores. A numeric suffix (`_2`, `_3`, …) is appended when two names would produce the same username.
3. Sets `username` to `NOT NULL` and creates a `UNIQUE INDEX`.
4. Sets `must_reset_password = TRUE` for any account that still has no `password_hash`, forcing those users through the password-reset flow on next login.

---

## Creating a new migration

When a schema change is needed that would break existing databases:

1. Make the change in `schema.sql` (keep it as the always-current source of truth).
2. Create a new file in `db/migrations/` named `NNN_short_description.sql` where `NNN` is the next sequential number (zero-padded to three digits).
3. Write the migration using `IF NOT EXISTS` / `DROP ... IF EXISTS` guards so it is safe to re-run.
4. Document it in this file under **Migration history**.

---

## Rollbacks

There are no automated rollback scripts. To undo a migration manually:

- **001:** `ALTER TABLE calendar_events DROP COLUMN IF EXISTS status, reported_at, report_notes, report_milestones;`
- **002:** Drop the unique index and added columns. Note that rolling back 002 will remove all username/password data — this should only be done in a development environment.

For production rollbacks, restore from a database backup taken before applying the migration.
