/**
 * PostgreSQL connection pool using node-postgres (pg)
 * No ORM - raw SQL only
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export default pool;
