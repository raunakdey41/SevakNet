'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { col, snapToArr, docToObj } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { sendTaskAssignedSMS, sendTaskCompletedSMS, sendTaskReopenedSMS } = require('../services/sms');
const { uploadCompletionPhoto } = require('../services/storage');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are accepted.'));
  },
});

// ─── Helper ───────────────────────────────────────────────────────────────────
async function enrichAssignment(a) {
  const [volDoc, taskDoc] = await Promise.all([
    col('volunteers').doc(a.volunteer_id).get(),
    col('tasks').doc(a.task_id).get(),
  ]);
  const vol  = volDoc.exists  ? volDoc.data()  : {};
  const task = taskDoc.exists ? taskDoc.data() : {};
  return {
    ...a,
    volunteer_name: vol.name           || null,
    phone:          vol.phone          || null,
    skills:         vol.skills         || [],
    task_title:     task.title         || null,
    category:       task.category      || null,
    urgency_score:  task.urgency_score || null,
    skill_required: task.skill_required || null,
    ward_name:      task.ward_name     || null,
    block:          task.block         || null,
    district:       task.district      || null,
    deadline:       task.deadline      || null,
  };
}

// ─── POST /api/assignments ────────────────────────────────────────────────────
/**
 * Assign a volunteer to a task.
 * Sends an SMS notification to the volunteer immediately.
 */
router.post('/', async (req, res) => {
  const { task_id, volunteer_id, match_score } = req.body;
  if (!task_id || !volunteer_id) {
    return res.status(400).json({ error: 'task_id and volunteer_id are required.' });
  }

  try {
    // Validate task
    const taskDoc = await col('tasks').doc(task_id).get();
    if (!taskDoc.exists) return res.status(404).json({ error: 'Task not found.' });
    const task = taskDoc.data();
    if (task.status !== 'open') {
      return res.status(409).json({ error: `Task is already ${task.status}.` });
    }

    // Validate volunteer — treat missing is_active as true (default active)
    const volDoc = await col('volunteers').doc(volunteer_id).get();
    if (!volDoc.exists) {
      return res.status(404).json({ error: 'Volunteer not found.' });
    }
    const vol = volDoc.data();
    if (vol.is_active === false) {
      return res.status(400).json({ error: 'Volunteer is not active.' });
    }

    // Create assignment — status 'pending' until volunteer accepts on their end
    const assignmentId = uuidv4();
    const assignment = {
      id:           assignmentId,
      task_id,
      volunteer_id,
      match_score:  match_score || null,
      status:       'pending',
      assigned_at:  new Date().toISOString(),
      completed_at: null,
      proof_url:    null,
      sms_sent:     false,
    };
    await col('assignments').doc(assignmentId).set(assignment);

    // Task moves to 'assigned'
    await col('tasks').doc(task_id).update({ status: 'assigned' });

    // Send SMS — fire and forget
    sendTaskAssignedSMS({
      phone:        vol.phone,
      volunteerName: vol.name,
      taskTitle:    task.title,
      category:     task.category,
      district:     task.district,
      block:        task.block,
      urgencyScore: task.urgency_score,
      deadline:     task.deadline,
      lat:          task.lat,
      lng:          task.lng,
    }).then((res) => {
      if (res && res.sid) {
        col('assignments').doc(assignmentId).update({ sms_sent: true });
      }
    }).catch(err => {
      console.error(`[Assignment SMS Error] ${err.message}`);
    });

    const enriched = await enrichAssignment(assignment);
    res.status(201).json(enriched);
  } catch (err) {
    console.error('[POST /assignments]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/assignments/mine
 * Fetch assignments for the logged-in volunteer.
 * Expects volunteerId in query for now (later can use JWT).
 */
router.get('/mine', async (req, res) => {
  // Use user id from JWT if present, otherwise fall back to query param
  const volunteerId = req.user?.id || req.query.volunteerId;
  
  if (!volunteerId) {
    return res.status(400).json({ error: 'volunteerId is required (via token or query)' });
  }

  try {
    const snap = await col('assignments').where('volunteer_id', '==', volunteerId).get();
    const assignments = snapToArr(snap);
    const enriched = await Promise.all(assignments.map(enrichAssignment));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/assignments ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { volunteer_id, task_id, status } = req.query;

    // Fetch all, filter in memory (avoids composite index requirement)
    const snap = await col('assignments').get();
    let assignments = snapToArr(snap);

    if (volunteer_id) assignments = assignments.filter((a) => a.volunteer_id === volunteer_id);
    if (task_id)      assignments = assignments.filter((a) => a.task_id === task_id);
    if (status)       assignments = assignments.filter((a) => a.status === status);

    assignments.sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));

    const enriched = await Promise.all(assignments.map(enrichAssignment));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/assignments/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doc = await col('assignments').doc(req.params.id).get();
    const assignment = docToObj(doc);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
    const enriched = await enrichAssignment(assignment);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/assignments/:id ───────────────────────────────────────────────
/**
 * Update assignment status: pending → accepted → in-progress → rejected
 * Completion requires photo — use POST /:id/complete instead.
 */
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'accepted', 'in-progress', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Use POST /assignments/:id/complete to complete. Otherwise status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const ref = col('assignments').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Assignment not found.' });

    const data = doc.data();
    await ref.update({ status });

    // Handle task status side-effects
    if (status === 'accepted' || status === 'in-progress') {
      await col('tasks').doc(data.task_id).update({ status });
    } else if (status === 'rejected') {
      await col('tasks').doc(data.task_id).update({ status: 'open' });
      // Notify volunteer or handle rejection
      // (Optional: notify NGO that volunteer rejected)
    }

    const enriched = await enrichAssignment({ id: doc.id, ...data, status });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/assignments/:id/complete ───────────────────────────────────────
/**
 * Mark an assignment as completed.
 * Requires a photo (multipart/form-data field: "proof") as evidence.
 * Uploads to Firebase Storage, stores URL in Firestore, sends completion SMS.
 */
router.post('/:id/complete', upload.single('proof'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'A proof photo is required to mark a task as complete. Upload an image as form field "proof".',
    });
  }

  try {
    const ref = col('assignments').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Assignment not found.' });

    const data = doc.data();
    if (data.status === 'completed') {
      return res.status(409).json({ error: 'Assignment is already completed.' });
    }

    // Upload photo to Firebase Storage
    const proofUrl = await uploadCompletionPhoto(
      req.params.id,
      req.file.buffer,
      req.file.mimetype,
    );

    const completedAt = new Date().toISOString();

    // Update assignment
    await ref.update({
      status:       'completed',
      completed_at: completedAt,
      proof_url:    proofUrl,
    });

    // Update task to completed
    await col('tasks').doc(data.task_id).update({
      status:       'completed',
      completed_at: completedAt,
      proof_url:    proofUrl,
    });

    // Send completion SMS & Push
    const [volDoc, taskDoc] = await Promise.all([
      col('volunteers').doc(data.volunteer_id).get(),
      col('tasks').doc(data.task_id).get(),
    ]);
    if (volDoc.exists && taskDoc.exists) {
      const vol = volDoc.data();
      const task = taskDoc.data();

      sendTaskCompletedSMS({
        phone:         vol.phone,
        volunteerName: vol.name,
        taskTitle:     task.title,
        district:      task.district,
      });
    }

    res.json({
      id:           doc.id,
      ...data,
      status:       'completed',
      completed_at: completedAt,
      proof_url:    proofUrl,
    });
  } catch (err) {
    console.error('[POST /assignments/:id/complete]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
