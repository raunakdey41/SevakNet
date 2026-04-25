'use strict';

/**
 * Server-side OCR service.
 * Tesseract.js runs CLIENT-SIDE in the browser for the demo.
 * This module handles text parsing / field extraction from already-extracted text
 * if the frontend sends raw OCR text to the backend for parsing.
 */

const CATEGORY_KEYWORDS = {
  medical: ['medical', 'health', 'hospital', 'doctor', 'medicine', 'sick', 'injury', 'disease'],
  food: ['food', 'hunger', 'ration', 'grain', 'meal', 'eating', 'starvation'],
  water: ['water', 'flood', 'drinking', 'supply', 'contamination', 'sanitation'],
  shelter: ['shelter', 'house', 'home', 'roof', 'displaced', 'homeless', 'repair'],
  education: ['school', 'education', 'student', 'learning', 'teacher', 'class'],
};

/**
 * Extract structured fields from raw OCR text.
 *
 * @param {string} rawText  OCR-extracted plain text
 * @returns {Object} { ward, affected_count, category, confidence }
 */
function extractFieldsFromText(rawText) {
  const text = (rawText || '').toLowerCase();
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // --- Ward extraction ---
  let ward = null;
  const wardMatch = rawText.match(/ward\s*[:#-]?\s*(\w[\w\s]*)/i);
  if (wardMatch) ward = wardMatch[1].trim();

  // --- Affected people count ---
  let affected_count = null;
  const countPatterns = [
    /(\d+)\s*(?:people|persons?|families|households|affected)/i,
    /affected[:\s]+(\d+)/i,
    /population[:\s]+(\d+)/i,
    /(\d{1,5})\s+(?:need|needs|requiring)/i,
  ];
  for (const pattern of countPatterns) {
    const m = rawText.match(pattern);
    if (m) { affected_count = parseInt(m[1], 10); break; }
  }
  // Fallback: first standalone 2–5 digit number
  if (affected_count == null) {
    const fallback = rawText.match(/\b(\d{2,5})\b/);
    if (fallback) affected_count = parseInt(fallback[1], 10);
  }

  // --- Category detection ---
  let category = null;
  let maxHits = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = keywords.filter((kw) => text.includes(kw)).length;
    if (hits > maxHits) { maxHits = hits; category = cat; }
  }

  // --- Confidence score (heuristic) ---
  let confidence = 0;
  if (ward) confidence += 0.35;
  if (affected_count != null) confidence += 0.35;
  if (category) confidence += 0.30;

  return {
    ward: ward || null,
    affected_count: affected_count || null,
    category: category || null,
    confidence: Math.round(confidence * 100) / 100,
    raw_text: rawText,
  };
}

/**
 * Validate and sanitise extracted fields.
 * @param {Object} fields
 * @returns {Object}
 */
function sanitiseExtracted(fields) {
  return {
    ward: fields.ward ? String(fields.ward).slice(0, 100) : null,
    affected_count: fields.affected_count != null
      ? Math.max(1, Math.min(100000, Number(fields.affected_count)))
      : null,
    category: ['medical','food','water','shelter','education'].includes(fields.category)
      ? fields.category
      : null,
    confidence: fields.confidence ?? 0,
  };
}

module.exports = { extractFieldsFromText, sanitiseExtracted };
