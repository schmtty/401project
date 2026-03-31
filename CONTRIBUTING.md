# Contributing to Keeper

This guide covers how to set up a local development environment, the branch and PR workflow the team follows, and code style notes to keep things consistent.

---

## Prerequisites

Make sure you have the following installed before starting:

- **Node.js** 18+
- **PostgreSQL** 14+
- **psql** (included with PostgreSQL — must be in your PATH)

See the main [README](README.md) for version verification commands and download links.

---

## Local setup

```bash
# 1. Clone the repo and enter the project folder
git clone <repository-url>
cd 401project

# 2. Install dependencies for both frontend and backend
npm run install:all

# 3. Create and seed the database
psql -U postgres -c "CREATE DATABASE ab2;"
psql -U postgres -d ab2 -f db/schema.sql
psql -U postgres -d ab2 -f db/seed.sql

# 4. Copy the backend environment file and fill in your database URL
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ab2

# 5. Start the backend (terminal 1)
npm run backend

# 6. Start the frontend (terminal 2)
npm run frontend
```

The app will be available at `http://localhost:8080`.
Dev credentials: username `default_user`, password `keeper123`.

---

## Branch workflow

1. **Never commit directly to `main`.** All changes go through a branch and pull request.
2. Create a branch from the latest `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b your-branch-name
   ```
3. Use short, descriptive branch names — e.g. `add-goal-filter`, `fix-login-redirect`, `update-readme`.
4. Push your branch and open a pull request against `main`:
   ```bash
   git push -u origin your-branch-name
   ```
5. At least one team member should review the PR before it is merged.

---

## Making database changes

- **Schema changes** go in `db/schema.sql` (keep it as the always-current source of truth) **and** in a new migration file under `db/migrations/`.
- **Migration file naming:** `NNN_short_description.sql` where `NNN` is the next sequential number, zero-padded to three digits (e.g. `003_add_goal_tags.sql`).
- Write migrations to be safe to re-run using `IF NOT EXISTS` guards.
- Document new migrations in [`db/MIGRATIONS.md`](db/MIGRATIONS.md).
- **Never commit `backend/.env`** — it contains your local database password. It is already in `.gitignore`.

---

## Code style

### General
- Use `async/await` throughout — no raw Promise chains.
- Handle errors with `try/catch` in all route handlers; log with `console.error`.
- Use parameterized queries (`$1, $2, ...`) for all SQL — no string interpolation.

### Backend (Node/Express)
- One router per resource in `backend/routes/`.
- Add a JSDoc module header to each route file listing its endpoints.
- Document non-obvious helper functions with JSDoc (`@param`, `@returns`).
- Use `requireUserId` middleware on any route that is user-scoped.

### Frontend (React/TypeScript)
- Components live in `frontend/src/components/`, pages in `frontend/src/pages/`.
- Use the existing context hooks (`useLanguage`, `useTheme`, `useUser`) rather than reading from localStorage directly.
- Icon-only buttons must have an `aria-label` for screen reader accessibility.
- Prefer `shadcn/ui` primitives over custom UI elements where available.

---

## Running a quick smoke test before pushing

```bash
# Check for TypeScript/build errors
cd frontend && npm run build

# Verify the API is healthy
curl http://localhost:3001/api/health
```

If the build fails, fix the TypeScript errors before pushing. The frontend build must pass cleanly.
