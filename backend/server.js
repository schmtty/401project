/**
 * Keeper - Express API Server
 * PERN stack - PostgreSQL, Express, React, Node.js
 */
import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Keeper API server running on http://localhost:${PORT}`);
});
