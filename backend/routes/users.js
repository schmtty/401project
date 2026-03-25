/**
 * Users API - CRUD for user profiles
 * GET /api/users
 * POST /api/users
 * PUT /api/users/:id
 * DELETE /api/users/:id
 */
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, pin, avatar, created_at FROM users ORDER BY created_at');
    res.json(result.rows.map((r) => ({ id: r.id, name: r.name, pin: r.pin, avatar: r.avatar, createdAt: r.created_at })));
  } catch (err) {
    console.error('GET /api/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const { id, name, pin, avatar } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }
    await pool.query(
      'INSERT INTO users (id, name, pin, avatar) VALUES ($1, $2, $3, $4)',
      [id, name, pin || null, avatar || '👨']
    );
    await pool.query(
      'INSERT INTO user_settings (id, user_id, theme, language) VALUES ($1, $2, $3, $4)',
      [`us_${id}`, id, 'light', 'en']
    );
    const created = await pool.query('SELECT id, name, pin, avatar, created_at FROM users WHERE id = $1', [id]);
    res.status(201).json({
      id: created.rows[0].id,
      name: created.rows[0].name,
      pin: created.rows[0].pin,
      avatar: created.rows[0].avatar,
      createdAt: created.rows[0].created_at,
    });
  } catch (err) {
    console.error('POST /api/users error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update user (name, avatar, pin) - only updates fields present in body
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pin, avatar } = req.body;
    const updates = [];
    const values = [];
    let i = 1;
    if ('name' in req.body) { updates.push(`name = $${i++}`); values.push(name ?? ''); }
    if ('pin' in req.body) { updates.push(`pin = $${i++}`); values.push(pin || null); }
    if ('avatar' in req.body) { updates.push(`avatar = $${i++}`); values.push(avatar ?? '👤'); }
    if (updates.length === 0) {
      const u = await pool.query('SELECT id, name, pin, avatar, created_at FROM users WHERE id = $1', [id]);
      if (u.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ id: u.rows[0].id, name: u.rows[0].name, pin: u.rows[0].pin, avatar: u.rows[0].avatar, createdAt: u.rows[0].created_at });
    }
    values.push(id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`, values);
    const updated = await pool.query('SELECT id, name, pin, avatar, created_at FROM users WHERE id = $1', [id]);
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: updated.rows[0].id,
      name: updated.rows[0].name,
      pin: updated.rows[0].pin,
      avatar: updated.rows[0].avatar,
      createdAt: updated.rows[0].created_at,
    });
  } catch (err) {
    console.error('PUT /api/users/:id error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE user (cascades to settings, connections, events, goals)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/users/:id error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST verify PIN
router.post('/:id/verify-pin', async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;
    const result = await pool.query('SELECT id, pin FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    if (!user.pin) {
      return res.json({ valid: true });
    }
    return res.json({ valid: user.pin === pin });
  } catch (err) {
    console.error('POST /api/users/:id/verify-pin error:', err);
    res.status(500).json({ error: 'Failed to verify PIN' });
  }
});

export default router;
