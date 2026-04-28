'use strict';

/**
 * db.js — Firebase Admin SDK Firestore client
 * Replaces the previous PostgreSQL pool.
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  let credential;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('📦 Using FIREBASE_SERVICE_ACCOUNT from environment variables');
    try {
      credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    } catch (e) {
      throw new Error('❌ Invalid FIREBASE_SERVICE_ACCOUNT JSON. Make sure you copied the whole JSON correctly.');
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('📄 Using credentials from file path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    credential = admin.credential.applicationDefault();
  } else {
    console.warn('⚠️ No Firebase credentials found. Falling back to applicationDefault (may fail if not in GCP)');
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
