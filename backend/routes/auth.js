'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { col, snapToArr, docToObj } = require('../db');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'sevaknet-super-secret-key-2024';

// ─── Twilio Verify helpers ─────────────────────────────────────────────────────
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length === 11) return `+91${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

function isTwilioConfigured() {
  const sid     = process.env.TWILIO_ACCOUNT_SID;
  const token   = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SID;
  return (
    sid && token && verifySid &&
    !sid.includes('xxx') &&
    !token.includes('xxx') &&
    !verifySid.includes('xxx')
  );
}

function getTwilioVerify() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SID;
  return { client: require('twilio')(sid, token), verifySid };
}

/**
 * POST /api/auth/send-otp
 * Sends a 6-digit OTP to the volunteer's phone via Twilio Verify.
 * In dev mode (Twilio not configured): accepts "000000" as the OTP.
 */
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone is required.' });

  const normalized = normalizePhone(phone);
  if (!normalized) return res.status(400).json({ error: 'Invalid phone number.' });

  if (!isTwilioConfigured()) {
    console.warn(`[OTP — dev mode] Would send OTP to ${normalized}. Twilio Verify not configured.\nAdd TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID to backend/.env.\nIn dev mode, use "000000" as the OTP to proceed.`);
    return res.json({ success: true, devMode: true, message: `OTP simulated. Use "000000" to verify.` });
  }

  try {
    const { client, verifySid } = getTwilioVerify();
    await client.verify.v2.services(verifySid).verifications.create({
      to: normalized,
      channel: 'sms',
    });
    console.log(`[OTP] Sent verification to ${normalized}`);
    res.json({ success: true, devMode: false });
  } catch (err) {
    console.error('[OTP] Send failed:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. ' + err.message });
  }
});

/**
 * POST /api/auth/verify-otp
 * Checks the OTP entered by the volunteer against Twilio Verify.
 * In dev mode: "000000" always passes.
 */
router.post('/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'phone and code are required.' });

  const normalized = normalizePhone(phone);

  if (!isTwilioConfigured()) {
    // Dev mode — accept "000000" as the magic OTP
    if (String(code).trim() === '000000') {
      return res.json({ success: true, verified: true, devMode: true });
    }
    return res.status(400).json({ error: 'Invalid OTP. In dev mode, use "000000".' });
  }

  try {
    const { client, verifySid } = getTwilioVerify();
    const check = await client.verify.v2.services(verifySid).verificationChecks.create({
      to: normalized,
      code: String(code).trim(),
    });
    if (check.status === 'approved') {
      console.log(`[OTP] ${normalized} verified successfully.`);
      return res.json({ success: true, verified: true });
    }
    res.status(400).json({ error: 'Invalid or expired OTP. Please try again.' });
  } catch (err) {
    console.error('[OTP] Verify failed:', err.message);
    res.status(500).json({ error: 'Verification failed. ' + err.message });
  }
});

/**
 * POST /api/auth/ngo/register
 */
router.post('/ngo/register', async (req, res) => {
  const { ngoName, email, password, district, phone } = req.body;

  if (!ngoName || !email || !password) {
    return res.status(400).json({ error: 'NGO name, email, and password are required.' });
  }

  try {
    const existing = await col('ngos').where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'An NGO with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const id = uuidv4();
    const ngoData = {
      id,
      name: ngoName,
      email,
      password_hash,
      district: district || 'South 24 Parganas',
      phone: phone || '',
      created_at: new Date().toISOString(),
    };

    await col('ngos').doc(id).set(ngoData);

    const token = jwt.sign({ id, email, type: 'ngo' }, JWT_SECRET, { expiresIn: '7d' });
    
    // Don't send back the hash
    delete ngoData.password_hash;
    res.status(201).json({ user: ngoData, token });
  } catch (err) {
    console.error('[NGO Register]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/ngo/login
 */
router.post('/ngo/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const snap = await col('ngos').where('email', '==', email).limit(1).get();
    if (snap.empty) return res.status(401).json({ error: 'Invalid email or password.' });

    const ngo = snap.docs[0].data();
    const isMatch = await bcrypt.compare(password, ngo.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: ngo.id, email: ngo.email, type: 'ngo' }, JWT_SECRET, { expiresIn: '7d' });
    
    delete ngo.password_hash;
    res.json({ user: ngo, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/volunteer/register
 */
router.post('/volunteer/register', async (req, res) => {
  const { name, phone, email, password, skills, availability, wardId } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'Name, phone, and password are required.' });
  }

  try {
    const existing = await col('volunteers').where('phone', '==', phone).limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'A volunteer with this phone number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const id = uuidv4();
    const volunteerData = {
      id,
      name,
      phone,
      email: email || '',
      password_hash,
      skills: skills || [],
      availability: availability || [],
      location_id: wardId || null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    await col('volunteers').doc(id).set(volunteerData);

    const token = jwt.sign({ id, phone, type: 'volunteer' }, JWT_SECRET, { expiresIn: '7d' });
    
    delete volunteerData.password_hash;
    res.status(201).json({ user: volunteerData, token });
  } catch (err) {
    console.error('[Volunteer Register]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/volunteer/login
 */
router.post('/volunteer/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const snap = await col('volunteers').where('phone', '==', phone).limit(1).get();
    if (snap.empty) return res.status(401).json({ error: 'Invalid phone or password.' });

    const vol = snap.docs[0].data();
    const isMatch = await bcrypt.compare(password, vol.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid phone or password.' });

    const token = jwt.sign({ id: vol.id, phone: vol.phone, type: 'volunteer' }, JWT_SECRET, { expiresIn: '7d' });
    
    delete vol.password_hash;
    res.json({ user: vol, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
