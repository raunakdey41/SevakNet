'use strict';

/**
 * db.js — Firebase Admin SDK Firestore client
 * Replaces the previous PostgreSQL pool.
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  let credential;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Railway/Cloud: Parse JSON from env var
    credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  } else {
    // Local: Use Application Default or env var path
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || 'sevaknet-wb',
  });
  console.log('✅ Firebase Admin initialized');
}

const db = admin.firestore();

// ─── Helpers that mirror the old PostgreSQL interface ──────────────────────────

/**
 * Get a Firestore collection reference.
 * @param {string} name
 */
const col = (name) => db.collection(name);

/**
 * Convert a Firestore DocumentSnapshot to a plain object with `id`.
 * @param {FirebaseFirestore.DocumentSnapshot} doc
 */
const docToObj = (doc) => (doc.exists ? { id: doc.id, ...doc.data() } : null);

/**
 * Convert a Firestore QuerySnapshot to an array of plain objects with `id`.
 * @param {FirebaseFirestore.QuerySnapshot} snap
 */
const snapToArr = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

module.exports = { db, col, docToObj, snapToArr, admin };
