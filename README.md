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
│   │   ├── pages/
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

## Features

- **Multi-user profiles** (max 5): Netflix-style profile selection with optional PIN
- **Connections**: Track people with milestones (dates, held hands, kissed, met parents, streak)
- **Calendar events**: Dates, hangouts, calls with optional connection links
- **Goals**: Measurable or completion-based, with progress history
- **Per-user theme**: Light, dark, pastel, comfort, sunset
- **Per-user language**: English, Spanish, Chinese (Simplified)
- **Editable profile**: Name and avatar (20 emoji options, including dinosaurs 🦕🦖) in Settings
