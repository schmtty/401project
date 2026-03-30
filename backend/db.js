/**
 * PostgreSQL connection pool using node-postgres (pg)
 * No ORM - raw SQL only
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
const useSsl =
  process.env.PGSSL === 'true' ||
  process.env.PGSSLMODE === 'require' ||
  (databaseUrl && databaseUrl.includes('sslmode=require')) ||
  (process.env.NODE_ENV === 'production' && databaseUrl && !databaseUrl.includes('localhost'));

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

function slugifyUsername(name) {
  const slug = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'user';
}

export async function ensureUserAuthSchema() {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username VARCHAR(50),
      ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT TRUE;
  `);

  const usersRes = await pool.query(`
    SELECT id, name, username, created_at
    FROM users
    ORDER BY created_at, id
  `);

  const seen = new Set();
  const updates = [];

  for (const row of usersRes.rows) {
    let current = (row.username || '').trim().toLowerCase();
    if (!current || seen.has(current)) {
      const base = slugifyUsername(row.name);
      let candidate = base;
      let suffix = 2;
      while (seen.has(candidate)) {
        candidate = `${base}_${suffix++}`;
      }
      current = candidate;
      updates.push({ id: row.id, username: current });
    }
    seen.add(current);
  }

  for (const u of updates) {
    await pool.query('UPDATE users SET username = $1 WHERE id = $2', [u.username, u.id]);
  }

  await pool.query('ALTER TABLE users ALTER COLUMN username SET NOT NULL');
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username)');
  await pool.query(`
    UPDATE users
    SET must_reset_password = TRUE
    WHERE password_hash IS NULL OR trim(password_hash) = ''
  `);
}

export default pool;
