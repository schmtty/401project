import express from 'express';
import pool from '../db.js';

const router = express.Router();

// System-wide OKR: average number of connections per user.
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM connections) AS total_connections
    `);

    const totalUsers = result.rows[0]?.total_users ?? 0;
    const totalConnections = result.rows[0]?.total_connections ?? 0;
    const averageConnectionsPerUser = totalUsers > 0 ? totalConnections / totalUsers : 0;

    res.json({
      totalUsers,
      totalConnections,
      averageConnectionsPerUser,
      calculatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/okr error:', err);
    res.status(500).json({ error: 'Failed to calculate OKR' });
  }
});

export default router;
