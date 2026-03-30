/**
 * Keeper - Express API Server
 * PERN stack - PostgreSQL, Express, React, Node.js
 */
import app from './app.js';
import { ensureUserAuthSchema } from './db.js';

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await ensureUserAuthSchema();
    app.listen(PORT, () => {
      console.log(`Keeper API server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database auth schema:', err);
    process.exit(1);
  }
}

start();
