'use strict';

const express = require('express');
const router = express.Router();
const { col, snapToArr, docToObj } = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/volunteers
 * Register a new volunteer.
 */
router.post('/', async (req, res) => {
  const { name, phone, skills, availability, lat, lng, location_id } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required.' });
  }

  try {
    // Check for existing volunteer by phone (Firestore doesn't enforce unique constraints)
    const existing = await col('volunteers').where('phone', '==', phone).limit(1).get();

    const volunteerData = {
      name,
      phone,
      skills: skills || [],
      availability: availability || [],
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      location_id: location_id || null,
      is_active: true,
    };

    // Resolve district from location_id if possible
    if (location_id) {
      const locDoc = await col('locations').doc(location_id).get();
      if (locDoc.exists) {
        const locData = locDoc.data();
        volunteerData.district = locData.district || null;
        volunteerData.ward_name = locData.name || locData.ward_name || null;
      }
    }

    let id;
    if (!existing.empty) {
      // Update existing
      id = existing.docs[0].id;
      await col('volunteers').doc(id).update(volunteerData);
    } else {
      id = uuidv4();
      volunteerData.id = id;
      await col('volunteers').doc(id).set(volunteerData);
    }

    res.status(201).json({ id, ...volunteerData });
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
    const { district } = req.query;
    const [vSnap, lSnap] = await Promise.all([
      col('volunteers').where('is_active', '==', true).get(),
      col('locations').get()
    ]);
    const locations = snapToArr(lSnap);
    let rows = snapToArr(vSnap).map(v => {
      const loc = locations.find(l => l.id === v.location_id);
      return { ...v, ward_name: v.ward_name || (loc ? loc.name : 'Unknown'), district: v.district || (loc ? loc.district : null) };
    });

    if (district) {
      rows = rows.filter(v => v.district === district);
    }

    rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
    const doc = await col('volunteers').doc(req.params.id).get();
    const vol = docToObj(doc);
    if (!vol) return res.status(404).json({ error: 'Volunteer not found.' });
    res.json(vol);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/volunteers/:id
 */
router.patch('/:id', async (req, res) => {
  const { is_active, skills, availability, name, phone } = req.body;
  try {
    const ref = col('volunteers').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Volunteer not found.' });

    const updates = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (skills !== undefined) updates.skills = skills;
    if (availability !== undefined) updates.availability = availability;
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    await ref.update(updates);
    res.json({ id: doc.id, ...doc.data(), ...updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/volunteers/:id
 * Soft-delete (deactivates) the volunteer account by default.
 * Pass ?hard=true to permanently remove from Firestore.
 */
router.delete('/:id', async (req, res) => {
  try {
    const ref = col('volunteers').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Volunteer not found.' });

    if (req.query.hard === 'true') {
      // Hard delete — remove document entirely
      await ref.delete();
      return res.json({ success: true, message: 'Volunteer permanently deleted.' });
    }

    // Soft delete — mark inactive and clear sensitive data
    await ref.update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    });
    res.json({ success: true, message: 'Volunteer account deactivated.' });
  } catch (err) {
    console.error('[DELETE /volunteers/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
