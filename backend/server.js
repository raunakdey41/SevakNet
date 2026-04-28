'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const surveysRouter     = require('./routes/surveys');
const tasksRouter       = require('./routes/tasks');
const volunteersRouter  = require('./routes/volunteers');
const assignmentsRouter = require('./routes/assignments');
const authRouter        = require('./routes/auth');
const citizenRouter     = require('./routes/citizen-reports');

// Eagerly initialise Firebase so we catch credential errors at startup
require('./db');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const { optionalAuth } = require('./middleware/auth');
app.use(optionalAuth);

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SevakNet API', db: 'firestore' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/surveys',     surveysRouter);
app.use('/api/tasks',       tasksRouter);
app.use('/api/volunteers',  volunteersRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/auth',        authRouter);
app.use('/api/citizen-reports', citizenRouter);

// ─── Locations (Firestore-backed) ─────────────────────────────────────────────
const { col, snapToArr } = require('./db');
const { v4: uuidv4 }     = require('uuid');

app.get('/api/locations', async (_req, res) => {
  try {
    const snap = await col('locations').orderBy('district').get();
    const locs = snapToArr(snap).map(l => ({
      ...l,
      // Compute a human-readable 'name' for the frontend dropdown
      name: l.name || [l.ward_name, l.block, l.district].filter(Boolean).join(' – '),
    }));
    res.json(locs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/locations', async (req, res) => {
  const { ward_name, block, district, state, lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required.' });
  try {
    const id = uuidv4();
    const location = {
      id,
      ward_name: ward_name || null,
      block: block || null,
      district: district || 'West Bengal',
      state: state || 'West Bengal',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      name: [ward_name, block, district].filter(Boolean).join(' – '),
    };
    await col('locations').doc(id).set(location);
    res.status(201).json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED]', err);
  res.status(500).json({ error: 'Internal server error.', detail: err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SevakNet API running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database    : Firebase Firestore (${process.env.FIREBASE_PROJECT_ID || 'sevaknet-wb'})`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app;
