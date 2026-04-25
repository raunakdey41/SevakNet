#!/bin/sh
set -e

echo "📐  Applying schema..."
node -e "
require('dotenv').config();
const { pool } = require('./db');
const fs = require('fs');
const sql = fs.readFileSync('./schema.sql', 'utf8');
pool.query(sql)
  .then(() => { console.log('✅  Schema applied.'); return pool.end(); })
  .catch(err => { console.error('Schema error:', err.message); return pool.end().then(() => process.exit(1)); });
"

echo "🌱  Checking if seed is needed..."
node -e "
require('dotenv').config();
const { pool } = require('./db');
pool.query('SELECT COUNT(*) FROM tasks')
  .then(res => {
    const count = parseInt(res.rows[0].count);
    return pool.end().then(() => {
      if (count === 0) {
        console.log('Database empty — seeding...');
        // Run seed as subprocess so it has its own pool
        require('child_process').execSync('node seed.js', { stdio: 'inherit' });
      } else {
        console.log('Database already has data, skipping seed.');
      }
    });
  })
  .catch(err => {
    console.error('Seed check failed:', err.message);
    return pool.end();
  });
"

echo "🚀  Starting SevakNet backend..."
exec node server.js
