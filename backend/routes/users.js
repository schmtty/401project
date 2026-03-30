/**
 * Users API - auth and CRUD for user profiles
 * GET /api/users
 * POST /api/users
 * PUT /api/users/:id
 * DELETE /api/users/:id
 */
import express from 'express';
import pool from '../db.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';

const router = express.Router();
const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const MIN_PASSWORD_LENGTH = 8;

function normalizeUsername(raw) {
  return String(raw || '').trim().toLowerCase();
}

function userRowToPublic(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    avatar: row.avatar,
    mustResetPassword: !!row.must_reset_password,
    createdAt: row.created_at,
  };
}

// GET all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, name, avatar, must_reset_password, created_at FROM users ORDER BY created_at'
    );
    res.json(result.rows.map(userRowToPublic));
  } catch (err) {
    console.error('GET /api/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const { id, username, name, password, avatar } = req.body;
    const normalizedUsername = normalizeUsername(username);
    if (!id || !name || !normalizedUsername || !password) {
      return res.status(400).json({ error: 'id, username, name, and password are required' });
    }
    if (!USERNAME_RE.test(normalizedUsername)) {
      return res.status(400).json({ error: 'Username must be 3-30 chars: lowercase letters, numbers, underscore.' });
    }
    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }
    const passwordHash = await hashPassword(String(password));

    await pool.query(
      'INSERT INTO users (id, username, name, pin, password_hash, must_reset_password, avatar) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, normalizedUsername, name, null, passwordHash, false, avatar || '👨']
    );
    await pool.query(
      'INSERT INTO user_settings (id, user_id, theme, language) VALUES ($1, $2, $3, $4)',
      [`us_${id}`, id, 'light', 'en']
    );
    const created = await pool.query(
      'SELECT id, username, name, avatar, must_reset_password, created_at FROM users WHERE id = $1',
      [id]
    );
    res.status(201).json(userRowToPublic(created.rows[0]));
  } catch (err) {
    console.error('POST /api/users error:', err);
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update user (name, avatar, username) - only updates fields present in body
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar } = req.body;
    const updates = [];
    const values = [];
    let i = 1;
    if ('name' in req.body) { updates.push(`name = $${i++}`); values.push(name ?? ''); }
    if ('username' in req.body) {
      const normalizedUsername = normalizeUsername(req.body.username);
      if (!USERNAME_RE.test(normalizedUsername)) {
        return res.status(400).json({ error: 'Username must be 3-30 chars: lowercase letters, numbers, underscore.' });
      }
      updates.push(`username = $${i++}`);
      values.push(normalizedUsername);
    }
    if ('avatar' in req.body) { updates.push(`avatar = $${i++}`); values.push(avatar ?? '👤'); }
    if (updates.length === 0) {
      const u = await pool.query(
        'SELECT id, username, name, avatar, must_reset_password, created_at FROM users WHERE id = $1',
        [id]
      );
      if (u.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json(userRowToPublic(u.rows[0]));
    }
    values.push(id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`, values);
    const updated = await pool.query(
      'SELECT id, username, name, avatar, must_reset_password, created_at FROM users WHERE id = $1',
      [id]
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(userRowToPublic(updated.rows[0]));
  } catch (err) {
    console.error('PUT /api/users/:id error:', err);
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
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

// POST login with username + password
router.post('/login', async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password ?? '');
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const result = await pool.query(
      'SELECT id, username, name, avatar, password_hash, pin, must_reset_password, created_at FROM users WHERE username = $1',
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];
    let valid = false;
    if (user.password_hash) {
      valid = await verifyPassword(password, user.password_hash);
    } else if (user.must_reset_password && user.pin) {
      // Legacy migration bridge: PIN can be used one time as password
      // until the user sets a real password.
      valid = password === user.pin;
    }
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    return res.json(userRowToPublic(user));
  } catch (err) {
    console.error('POST /api/users/login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST set/reset password
router.post('/:id/set-password', async (req, res) => {
  try {
    const { id } = req.params;
    const currentPassword = String(req.body?.currentPassword ?? '');
    const newPassword = String(req.body?.newPassword ?? '');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }

    const result = await pool.query(
      'SELECT id, username, name, avatar, password_hash, pin, must_reset_password, created_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    let canUpdate = false;
    if (user.password_hash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      canUpdate = await verifyPassword(currentPassword, user.password_hash);
    } else if (user.must_reset_password) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      // Legacy bridge for migrated users without password hash.
      canUpdate = user.pin ? currentPassword === user.pin : true;
    }

    if (!canUpdate) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const nextHash = await hashPassword(newPassword);
    await pool.query(
      'UPDATE users SET password_hash = $1, must_reset_password = FALSE, pin = NULL WHERE id = $2',
      [nextHash, id]
    );

    const updated = await pool.query(
      'SELECT id, username, name, avatar, must_reset_password, created_at FROM users WHERE id = $1',
      [id]
    );
    return res.json(userRowToPublic(updated.rows[0]));
  } catch (err) {
    console.error('POST /api/users/:id/set-password error:', err);
    res.status(500).json({ error: 'Failed to set password' });
  }
});

export default router;
