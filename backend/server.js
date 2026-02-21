/**
 * Area Book 2.0 - Express API Server
 * PERN stack - PostgreSQL, Express, React, Node.js
 */
import express from 'express';
import cors from 'cors';
import connectionsRouter from './routes/connections.js';
import eventsRouter from './routes/events.js';
import goalsRouter from './routes/goals.js';
import usersRouter from './routes/users.js';
import userSettingsRouter from './routes/userSettings.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/users', usersRouter);
app.use('/api/user-settings', userSettingsRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/goals', goalsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Area Book API running' });
});

app.listen(PORT, () => {
  console.log(`Area Book API server running on http://localhost:${PORT}`);
});
