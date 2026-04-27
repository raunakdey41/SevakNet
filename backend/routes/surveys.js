'use strict';

const express = require('express');
const router = express.Router();
const { col, snapToArr, docToObj } = require('../db');
const { calcUrgencyScore, deriveTitleFromSurvey, skillForCategory } = require('../services/urgency');
const { triageReport } = require('../services/ai');
const { extractFieldsFromText, sanitiseExtracted } = require('../services/ocr');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

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

  try {
    // Fetch location to denormalise lat/lng/ward info into task
    const locDoc = await col('locations').doc(location_id).get();
    if (!locDoc.exists) return res.status(400).json({ error: 'Location not found.' });
    const location = { id: locDoc.id, ...locDoc.data() };

    const now = new Date();
    
    // AI Triage for manual survey
    const aiTriage = await triageReport(description || '');
    
    const urgency_level_final = Number(urgency_level) || aiTriage?.urgency_level || 3;
    const category_final = category || aiTriage?.category || 'Other';

    const urgency_score = calcUrgencyScore({
      urgency_level: urgency_level_final,
      affected_people: affected_people || 0,
      category: category_final,
      reported_at: now,
    });

    // Create survey
    const surveyId = uuidv4();
    const survey = {
      id: surveyId,
      location_id,
      reported_by: reported_by || 'Anonymous',
      urgency_level: urgency_level_final,
      affected_people: Number(affected_people) || 0,
      category: category_final,
      description: description || '',
      reported_at: now.toISOString(),
      urgency_score,
      ai_summary: aiTriage?.summary || null,
      // Denormalised location fields
      ward_name: location.ward_name || null,
      block: location.block || null,
      district: location.district || null,
    };
    await col('surveys').doc(surveyId).set(survey);

    // Auto-create task
    const title = deriveTitleFromSurvey(survey);
    const skill = skillForCategory(category);
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const taskId = uuidv4();
    const task = {
      id: taskId,
      survey_id: surveyId,
      location_id,
      title,
      skill_required: skill,
      status: 'open',
      deadline,
      urgency_score,
      lat: location.lat || null,
      lng: location.lng || null,
      ward_name: location.ward_name || null,
      block: location.block || null,
      district: location.district || null,
    };
    await col('tasks').doc(taskId).set(task);

    res.status(201).json({ survey, task });
  } catch (err) {
    console.error('[POST /surveys]', err.message);
    res.status(500).json({ error: 'Failed to create survey.', detail: err.message });
  }
});

/**
 * GET /api/surveys
 * List all surveys ordered by urgency_score DESC.
 */
router.get('/', async (req, res) => {
  try {
    const snap = await col('surveys').get();
    const rows = snapToArr(snap).sort((a, b) =>
      (b.urgency_score || 0) - (a.urgency_score || 0) ||
      new Date(b.reported_at) - new Date(a.reported_at)
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
    const doc = await col('surveys').doc(req.params.id).get();
    const survey = docToObj(doc);
    if (!survey) return res.status(404).json({ error: 'Survey not found.' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/surveys/:id
 * Update survey status (pending → reviewed → resolved).
 */
router.patch('/:id', async (req, res) => {
  const { status, note } = req.body;
  const allowed = ['pending', 'reviewed', 'resolved'];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  try {
    const ref = col('surveys').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Survey not found.' });
    const update = { status, updated_at: new Date().toISOString() };
    if (note) update.review_note = note;
    await ref.update(update);
    res.json({ id: req.params.id, ...update });
  } catch (err) {
    console.error('[PATCH /surveys/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/surveys/ocr
 * Accept raw OCR text and extract structured fields via Gemini.
 */
router.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    const rawText = req.body.raw_text || '';
    if (!rawText && !req.file) {
      return res.status(400).json({ error: 'Provide raw_text or an image file.' });
    }
    const extracted = await extractFieldsFromText(rawText);
    const sanitised = sanitiseExtracted(extracted);
    res.json({ extracted_fields: sanitised, confidence: sanitised.confidence });
  } catch (err) {
    console.error('[POST /surveys/ocr]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
