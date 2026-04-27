'use strict';

/**
 * db.js — Firebase Admin SDK Firestore client
 * Replaces the previous PostgreSQL pool.
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  // Uses GOOGLE_APPLICATION_CREDENTIALS env var automatically, or
  // falls back to Application Default Credentials (ADC) in Cloud environments.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'sevaknet-wb',
  });
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
