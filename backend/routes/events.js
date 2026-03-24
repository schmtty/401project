/**
 * Calendar Events API - CRUD for events (user-scoped)
 * Requires X-User-Id header
 */
import express from 'express';
import pool from '../db.js';
import { requireUserId } from '../middleware/userId.js';

const router = express.Router();
router.use(requireUserId);

const VALID_STATUSES = new Set(['planned', 'happened', 'fell_through']);

function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function eventMinutesFromMidnight(timeStr) {
  const [h = 12, m = 0] = String(timeStr || '12:00').split(':').map((x) => parseInt(x, 10));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/** Event is "past" when date/time is not after the server's current local moment */
function isEventInPast(dateStr, timeStr, now = new Date()) {
  const today = localDateStr(now);
  if (dateStr < today) return true;
  if (dateStr > today) return false;
  return eventMinutesFromMidnight(timeStr) <= now.getHours() * 60 + now.getMinutes();
}

// Format date as YYYY-MM-DD for frontend
function formatDate(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  return val.toISOString().slice(0, 10);
}

function normalizeReportMilestones(status, raw) {
  if (status !== 'happened' || !raw || typeof raw !== 'object') return null;
  return {
    heldHands: !!raw.heldHands,
    kissed: !!raw.kissed,
    metParents: !!raw.metParents,
  };
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
    status: row.status || 'planned',
    reportedAt: row.reported_at ? new Date(row.reported_at).toISOString() : null,
    reportNotes: row.report_notes || '',
    reportMilestones: row.report_milestones || null,
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
      `INSERT INTO calendar_events (id, user_id, title, date, time, location, notes, type, connection_id, color, lat, lng, status, reported_at, report_notes, report_milestones)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'planned', NULL, '', NULL)`,
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
    const {
      title,
      date,
      time,
      location,
      notes,
      type,
      connectionId,
      color,
      lat,
      lng,
      status: bodyStatus,
      reportedAt: bodyReportedAt,
      reportNotes,
      reportMilestones,
    } = req.body;

    let status = bodyStatus ?? 'planned';
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const dateVal = date ?? '';
    const timeVal = time ?? '12:00';

    if (status === 'happened' || status === 'fell_through') {
      if (!isEventInPast(dateVal, timeVal)) {
        return res.status(400).json({ error: 'Cannot report outcome for a future event' });
      }
    }

    const existing = await pool.query('SELECT reported_at FROM calendar_events WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let reportedAt = null;
    let repMilestones = null;
    let repNotes = reportNotes ?? '';

    if (status === 'planned') {
      reportedAt = null;
      repMilestones = null;
      repNotes = '';
    } else {
      reportedAt = existing.rows[0].reported_at
        ? existing.rows[0].reported_at
        : bodyReportedAt
          ? new Date(bodyReportedAt)
          : new Date();
      if (status === 'fell_through') {
        repMilestones = null;
      } else {
        repMilestones = normalizeReportMilestones(status, reportMilestones);
      }
    }

    await pool.query(
      `UPDATE calendar_events SET title = $1, date = $2, time = $3, location = $4, notes = $5, type = $6, connection_id = $7, color = $8, lat = $9, lng = $10,
        status = $11, reported_at = $12, report_notes = $13, report_milestones = $14
       WHERE id = $15 AND user_id = $16`,
      [
        title,
        dateVal,
        timeVal,
        location ?? '',
        notes ?? '',
        type ?? 'date',
        connectionId || null,
        color || null,
        lat ?? null,
        lng ?? null,
        status,
        reportedAt,
        repNotes,
        repMilestones ? JSON.stringify(repMilestones) : null,
        id,
        req.userId,
      ]
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
