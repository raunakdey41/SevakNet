'use strict';

/**
 * services/sms.js
 * Twilio-powered SMS notifications for SevakNet.
 */

function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length === 11) return `+91${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

async function sendSMS(to, body) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  const isConfigured = sid && token && from
    && !sid.startsWith('ACxxx')
    && !sid.includes('xxx')
    && !token.includes('xxx')
    && !from.includes('xxx');

  if (!isConfigured) {
    console.warn(`[SMS — dev mode] Twilio not configured.`);
    console.log(`[SMS — dev mode] Would send to: ${to}\n${body}\n`);
    return { sid: 'dev-mode', status: 'simulated' };
  }

  const twilio = require('twilio')(sid, token);
  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    console.error(`[SMS] Invalid phone number: ${to}`);
    return;
  }

  const result = await twilio.messages.create({ body, from, to: normalizedTo });
  console.log(`[SMS] Handed off to Twilio: ${normalizedTo} — SID: ${result.sid}`);
  return result;
}

async function sendTaskAssignedSMS({ phone, volunteerName, taskTitle, category, district, block, urgencyScore, deadline, lat, lng }) {
  const mapLink = (lat && lng) ? `\nMap: https://www.google.com/maps?q=${lat},${lng}` : '';
  const body = `SevakNet: Task "${taskTitle}" assigned in ${block}. Please check your dashboard.${mapLink}`;
  try {
    return await sendSMS(phone, body);
  } catch (err) {
    console.error(`[SMS] Failed to send to ${phone}:`, err.message);
    throw err;
  }
}

async function sendTaskCompletedSMS({ phone, volunteerName, taskTitle, district }) {
  const body = `SevakNet: Your task "${taskTitle}" is verified. Thank you!`;
  try {
    return await sendSMS(phone, body);
  } catch (err) {
    console.error(`[SMS] Failed to send to ${phone}:`, err.message);
    throw err;
  }
}

async function sendTaskReopenedSMS({ phone, volunteerName, taskTitle }) {
  const body = `SevakNet: Assignment update. Task "${taskTitle}" has been re-opened. Please check your dashboard.`;
  try {
    await sendSMS(phone, body);
  } catch (err) {
    console.error(`[SMS] Failed to send reopen notice to ${phone}:`, err.message);
  }
}

module.exports = { sendTaskAssignedSMS, sendTaskCompletedSMS, sendTaskReopenedSMS };
