/**
 * User Settings API - theme and language per user
 * GET /api/user-settings/:userId
 * PUT /api/user-settings/:userId
 */
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET settings for user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT user_id, theme, language FROM user_settings WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    const r = result.rows[0];
    res.json({ userId: r.user_id, theme: r.theme, language: r.language });
  } catch (err) {
    console.error('GET /api/user-settings/:userId error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT update settings
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { theme, language } = req.body;
    await pool.query(
      `UPDATE user_settings SET theme = COALESCE($1, theme), language = COALESCE($2, language), updated_at = NOW() WHERE user_id = $3`,
      [theme, language, userId]
    );
    const result = await pool.query(
      'SELECT user_id, theme, language FROM user_settings WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    const r = result.rows[0];
    res.json({ userId: r.user_id, theme: r.theme, language: r.language });
  } catch (err) {
    console.error('PUT /api/user-settings/:userId error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
