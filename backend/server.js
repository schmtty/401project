/**
 * Area Book 2.0 - Express API Server
 * PERN stack - PostgreSQL, Express, React, Node.js
 */
import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Area Book API server running on http://localhost:${PORT}`);
});
