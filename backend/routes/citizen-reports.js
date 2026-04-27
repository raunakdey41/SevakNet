'use strict';

const express = require('express');
const router = express.Router();
const { col, snapToArr, docToObj } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { calcUrgencyScore, deriveTitleFromSurvey, skillForCategory } = require('../services/urgency');
const { triageReport } = require('../services/ai');

/**
 * POST /api/citizen-reports
 * Submit a report from a citizen. Creates a survey and an associated task.
 */
router.post('/', async (req, res) => {
  const { name, phone, wardId, category, description } = req.body;

  if (!wardId || !category || !description) {
    return res.status(400).json({ error: 'wardId, category, and description are required.' });
  }

  try {
    // Fetch location details
    const locDoc = await col('locations').doc(wardId).get();
    if (!locDoc.exists) return res.status(400).json({ error: 'Invalid wardId / location not found.' });
    const location = locDoc.data();

    const now = new Date();
    
    // AI Triage
    console.log(`[AI] Processing report: "${description.substring(0, 30)}..."`);
    const aiTriage = await triageReport(description);
    
    const urgency_level = aiTriage ? aiTriage.urgency_level : 3;
    const category_final = aiTriage ? aiTriage.category : category;
    const affected_people = 1; 

    const urgency_score = calcUrgencyScore({
      urgency_level,
      affected_people,
      category: category_final,
      reported_at: now,
    });

    const reportId = 'SNR-' + Date.now().toString().slice(-6);
    const surveyId = uuidv4();
    
    const surveyData = {
      id: surveyId,
      reportId,
      location_id: wardId,
      reported_by: name || 'Anonymous Citizen',
      phone: phone || '',
      urgency_level,
      affected_people,
      category: category_final,
      description,
      reported_at: now.toISOString(),
      urgency_score,
      ai_summary: aiTriage?.summary || null,
      ai_suggested_title: aiTriage?.suggested_title || null,
      status: 'pending', // Pending review
      ward_name: location.ward_name || location.name || wardId,
      block: location.block || null,
      district: location.district || null,
    };

    await col('surveys').doc(surveyId).set(surveyData);

    // Auto-create task
    const title = deriveTitleFromSurvey(surveyData);
    const skill = skillForCategory(category);
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const taskId = uuidv4();

    const taskData = {
      id: taskId,
      survey_id: surveyId,
      location_id: wardId,
      title,
      skill_required: skill,
      status: 'open',
      deadline,
      urgency_score,
      lat: location.lat || null,
      lng: location.lng || null,
      ward_name: location.ward_name || location.name || wardId,
      block: location.block || null,
      district: location.district || null,
      category: category_final,
      description,
      reportId,
      affected_people,
      ai_summary: aiTriage?.summary || null,
    };

    await col('tasks').doc(taskId).set(taskData);

    res.status(201).json({ 
      message: 'Report submitted successfully.',
      reportId,
      survey: surveyData,
      task: taskData
    });
  } catch (err) {
    console.error('[Citizen Report]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/citizen-reports/track/:phone
 * Track reports by phone number.
 */
router.get('/track/:phone', async (req, res) => {
  const { phone } = req.params;
  try {
    const snap = await col('surveys').where('phone', '==', phone).get();
    const reports = snapToArr(snap).sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/citizen-reports
 * List all citizen reports (for NGOs).
 */
router.get('/', async (req, res) => {
  try {
    const { district } = req.query;
    const snap = await col('surveys').get();
    let reports = snapToArr(snap);
    if (district) {
      reports = reports.filter((r) => r.district === district);
    }
    reports.sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
