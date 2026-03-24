# Keeper

## App Summary

**Keeper** is a relationship planner and goal tracker for young single adults. It helps you manage **connections** (people you track), **calendar events** (dates, hangouts, calls, etc.), **personal goals** across categories (love, fitness, school, work, social), and optional **RizzBot** texting feedback.

**Connections** store basics (name, age, contact info, relationship type) plus **milestones** (dates count, held hands, kissed, met parents, contact streak). A **liked** flag marks people you are actively investing in romantically or socially. Milestone UI and coaching context are **gated on “liked”**: connection cards show the flame streak only for liked people; the connection detail milestones section and RizzBot milestone hints apply only when that person is liked.

**Calendar** ties events to optional connections, supports map coordinates, and includes **outcome reporting** for past events: you mark **Happened** or **Fell Through**, add notes, and—when the event is linked to someone **you have liked**—you can check off **report milestones** (e.g. held hands). If the linked person is **not** liked, the report flow shows a **Like** action first; after you like them, milestone checkboxes appear. Reported milestones merge into the connection’s stored milestones. The home row and calendar highlight when **past events still need a report**.

**Profiles** are Netflix-style (up to five) with optional PINs. **Settings** cover theme, language (English, Spanish, Chinese Simplified), and profile name/avatar. Data persists in **PostgreSQL** via the Express API.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL 14+ (via `pg` / node-postgres, no ORM) |
| **Authentication** | Optional PIN per user profile (client-side verification) |
| **External services** | Optional **Google Gemini** for RizzBot when `GOOGLE_AI_API_KEY` is set (otherwise rule-based fallback) |

---

## Architecture Diagram

```
                    ┌─────────────┐
                    │    User     │
                    │  (Browser)  │
                    └──────┬──────┘
                           │
                           │ HTTP (fetch)
                           │
                    ┌──────▼──────┐
                    │   Frontend  │
                    │ React SPA   │
                    │ (port 8080) │
                    └──────┬──────┘
                           │
                           │ /api/* (proxied in dev)
                           │ X-User-Id header
                           │
                    ┌──────▼──────┐
                    │   Backend   │
                    │  Express    │
                    │ (port 3001) │
                    └──────┬──────┘
                           │
                           │ SQL (pg)
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │  (ab2 db)   │
                    └─────────────┘
```

**Data flow:**

- User interacts with React UI → `fetch()` calls `/api/*` with `X-User-Id` header
- Vite dev server proxies `/api` to Express
- Express routes query PostgreSQL via `pg`, return JSON
- Frontend updates UI with response data

---

## Prerequisites

Install the following before running the project:

| Software | Version | Installation |
|----------|---------|--------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | 14+ | [postgresql.org](https://www.postgresql.org/download/) |
| **psql** | (included with PostgreSQL) | Ensure `psql` is in your system PATH |

**Verify installation:**

```bash
node -v    # Should show v18.x or higher
npm -v     # Should show 9.x or higher
psql --version   # Should show psql 14 or higher
```

---

## Installation and Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <your-repo-folder>   # e.g. 401project-2
```

### 2. Install dependencies

```bash
# Frontend
cd frontend
npm install
cd ..

# Backend
cd backend
npm install
cd ..
```

### 3. Create the database

```bash
# Drop existing database if you had an older schema (optional)
psql -U postgres -c "DROP DATABASE IF EXISTS ab2;"

# Create database
psql -U postgres -c "CREATE DATABASE ab2;"

# Apply schema (creates 5 tables: users, user_settings, connections, calendar_events, goals)
psql -U postgres -d ab2 -f db/schema.sql

# Load seed data (default user + sample connections, events, goals)
psql -U postgres -d ab2 -f db/seed.sql
```

If you already have an `ab2` database from an older clone, apply incremental migrations after pulling updates, for example:

```bash
psql -U postgres -d ab2 -f db/migrations/001_calendar_event_reporting.sql
```

### 4. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://postgres:YOUR_PASSWORD@localhost:5432/ab2`) |
| `PORT` | API port (default `3001`) |
| `GOOGLE_AI_API_KEY` | Optional; enables Gemini-powered RizzBot responses |

**Security:** Do not commit `.env` or paste secrets into the repo. If `git status` lists `backend/.env`, leave it untracked.

---

## Running the Application

### Start the backend

```bash
cd backend
npm run dev
```

Backend runs at `http://localhost:3001`. Health check: `GET http://localhost:3001/api/health`

### Start the frontend

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:8080`. Open this URL in your browser.

From the **repository root**, you can alternatively use `npm run install:all` once, then run `npm run backend` and `npm run frontend` in **two separate terminals**.

### First run

1. You will see the **profile selection** page (“Select Profile”).
2. Select **Default User** (or create a new profile).
3. Explore **Connections**, **Calendar**, **Map**, **Goals**, **RizzBot**, and **Settings** from the home shell / navigation.

---

## Entity Relationship Diagram (ERD)

Table and column documentation, including calendar **reporting** fields (`status`, `reported_at`, `report_notes`, `report_milestones`), lives in:

**[`db/ERD.md`](db/ERD.md)**

The schema source of truth is **`db/schema.sql`**. Use **`db/migrations/`** for incremental changes on existing databases.

---

## Verifying the Vertical Slice

The **Add Connection** flow is wired end-to-end:

1. Start backend and frontend (see above).
2. Open `http://localhost:8080`, select a profile.
3. Go to **Connections** (or use the **+** in the nav).
4. Add a connection and submit.
5. Refresh the page—the row should still load from PostgreSQL.

**Flow:** Frontend → `POST /api/connections` (with `X-User-Id`) → Express → PostgreSQL → UI.

You can also open a **past calendar event**, report **Happened** or **Fell Through**, and confirm behavior for **liked vs not liked** linked connections (milestones vs Like-first flow).

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |
| GET | `/api/users` | List user profiles |
| POST | `/api/users` | Create user (max 5) |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/user-settings/:userId` | Get theme & language |
| PUT | `/api/user-settings/:userId` | Update theme & language |
| GET | `/api/connections` | List connections (`X-User-Id` required) |
| POST | `/api/connections` | Create connection |
| PUT | `/api/connections/:id` | Update connection |
| DELETE | `/api/connections/:id` | Delete connection |
| GET | `/api/events` | List events |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event (includes reporting fields when saving outcomes) |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |
| POST | `/api/rizzbot` | RizzBot feedback (`X-User-Id`; optional Gemini) |

---

## Brand assets

The app logo and favicon use the same image: **`frontend/public/keeper-logo.png`**. Vite serves everything in `public/` at the site root (for example `/keeper-logo.png` in `index.html` and in the `AppLogo` component).

---

## Project Structure

```
401project-2/          # root folder name may differ
├── frontend/
│   ├── public/
│   │   ├── keeper-logo.png   # logo + favicon source
│   │   └── ...
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── middleware/
│   ├── routes/
│   ├── db.js
│   ├── server.js
│   ├── app.js
│   ├── .env.example
│   └── package.json
├── db/
│   ├── schema.sql
│   ├── seed.sql
│   ├── migrations/
│   └── ERD.md
└── README.md
```

---

## EARS Requirements

### Complete

1. **Ubiquitous:** The system shall synchronize goals, calendar events, and dating milestones across the app (API-backed persistence; milestones updated from connection edits and from **happened** event reports when applicable).
2. **Event-Driven:** When a user applies a filter, the system shall organize calendar events around that filter. *(Map page: filter events by connection.)*
3. **State-Driven:** While the user is working with the calendar, structured flows guide creation and **past-event reporting** (outcome, notes, milestones when the linked connection is **liked**).

### Not Complete

1. **Ubiquitous:** Key Indicator (KI) Dashboard summarizing personal and relationship goal progress.
2. **Event-Driven:** Prompt to assign a “Next Step” task when creating a new dating contact.
3. **Event-Driven:** Filter goals the same way events are filtered on the map. *(Goals page has no connection-style filter.)*
4. **State-Driven:** Discovery / matching UI for finding other users.

---

## Features (current)

- **Profiles** (max 5): selection screen, optional PIN
- **Connections**: add/edit, **liked** toggle, notes, milestones; detail milestones UI only when **liked**; cards show flame streak only when **liked** and streak threshold met
- **Calendar**: day-focused lists, optional global **past** / **future** sections, indicators for **unreported past events**, event modal (create/edit/report), **Happened** / **Fell Through** with notes; **report milestones** only for **liked** linked connections (otherwise **Like** first)
- **Map**: events with optional connection filter and geography
- **Goals**: measurable or completion-based, categories, progress/history
- **RizzBot**: draft feedback using connection/event context; **Gemini** when API key is set
- **Settings / Index**: themes, language, profile edit; home calendar snippet with report-needed cue when relevant

---

## Pushing to GitHub

From the repository root, after you are happy with your changes:

```bash
# See what will be committed (ensure no secrets, e.g. backend/.env)
git status

# Stage files (avoid staging .env — use .gitignore or selective add)
git add README.md db/ backend/ frontend/src/ frontend/package.json frontend/vite.config.ts
# Or stage everything that should be tracked:
# git add -A
# Then run `git status` again and unstage any secret files if needed:
# git restore --staged backend/.env

git commit -m "Describe your changes in a short message"

# If remote is not set yet (one-time):
# git remote add origin https://github.com/<your-username>/<your-repo>.git

# Push (use main or master to match your default branch)
git push -u origin main
```

If the default branch on GitHub is `master`, use `git push -u origin master` instead.

For an existing remote, a normal update is:

```bash
git push origin main
```

---

## Production build (frontend)

```bash
cd frontend
npm run build
```

Output is written to `frontend/dist/`.
