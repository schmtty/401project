/**
 * Connections API - CRUD for connections (user-scoped)
 * Requires X-User-Id header
 */
import express from 'express';
import pool from '../db.js';
import { requireUserId } from '../middleware/userId.js';

const router = express.Router();
router.use(requireUserId);

// Format date as YYYY-MM-DD
function formatDate(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  return val.toISOString().slice(0, 10);
}

// Transform DB row to frontend format (snake_case -> camelCase)
function toConnection(row) {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    phone: row.phone || '',
    location: row.location || '',
    notes: row.notes || '',
    gender: row.gender,
    relationship: row.relationship,
    liked: row.liked,
    createdAt: formatDate(row.created_at),
    milestones: row.milestones || { dates: 0, heldHands: false, kissed: false, metParents: false, contactStreak: 0 },
  };
}

// GET all connections for user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM connections WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows.map(toConnection));
  } catch (err) {
    console.error('GET /api/connections error:', err);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// POST create connection
router.post('/', async (req, res) => {
  try {
    const { id, name, age, phone, location, notes, gender, relationship, liked, createdAt, milestones } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }
    const m = milestones || { dates: 0, heldHands: false, kissed: false, metParents: false, contactStreak: 0 };
    await pool.query(
      `INSERT INTO connections (id, user_id, name, age, phone, location, notes, gender, relationship, liked, created_at, milestones)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, req.userId, name, age ?? 0, phone ?? '', location ?? '', notes ?? '', gender ?? 'male', relationship ?? 'connection', liked ?? false, createdAt ?? new Date().toISOString().split('T')[0], JSON.stringify(m)]
    );
    const created = await pool.query('SELECT * FROM connections WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.status(201).json(toConnection(created.rows[0]));
  } catch (err) {
    console.error('POST /api/connections error:', err);
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

// PUT update connection
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, phone, location, notes, gender, relationship, liked, milestones } = req.body;
    await pool.query(
      `UPDATE connections SET name = $1, age = $2, phone = $3, location = $4, notes = $5, gender = $6, relationship = $7, liked = $8, milestones = COALESCE($9::jsonb, milestones)
       WHERE id = $10 AND user_id = $11`,
      [name, age ?? 0, phone ?? '', location ?? '', notes ?? '', gender ?? 'male', relationship ?? 'connection', liked ?? false, milestones ? JSON.stringify(milestones) : null, id, req.userId]
    );
    const updated = await pool.query('SELECT * FROM connections WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    res.json(toConnection(updated.rows[0]));
  } catch (err) {
    console.error('PUT /api/connections/:id error:', err);
    res.status(500).json({ error: 'Failed to update connection' });
  }
});

// DELETE connection
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM connections WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/connections/:id error:', err);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

export default router;
