# Area Book 2.0 - Entity Relationship Diagram

## Tables Overview (5 tables)

### 1. users

User profiles (Netflix-style). Max 5 per app.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | VARCHAR(50) | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Profile display name |
| pin | VARCHAR(10) | NULL | Optional PIN for access restriction |
| avatar | VARCHAR(10) | NOT NULL, DEFAULT '👨' | Emoji avatar |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

---

### 2. user_settings

Theme and language per user. One row per user.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | VARCHAR(50) | PRIMARY KEY | Unique identifier |
| user_id | VARCHAR(50) | UNIQUE, FK → users(id), ON DELETE CASCADE | User reference |
| theme | VARCHAR(20) | NOT NULL, CHECK | 'light', 'dark', 'pastel', 'comfort', 'sunset' |
| language | VARCHAR(10) | NOT NULL, CHECK | 'en', 'es', 'zh' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

---

### 3. connections

People the user is tracking—friends, family, romantic interests.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | VARCHAR(50) | PRIMARY KEY | Unique identifier |
| user_id | VARCHAR(50) | NOT NULL, FK → users(id), ON DELETE CASCADE | Owner |
| name | VARCHAR(255) | NOT NULL | Full name |
| age | INTEGER | NOT NULL, DEFAULT 0 | Age in years |
| phone | VARCHAR(50) | DEFAULT '' | Phone number |
| location | VARCHAR(255) | DEFAULT '' | Where they met / location |
| notes | TEXT | DEFAULT '' | Free-form notes |
| gender | VARCHAR(10) | NOT NULL, CHECK | 'male' or 'female' |
| relationship | VARCHAR(20) | NOT NULL, CHECK | 'family', 'friend', or 'connection' |
| liked | BOOLEAN | NOT NULL, DEFAULT FALSE | User "likes" this person |
| created_at | DATE | NOT NULL | When added (YYYY-MM-DD) |
| milestones | JSONB | NOT NULL | Object: `{ dates, heldHands, kissed, metParents, contactStreak }` |
| created_timestamp | TIMESTAMPTZ | DEFAULT NOW() | Server-side creation time |

---

### 4. calendar_events

Calendar events: dates, hangouts, calls, texts, etc.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | VARCHAR(50) | PRIMARY KEY | Unique identifier |
| user_id | VARCHAR(50) | NOT NULL, FK → users(id), ON DELETE CASCADE | Owner |
| title | VARCHAR(255) | NOT NULL | Event title |
| date | DATE | NOT NULL | Event date (YYYY-MM-DD) |
| time | VARCHAR(10) | NOT NULL, DEFAULT '12:00' | Time (HH:mm) |
| location | VARCHAR(500) | DEFAULT '' | Location string |
| notes | TEXT | DEFAULT '' | Event notes |
| type | VARCHAR(20) | NOT NULL, CHECK | 'date', 'hangout', 'call', 'text', 'other' |
| connection_id | VARCHAR(50) | FK → connections(id), ON DELETE SET NULL | Optional link to a connection |
| color | VARCHAR(20) | NULL | Hex color for UI |
| lat | DOUBLE PRECISION | NULL | Latitude (if picked on map) |
| lng | DOUBLE PRECISION | NULL | Longitude (if picked on map) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'planned' | 'planned', 'happened', 'fell_through' |
| reported_at | TIMESTAMPTZ | NULL | When the user submitted an outcome report |
| report_notes | TEXT | NULL | Notes from outcome report |
| report_milestones | JSONB | NULL | e.g. `{ heldHands, kissed, metParents }` after report |
| created_timestamp | TIMESTAMPTZ | DEFAULT NOW() | Server-side creation time |

---

### 5. goals

User goals—measurable or completion-based.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | VARCHAR(50) | PRIMARY KEY | Unique identifier |
| user_id | VARCHAR(50) | NOT NULL, FK → users(id), ON DELETE CASCADE | Owner |
| title | VARCHAR(255) | NOT NULL | Goal title |
| goal_type | VARCHAR(20) | NOT NULL, CHECK | 'measurable' or 'completion' |
| measure | VARCHAR(255) | DEFAULT '' | What is being measured |
| actions | TEXT | DEFAULT '' | Action steps |
| target_date | DATE | NOT NULL | Target completion date |
| notes | TEXT | DEFAULT '' | Additional notes |
| category | VARCHAR(20) | NOT NULL, CHECK | 'love', 'fitness', 'school', 'work', 'social' |
| target | INTEGER | NOT NULL, DEFAULT 0 | Target value |
| current | INTEGER | NOT NULL, DEFAULT 0 | Current progress |
| completed | BOOLEAN | DEFAULT FALSE | Whether goal is done |
| history | JSONB | DEFAULT '[]' | Array: `[{ date, value }]` for chart data |
| created_timestamp | TIMESTAMPTZ | DEFAULT NOW() | Server-side creation time |

---

## Relationships

```
users (1) ────── (1) user_settings
  │                    user_id (FK)
  │
  ├────── (many) connections
  │              user_id (FK)
  │
  ├────── (many) calendar_events
  │              user_id (FK)
  │              connection_id (FK, nullable) → connections
  │
  └────── (many) goals
             user_id (FK)
```

- **users** is the root entity. Max 5 profiles per app.
- **user_settings** stores theme and language per user (one row per user).
- **connections**, **calendar_events**, and **goals** belong to a user via `user_id`.
- **calendar_events** optionally links to **connections** via `connection_id`.
