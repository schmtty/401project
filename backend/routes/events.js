/**
 * Calendar Events API - CRUD for events (user-scoped)
 *
 * All routes require the X-User-Id header (enforced by requireUserId middleware).
 *
 * Endpoints:
 *   GET    /api/events             - List all events for the current user, ordered by date/time
 *   POST   /api/events             - Create a new event (status defaults to 'planned')
 *   PUT    /api/events/:id         - Update event fields and/or report an outcome
 *   DELETE /api/events/:id         - Delete an event
 *
 * Event status lifecycle:
 *   planned -> happened    (outcome was reported; enables milestone reporting)
 *   planned -> fell_through (outcome was reported; milestones are cleared)
 *   happened/fell_through -> planned (resets all reporting fields)
 *
 * Reporting milestones shape (stored as JSONB, only present when status === 'happened'):
 *   { heldHands: boolean, kissed: boolean, metParents: boolean }
 */
import express from 'express';
import pool from '../db.js';
import { requireUserId } from '../middleware/userId.js';

const router = express.Router();
router.use(requireUserId);

/** Accepted values for the event status field. */
const VALID_STATUSES = new Set(['planned', 'happened', 'fell_through']);

/**
 * Return today's date as a YYYY-MM-DD string in the server's local timezone.
 * Used to compare event dates without timezone offset confusion.
 * @param {Date} [d=new Date()] - Reference date, defaults to now.
 * @returns {string} YYYY-MM-DD
 */
function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Convert a "HH:MM" time string to minutes since midnight for numeric comparison.
 * Defaults to noon (720) when the input is missing or unparseable.
 * @param {string} timeStr - Time in "HH:MM" format.
 * @returns {number} Minutes since midnight.
 */
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

/**
 * Format a date value as a YYYY-MM-DD string for consistent frontend serialization.
 * @param {Date|string|null} val - Raw date value from the database.
 * @returns {string} YYYY-MM-DD string, or empty string if falsy.
 */
function formatDate(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  return val.toISOString().slice(0, 10);
}

/**
 * Normalize the report_milestones payload sent from the client.
 * Only returns a milestones object when the event actually happened;
 * coerces each flag to a boolean to guard against loose frontend values.
 * @param {string} status - Resolved event status ('happened', 'fell_through', etc.).
 * @param {object|null} raw - Raw milestones object from the request body.
 * @returns {{ heldHands: boolean, kissed: boolean, metParents: boolean }|null}
 */
function normalizeReportMilestones(status, raw) {
  if (status !== 'happened' || !raw || typeof raw !== 'object') return null;
  return {
    heldHands: !!raw.heldHands,
    kissed: !!raw.kissed,
    metParents: !!raw.metParents,
  };
}

/**
 * Transform a raw database row into the camelCase shape expected by the frontend.
 * lat/lng are only included when non-null to avoid sending null coordinates to the map.
 * @param {object} row - Raw row from the calendar_events table.
 * @returns {object} Frontend-shaped event object.
 */
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
