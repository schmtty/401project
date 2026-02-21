/**
 * Calendar Events API - CRUD for events (user-scoped)
 * Requires X-User-Id header
 */
import express from 'express';
import pool from '../db.js';
import { requireUserId } from '../middleware/userId.js';

const router = express.Router();
router.use(requireUserId);

// Format date as YYYY-MM-DD for frontend
function formatDate(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  return val.toISOString().slice(0, 10);
}

// Transform DB row to frontend format
function toEvent(row) {
  const e = {
    id: row.id,
    title: row.title,
    date: formatDate(row.date),
    time: row.time || '12:00',
    location: row.location || '',
    notes: row.notes || '',
    type: row.type,
    connectionId: row.connection_id || undefined,
    color: row.color || undefined,
  };
  if (row.lat != null) e.lat = parseFloat(row.lat);
  if (row.lng != null) e.lng = parseFloat(row.lng);
  return e;
}

// GET all events
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY date, time', [req.userId]);
    res.json(result.rows.map(toEvent));
  } catch (err) {
    console.error('GET /api/events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST create event
router.post('/', async (req, res) => {
  try {
    const { id, title, date, time, location, notes, type, connectionId, color, lat, lng } = req.body;
    if (!id || !title || !date) {
      return res.status(400).json({ error: 'id, title, and date are required' });
    }
    await pool.query(
      `INSERT INTO calendar_events (id, user_id, title, date, time, location, notes, type, connection_id, color, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, req.userId, title, date, time ?? '12:00', location ?? '', notes ?? '', type ?? 'date', connectionId || null, color || null, lat ?? null, lng ?? null]
    );
    const created = await pool.query('SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.status(201).json(toEvent(created.rows[0]));
  } catch (err) {
    console.error('POST /api/events error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, time, location, notes, type, connectionId, color, lat, lng } = req.body;
    await pool.query(
      `UPDATE calendar_events SET title = $1, date = $2, time = $3, location = $4, notes = $5, type = $6, connection_id = $7, color = $8, lat = $9, lng = $10
       WHERE id = $11 AND user_id = $12`,
      [title, date ?? '', time ?? '12:00', location ?? '', notes ?? '', type ?? 'date', connectionId || null, color || null, lat ?? null, lng ?? null, id, req.userId]
    );
    const updated = await pool.query('SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(toEvent(updated.rows[0]));
  } catch (err) {
    console.error('PUT /api/events/:id error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/events/:id error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
