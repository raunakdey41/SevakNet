'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const surveysRouter = require('./routes/surveys');
const tasksRouter = require('./routes/tasks');
const volunteersRouter = require('./routes/volunteers');
const assignmentsRouter = require('./routes/assignments');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SevakNet API' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/surveys', surveysRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/volunteers', volunteersRouter);
app.use('/api/assignments', assignmentsRouter);

// ─── Locations helper routes ──────────────────────────────────────────────────
const { query } = require('./db');

app.get('/api/locations', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT *, ST_X(geom) AS lng, ST_Y(geom) AS lat FROM locations ORDER BY ward_name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/locations', async (req, res) => {
  const { ward_name, block, district, state, lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required.' });
  try {
    const { rows } = await query(
      `INSERT INTO locations (ward_name, block, district, state, geom)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($6, $5), 4326))
       RETURNING *, ST_X(geom) AS lng, ST_Y(geom) AS lat`,
      [ward_name, block, district || 'South 24 Parganas', state || 'West Bengal', lat, lng]
    );
    res.status(201).json(rows[0]);
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
app.use((err, req, res, _next) => {
  console.error('[UNHANDLED]', err);
  res.status(500).json({ error: 'Internal server error.', detail: err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚨 SevakNet API running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app;
