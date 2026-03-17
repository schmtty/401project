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
  (process.env.NODE_ENV === 'production' && databaseUrl && !databaseUrl.includes('localhost'));

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export default pool;
