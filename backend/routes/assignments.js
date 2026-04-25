'use strict';

const express = require('express');
const router = express.Router();
const { query, getClient } = require('../db');

/**
 * POST /api/assignments
 * Assign a volunteer to a task.
 */
router.post('/', async (req, res) => {
  const { task_id, volunteer_id, match_score } = req.body;

  if (!task_id || !volunteer_id) {
    return res.status(400).json({ error: 'task_id and volunteer_id are required.' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Check task is still open
    const taskCheck = await client.query(
      `SELECT id, status FROM tasks WHERE id = $1 FOR UPDATE`,
      [task_id]
    );
    if (!taskCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Task not found.' });
    }
    if (taskCheck.rows[0].status !== 'open') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Task is already ${taskCheck.rows[0].status}.` });
    }

    // Check volunteer exists and is active
    const volCheck = await client.query(
      `SELECT id, is_active FROM volunteers WHERE id = $1`,
      [volunteer_id]
    );
    if (!volCheck.rows.length || !volCheck.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Volunteer not found or inactive.' });
    }

    // Create assignment
    const assignResult = await client.query(
      `INSERT INTO assignments (task_id, volunteer_id, match_score, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [task_id, volunteer_id, match_score || null]
    );

    // Update task status
    await client.query(
      `UPDATE tasks SET status = 'assigned' WHERE id = $1`,
      [task_id]
    );

    await client.query('COMMIT');
    res.status(201).json(assignResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[POST /assignments]', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/assignments
 * List all assignments with joined volunteer + task info.
 */
router.get('/', async (req, res) => {
  try {
    const { volunteer_id, task_id, status } = req.query;
    const conditions = [];
    const params = [];
    let i = 1;

    if (volunteer_id) { conditions.push(`a.volunteer_id = $${i++}`); params.push(volunteer_id); }
    if (task_id) { conditions.push(`a.task_id = $${i++}`); params.push(task_id); }
    if (status) { conditions.push(`a.status = $${i++}`); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT a.*,
              v.name AS volunteer_name, v.phone, v.skills,
              t.title AS task_title, t.urgency_score, t.skill_required,
              l.ward_name, l.block
       FROM assignments a
       JOIN volunteers v ON a.volunteer_id = v.id
       JOIN tasks t ON a.task_id = t.id
       JOIN locations l ON t.location_id = l.id
       ${where}
       ORDER BY a.assigned_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/assignments/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT a.*,
              v.name AS volunteer_name, v.phone, v.skills,
              t.title AS task_title, t.urgency_score, t.skill_required
       FROM assignments a
       JOIN volunteers v ON a.volunteer_id = v.id
       JOIN tasks t ON a.task_id = t.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Assignment not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/assignments/:id
 * Update assignment status (e.g. accepted, completed, rejected).
 */
router.patch('/:id', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const { rows } = await query(
      `UPDATE assignments SET status = $2 WHERE id = $1 RETURNING *`,
      [req.params.id, status]
    );
    if (!rows.length) return res.status(404).json({ error: 'Assignment not found.' });

    // If completed/rejected, re-open the task
    if (['completed', 'rejected'].includes(status)) {
      await query(
        `UPDATE tasks SET status = $2
         WHERE id = (SELECT task_id FROM assignments WHERE id = $1)
           AND status = 'assigned'`,
        [req.params.id, status === 'completed' ? 'completed' : 'open']
      );
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
