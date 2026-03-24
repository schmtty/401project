# Area Book 2.0

## App Summary

Area Book 2.0 is a relationship planner and goal tracker designed for young single adults. The app helps users manage their social connections, track important milestones (dates, held hands, met parents, etc.), schedule calendar events, and set personal goals across categories like love, fitness, school, work, and social life. Primary users are individuals who want a single place to organize their dating life, friendships, and personal development. The product supports multiple user profiles (Netflix-style) with optional PIN protection, per-user theme and language preferences (English, Spanish, Chinese), and persistent storage in PostgreSQL. Users can add connections, log events, and track progress toward measurable or completion-based goals—all with data that survives page refreshes and device changes.

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL 14+ (via `pg` / node-postgres, no ORM) |
| **Authentication** | Optional PIN per user profile (client-side verification) |
| **External Services** | None |

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
npm -v    # Should show 9.x or higher
psql --version   # Should show psql 14 or higher
```

---

## Installation and Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd 401project
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

### 4. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ab2
PORT=3001
```

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

### First run

1. You will see the **profile selection** page ("Select Profile").
2. Select **Default User** (or create a new profile).
3. You will be taken to the home screen with Connections, Calendar, Map, Goals, and RizzBot.

---

## Verifying the Vertical Slice

The **Add Connection** button is fully wired to the backend. Follow these steps to verify:

1. Start backend and frontend (see above).
2. Open `http://localhost:8080`.
3. Select a user profile (e.g., Default User).
4. Go to **Connections** (or tap the **+** button in the bottom nav).
5. Tap **Add Connection** (or "Add your first connection" if the list is empty).
6. Fill in the form (name, age, phone, etc.) and submit **Add Connection**.
7. The new connection appears in the list.
8. **Refresh the page** (F5 or Ctrl+R).
9. The connection is still there—data is persisted in PostgreSQL.

**Flow:** Frontend → `POST /api/connections` (with `X-User-Id` header) → Express → PostgreSQL → Response → UI update.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all user profiles |
| POST | `/api/users` | Create user (max 5) |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/user-settings/:userId` | Get theme & language |
| PUT | `/api/user-settings/:userId` | Update theme & language |
| GET | `/api/connections` | List connections (requires X-User-Id) |
| POST | `/api/connections` | Create connection |
| PUT | `/api/connections/:id` | Update connection |
| DELETE | `/api/connections/:id` | Delete connection |
| GET | `/api/events` | List events |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |

---

## Project Structure

```
401project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/          ← includes DashboardPage.tsx (new)
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── middleware/
│   ├── routes/
│   ├── db.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── db/
│   ├── schema.sql
│   ├── seed.sql
│   └── ERD.md
└── README.md
```

---

---

## EARS Requirements

### Complete

1. **Ubiquitous:** The system shall synchronize all goals, calendar events, and dating milestones across the app.
2. **Event-Driven:** When a user applies a filter, the system shall organize the calendar events around that filter. *(Implemented on Map page: filter events by connection.)*
3. **State-Driven:** While the user is creating a calendar event, the calendar portion shall guide the user through event creation. *(Event modal provides a structured form: title, date, time, type, location, notes, connection, color.)*
4. **Ubiquitous:** The system shall display a Key Indicator (KI) Dashboard that summarizes progress toward both personal and relationship goals. *(Implemented as `/dashboard` — see KI Dashboard section below.)*
5. **Event-Driven:** When a user creates a new contact in the dating section, the system shall prompt the user to assign a "Next Step" task (to push the person forward in dating). *(Implemented as a post-save modal — see Next Step Prompt section below.)*

### Not Complete

1. **Event-Driven:** When a user applies a filter, the system shall organize the goals around that filter. *(Map filters events by connection; Goals page has no filter.)*
2. **State-Driven:** While the user is in the finding portion of the app, the system shall display other users to create matches. *(No discovery/matching feature exists.)*

---

## Features

- **Multi-user profiles** (max 5): Netflix-style profile selection with optional PIN
- **Connections**: Track people with milestones (dates, held hands, kissed, met parents, streak)
- **Calendar events**: Dates, hangouts, calls with optional connection links
- **Goals**: Measurable or completion-based, with progress history
- **KI Dashboard**: Aggregated Key Indicator view of all goals and relationship stats
- **Next Step Prompts**: Post-save action sheet after adding a new connection
- **Per-user theme**: Light, dark, pastel, comfort, sunset
- **Per-user language**: English, Spanish, Chinese (Simplified)
- **Editable profile**: Name and avatar (20 emoji options, including dinosaurs 🦕🦖) in Settings

---

## KI Dashboard (`/dashboard`)

**File:** `frontend/src/pages/DashboardPage.tsx`

The KI Dashboard is a read-only summary page that aggregates data from Goals, Connections, and Calendar Events into a single at-a-glance view. It satisfies the EARS requirement: *"The system shall display a Key Indicator (KI) Dashboard that summarizes progress toward both personal and relationship goals."*

### Sections

**Overall Progress Ring** — A circular progress ring showing the average completion percentage across all active goal categories. The label adjusts dynamically based on score (e.g., "Crushing it! 🔥" above 80%).

**Goal Progress by Category** — A 2-column grid with one card per category (Love, Fitness, School, Work, Social). Each card shows the category icon, a thin progress bar, the goal count, and the category-average completion percentage. Tapping any card navigates to `/goals`.

**Relationship Indicators** — Four stat cards showing: total connections, total dates logged across all connections, number of connections where "held hands" milestone is reached, and the highest contact streak across all connections. Tapping navigates to `/connections`.

**Upcoming Events (Next 7 Days)** — A list of calendar events with a date within the next 7 days, sorted chronologically, showing up to 4 with a "+N more" overflow button. Tapping navigates to `/calendar`.

### Data flow

The page uses `useGoals()`, `useConnections()`, and `useEvents()` hooks — all of which hit the PostgreSQL-backed API and are scoped to the active `X-User-Id` header. No local state is written; the page is purely derived from existing data.

### Navigation

The Dashboard is accessible from the home screen menu (labeled "Dashboard" / "Panel" / "仪表板" depending on language). Route: `GET /dashboard`.

---

## Next Step Prompt

**File:** `frontend/src/contexts/AddConnectionContext.tsx` (updated)

After a user saves a **new** connection (not an edit), a bottom-sheet modal appears asking *"What's your next step with [Name]?"* This satisfies the EARS requirement: *"When a user creates a new contact in the dating section, the system shall prompt the user to assign a 'Next Step' task."*

### Available Actions

| Option | Behavior |
|--------|----------|
| **Text them** | Acknowledges intent; modal closes. User follows up manually. |
| **Call them** | Acknowledges intent; modal closes. User follows up manually. |
| **Plan a date** | Creates a draft `date`-type calendar event titled "Date with [Name]" for tomorrow at 6:00 PM, linked to the new connection's ID. The event is immediately persisted to PostgreSQL via `POST /api/events`. |
| **Skip for now** | Closes the modal with no action. |

### Implementation details

The `AddConnectionProvider` now maintains a `pendingNextStep: Connection | null` state. When a new connection is saved, the add-connection sheet closes immediately and `pendingNextStep` is set to the newly-created connection, triggering the `NextStepModal` to render at `z-[70]` (above all other UI). Choosing "Plan a date" calls `setEvents()` which syncs to the backend via the existing `useEvents` hook. All other choices simply clear `pendingNextStep`.
