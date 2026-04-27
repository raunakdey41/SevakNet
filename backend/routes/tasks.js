'use strict';

const express = require('express');
const router = express.Router();
const { col, snapToArr, docToObj } = require('../db');
const { getUrgencyLabel } = require('../services/urgency');
const { getTopMatches } = require('../services/matching');

/**
 * GET /api/tasks/dashboard
 * Returns tasks grouped by urgency tier.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const snap = await col('tasks').get();
    const all = snapToArr(snap);

    let rows = all.filter((t) => t.status === 'open');
    
    // Filter by district if provided
    const { district } = req.query;
    if (district) {
      rows = rows.filter((t) => t.district === district);
    }

    rows.sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0));
    const grouped = { critical: [], high: [], medium: [], low: [] };

    for (const task of rows) {
      const { label } = getUrgencyLabel(task.urgency_score);
      grouped[label.toLowerCase()].push(task);
    }

    let assigned = all.filter((t) => t.status === 'assigned');
    if (district) {
      assigned = assigned.filter((t) => t.district === district);
    }
    assigned = assigned.length;

    res.json({
      ...grouped,
      summary: { total: rows.length, unassigned: rows.length, assigned },
    });
  } catch (err) {
    console.error('[GET /tasks/dashboard]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tasks/nearby?lat=&lng=&radius=
 * Find open tasks within radius km of a point.
 * Uses haversine client-side filtering (Firestore has no geo queries without GeoFirestore).
 */
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required.' });

  try {
    const snap = await col('tasks').get();
    const rows = snapToArr(snap).filter((t) => t.status === 'open');

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    const nearby = rows
      .filter((t) => t.lat != null && t.lng != null)
      .map((t) => ({ ...t, distance_km: haversine(userLat, userLng, t.lat, t.lng) }))
      .filter((t) => t.distance_km <= radiusKm)
      .sort((a, b) => b.urgency_score - a.urgency_score);

    res.json(nearby);
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
    const taskDoc = await col('tasks').doc(req.params.id).get();
    const task = docToObj(taskDoc);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const volSnap = await col('volunteers').where('is_active', '==', true).get();
    const volunteers = snapToArr(volSnap);

    const matches = getTopMatches(task, volunteers);
    res.json(matches);
  } catch (err) {
    console.error('[GET /tasks/:id/matches]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tasks
 */
router.get('/', async (req, res) => {
  try {
    const { status, district } = req.query;
    const snap = await col('tasks').get();
    let rows = snapToArr(snap);
    if (status) rows = rows.filter((t) => t.status === status);
    if (district) rows = rows.filter((t) => t.district === district);
    rows.sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0));
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
    const doc = await col('tasks').doc(req.params.id).get();
    const task = docToObj(doc);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json(task);
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
    const ref = col('tasks').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Task not found.' });

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;
    if (skill_required !== undefined) updates.skill_required = skill_required;
    if (deadline !== undefined) updates.deadline = deadline;

    await ref.update(updates);
    const updated = { id: doc.id, ...doc.data(), ...updates };
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
