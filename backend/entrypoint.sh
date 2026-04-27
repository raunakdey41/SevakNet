#!/bin/sh
set -e

echo "🌱  Checking if Firestore seed is needed..."
node -e "
require('dotenv').config();
const { col } = require('./db');
col('tasks').limit(1).get()
  .then(snap => {
    if (snap.empty) {
      console.log('Firestore empty — running seed...');
      require('child_process').execSync('node seed.js', { stdio: 'inherit' });
    } else {
      console.log('Firestore already has data, skipping seed.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Seed check failed:', err.message);
    process.exit(1);
  });
"

echo "🚀  Starting SevakNet backend..."
exec node server.js
