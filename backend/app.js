/**
 * Shared Express app used by local development and Vercel serverless deployment.
 */
import express from 'express';
import cors from 'cors';
import connectionsRouter from './routes/connections.js';
import eventsRouter from './routes/events.js';
import goalsRouter from './routes/goals.js';
import usersRouter from './routes/users.js';
import userSettingsRouter from './routes/userSettings.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/user-settings', userSettingsRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/goals', goalsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Area Book API running' });
});

export default app;
