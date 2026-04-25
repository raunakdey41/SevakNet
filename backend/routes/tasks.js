'use strict';

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { getTopMatches } = require('../services/matching');
const { getUrgencyLabel } = require('../services/urgency');

/**
 * GET /api/tasks/dashboard
 * Returns tasks grouped by urgency tier.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.*,
              ST_X(l.geom) AS lng, ST_Y(l.geom) AS lat,
              l.ward_name, l.block, l.district
       FROM tasks t
       JOIN locations l ON t.location_id = l.id
       WHERE t.status = 'open'
       ORDER BY t.urgency_score DESC`
    );

    const grouped = { critical: [], high: [], medium: [], low: [] };
    for (const task of rows) {
      const { label } = getUrgencyLabel(task.urgency_score);
      grouped[label.toLowerCase()].push(task);
    }

    const total = rows.length;
    const assignedCount = await query(
      `SELECT COUNT(*) FROM tasks WHERE status = 'assigned'`
    );
    const unassigned = total;
    const assigned = parseInt(assignedCount.rows[0].count, 10);

    res.json({ ...grouped, summary: { total, unassigned, assigned } });
  } catch (err) {
    console.error('[GET /tasks/dashboard]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tasks/nearby?lat=&lng=&radius=
 * Find open tasks within radius km of a point.
 */
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required.' });

  try {
    const { rows } = await query(
      `SELECT t.*,
              ST_X(l.geom) AS lng, ST_Y(l.geom) AS lat,
              l.ward_name, l.block, l.district,
              ST_Distance(
                l.geom::geography,
                ST_MakePoint($2, $1)::geography
              ) / 1000 AS distance_km
       FROM tasks t
       JOIN locations l ON t.location_id = l.id
       WHERE t.status = 'open'
         AND ST_DWithin(
           l.geom::geography,
           ST_MakePoint($2, $1)::geography,
           $3 * 1000
         )
       ORDER BY t.urgency_score DESC`,
      [lat, lng, radius]
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /tasks/nearby]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tasks/:id/matches
 * Run volunteer matching for a task.
 */
router.get('/:id/matches', async (req, res) => {
  try {
    const taskResult = await query(
      `SELECT t.*,
              ST_X(l.geom) AS lng, ST_Y(l.geom) AS lat
       FROM tasks t
       JOIN locations l ON t.location_id = l.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!taskResult.rows.length) return res.status(404).json({ error: 'Task not found.' });
    const task = taskResult.rows[0];

    const volResult = await query(
      `SELECT v.*,
              ST_X(v.geom) AS geom_lng, ST_Y(v.geom) AS geom_lat,
              l.ward_name
       FROM volunteers v
       LEFT JOIN locations l ON v.location_id = l.id
       WHERE v.is_active = TRUE`
    );
    const volunteers = volResult.rows;

    const taskWithCoords = { ...task, lat: task.lat, lng: task.lng };
    const volunteersWithCoords = volunteers.map((v) => ({
      ...v,
      lat: v.geom_lat,
      lng: v.geom_lng,
    }));

    const matches = getTopMatches(taskWithCoords, volunteersWithCoords);
    res.json(matches);
  } catch (err) {
    console.error('[GET /tasks/:id/matches]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tasks
 * List all tasks.
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let where = '';
    if (status) { where = 'WHERE t.status = $1'; params.push(status); }

    const { rows } = await query(
      `SELECT t.*,
              ST_X(l.geom) AS lng, ST_Y(l.geom) AS lat,
              l.ward_name, l.block, l.district
       FROM tasks t
       JOIN locations l ON t.location_id = l.id
       ${where}
       ORDER BY t.urgency_score DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tasks/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.*,
              ST_X(l.geom) AS lng, ST_Y(l.geom) AS lat,
              l.ward_name, l.block, l.district
       FROM tasks t
       JOIN locations l ON t.location_id = l.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/tasks/:id
 */
router.patch('/:id', async (req, res) => {
  const { status, title, skill_required, deadline } = req.body;
  try {
    const { rows } = await query(
      `UPDATE tasks SET
         status = COALESCE($2, status),
         title = COALESCE($3, title),
         skill_required = COALESCE($4, skill_required),
         deadline = COALESCE($5, deadline)
       WHERE id = $1 RETURNING *`,
      [req.params.id, status, title, skill_required, deadline]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
