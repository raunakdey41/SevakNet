'use strict';

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { calcUrgencyScore, deriveTitleFromSurvey, skillForCategory } = require('../services/urgency');
const { extractFieldsFromText, sanitiseExtracted } = require('../services/ocr');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * POST /api/surveys
 * Create a new survey, calculate urgency score, auto-create a task.
 */
router.post('/', async (req, res) => {
  const { location_id, reported_by, urgency_level, affected_people, category, description } = req.body;

  if (!location_id || !urgency_level || !category) {
    return res.status(400).json({ error: 'location_id, urgency_level, and category are required.' });
  }

  const urgency_score = calcUrgencyScore({
    urgency_level,
    affected_people: affected_people || 0,
    category,
    reported_at: new Date(),
  });

  const client = await require('../db').getClient();
  try {
    await client.query('BEGIN');

    // Insert survey
    const surveyResult = await client.query(
      `INSERT INTO surveys (location_id, reported_by, urgency_level, affected_people, category, description, urgency_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [location_id, reported_by || 'Anonymous', urgency_level, affected_people || 0, category, description || '', urgency_score]
    );
    const survey = surveyResult.rows[0];

    // Auto-create task
    const title = deriveTitleFromSurvey(survey);
    const skill = skillForCategory(category);
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h from now

    const taskResult = await client.query(
      `INSERT INTO tasks (survey_id, location_id, title, skill_required, status, deadline, urgency_score)
       VALUES ($1, $2, $3, $4, 'open', $5, $6) RETURNING *`,
      [survey.id, location_id, title, skill, deadline, urgency_score]
    );
    const task = taskResult.rows[0];

    await client.query('COMMIT');
    res.status(201).json({ survey, task });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[POST /surveys]', err.message);
    res.status(500).json({ error: 'Failed to create survey.', detail: err.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/surveys
 * List all surveys ordered by urgency_score DESC.
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, l.ward_name, l.block, l.district,
              ST_X(l.geom) AS lng, ST_Y(l.geom) AS lat
       FROM surveys s
       JOIN locations l ON s.location_id = l.id
       ORDER BY s.urgency_score DESC, s.reported_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /surveys]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/surveys/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, l.ward_name, l.block, l.district,
              ST_X(l.geom) AS lng, ST_Y(l.geom) AS lat
       FROM surveys s
       JOIN locations l ON s.location_id = l.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Survey not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/surveys/ocr
 * Accept raw OCR text (or image) and extract structured fields.
 * Tesseract.js runs client-side; this endpoint handles text→field parsing.
 */
router.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    const rawText = req.body.raw_text || '';
    if (!rawText && !req.file) {
      return res.status(400).json({ error: 'Provide raw_text or an image file.' });
    }

    const extracted = extractFieldsFromText(rawText);
    const sanitised = sanitiseExtracted(extracted);
    res.json({ extracted_fields: sanitised, confidence: sanitised.confidence });
  } catch (err) {
    console.error('[POST /surveys/ocr]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
