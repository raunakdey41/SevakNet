'use strict';

const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * POST /api/volunteers
 * Register a new volunteer.
 */
router.post('/', async (req, res) => {
  const { name, phone, skills, availability, lat, lng, location_id, fcm_token } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required.' });
  }

  try {
    const geom = lat && lng ? `ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)})` : null;

    const { rows } = await query(
      `INSERT INTO volunteers (name, phone, skills, availability, geom, location_id, fcm_token, is_active)
       VALUES ($1, $2, $3, $4,
         ${geom ? `ST_SetSRID(ST_MakePoint($7, $6), 4326)` : 'NULL'},
         $5, ${geom ? '$8' : '$6'}, TRUE)
       ON CONFLICT (phone) DO UPDATE SET
         name = EXCLUDED.name,
         skills = EXCLUDED.skills,
         availability = EXCLUDED.availability,
         is_active = TRUE,
         fcm_token = EXCLUDED.fcm_token
       RETURNING *`,
      geom
        ? [name, phone, skills || [], availability || [], location_id, lat, lng, fcm_token]
        : [name, phone, skills || [], availability || [], location_id, fcm_token]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /volunteers]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/volunteers
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT v.*,
              ST_X(v.geom) AS lng, ST_Y(v.geom) AS lat,
              l.ward_name, l.block
       FROM volunteers v
       LEFT JOIN locations l ON v.location_id = l.id
       WHERE v.is_active = TRUE
       ORDER BY v.name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/volunteers/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT v.*,
              ST_X(v.geom) AS lng, ST_Y(v.geom) AS lat,
              l.ward_name
       FROM volunteers v
       LEFT JOIN locations l ON v.location_id = l.id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Volunteer not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/volunteers/:id
 */
router.patch('/:id', async (req, res) => {
  const { is_active, fcm_token, skills, availability } = req.body;
  try {
    const { rows } = await query(
      `UPDATE volunteers SET
         is_active = COALESCE($2, is_active),
         fcm_token = COALESCE($3, fcm_token),
         skills = COALESCE($4, skills),
         availability = COALESCE($5, availability)
       WHERE id = $1 RETURNING *`,
      [req.params.id, is_active, fcm_token, skills, availability]
    );
    if (!rows.length) return res.status(404).json({ error: 'Volunteer not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
