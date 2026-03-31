/**
 * Goals API - CRUD for goals (user-scoped)
 *
 * All routes require the X-User-Id header (enforced by requireUserId middleware).
 *
 * Endpoints:
 *   GET    /api/goals              - List all goals for the current user, ordered by target_date
 *   POST   /api/goals              - Create a new goal
 *   PUT    /api/goals/:id          - Update a goal (history uses COALESCE to preserve existing data)
 *   DELETE /api/goals/:id          - Delete a goal
 *
 * goalType values: 'measurable' | 'completion'
 * category values: 'love' | 'fitness' | 'school' | 'work' | 'social'
 *
 * History shape (stored as JSONB array):
 *   [{ date: "YYYY-MM-DD", value: number }, ...]
 *   Each entry records a progress snapshot; used to render progress charts on the frontend.
 */
import express from 'express';
import pool from '../db.js';
import { requireUserId } from '../middleware/userId.js';

const router = express.Router();
router.use(requireUserId);

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
 * Transform a raw database row into the camelCase shape expected by the frontend.
 * Always ensures history is an array (guards against raw JSONB being a plain object).
 * @param {object} row - Raw row from the goals table.
 * @returns {object} Frontend-shaped goal object.
 */
function toGoal(row) {
  const g = {
    id: row.id,
    title: row.title,
    goalType: row.goal_type,
    measure: row.measure || '',
    actions: row.actions || '',
    targetDate: formatDate(row.target_date),
    notes: row.notes || '',
    category: row.category,
    target: row.target,
    current: row.current,
  };
  if (row.completed != null) g.completed = row.completed;
  if (row.history && Array.isArray(row.history)) g.history = row.history;
  else if (row.history) g.history = row.history;
  else g.history = [];
  return g;
}

// GET all goals
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY target_date', [req.userId]);
    res.json(result.rows.map(toGoal));
  } catch (err) {
    console.error('GET /api/goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST create goal
router.post('/', async (req, res) => {
  try {
    const { id, title, goalType, measure, actions, targetDate, notes, category, target, current, completed, history } = req.body;
    if (!id || !title || !targetDate) {
      return res.status(400).json({ error: 'id, title, and targetDate are required' });
    }
    await pool.query(
      `INSERT INTO goals (id, user_id, title, goal_type, measure, actions, target_date, notes, category, target, current, completed, history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [id, req.userId, title, goalType ?? 'measurable', measure ?? '', actions ?? '', targetDate, notes ?? '', category ?? 'love', target ?? 0, current ?? 0, completed ?? false, JSON.stringify(history || [])]
    );
    const created = await pool.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.status(201).json(toGoal(created.rows[0]));
  } catch (err) {
    console.error('POST /api/goals error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT update goal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, goalType, measure, actions, targetDate, notes, category, target, current, completed, history } = req.body;
    await pool.query(
      `UPDATE goals SET title = $1, goal_type = $2, measure = $3, actions = $4, target_date = $5, notes = $6, category = $7, target = $8, current = $9, completed = $10, history = COALESCE($11::jsonb, history)
       WHERE id = $12 AND user_id = $13`,
      [title, goalType ?? 'measurable', measure ?? '', actions ?? '', targetDate, notes ?? '', category ?? 'love', target ?? 0, current ?? 0, completed ?? false, history ? JSON.stringify(history) : null, id, req.userId]
    );
    const updated = await pool.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(toGoal(updated.rows[0]));
  } catch (err) {
    console.error('PUT /api/goals/:id error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE goal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/goals/:id error:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
