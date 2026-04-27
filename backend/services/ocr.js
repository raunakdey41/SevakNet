'use strict';

/**
 * services/ocr.js
 * Uses Google Gemini API to extract structured fields from raw OCR text.
 * Replaces the previous regex-based extractor.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const VALID_CATEGORIES = ['medical', 'food', 'water', 'shelter', 'education'];

/**
 * Send raw OCR text to Gemini and extract structured survey fields.
 * Returns an object with: category, affected_people, urgency_level, ward_name, description.
 *
 * @param {string} rawText
 * @returns {Promise<Object>}
 */
async function extractFieldsFromText(rawText) {
  if (!rawText || rawText.trim().length < 5) {
    return { category: null, affected_people: null, urgency_level: null, ward_name: null, description: null, confidence: 'low' };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a field data extractor for a West Bengal community aid platform.
Given the following raw OCR text from a paper survey form, extract structured fields and return ONLY valid JSON.

Raw OCR text:
"""
${rawText}
"""

Return JSON with these exact keys:
{
  "category": "<one of: medical, food, water, shelter, education, or null>",
  "affected_people": <integer or null>,
  "urgency_level": <integer 1-5 or null>,
  "ward_name": "<string or null>",
  "block": "<string or null>",
  "district": "<string or null>",
  "description": "<cleaned summary of the situation in 1-2 sentences or null>",
  "confidence": "<low|medium|high>"
}

Rules:
- Only use "category" values from the allowed list
- "urgency_level" 5 = critical, 1 = very low. Infer from language if not stated.
- Return null for any field you cannot determine from the text
- Return ONLY the raw JSON object, no markdown fences`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code fences if Gemini wraps in them
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Sanitise
    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = null;
    if (parsed.affected_people != null) parsed.affected_people = Math.max(0, parseInt(parsed.affected_people, 10) || 0);
    if (parsed.urgency_level != null) parsed.urgency_level = Math.min(5, Math.max(1, parseInt(parsed.urgency_level, 10) || 3));

    return parsed;
  } catch {
    return { category: null, affected_people: null, urgency_level: null, ward_name: null, description: rawText.slice(0, 300), confidence: 'low' };
  }
}

/**
 * Alias for backward-compat with route that calls sanitiseExtracted.
 */
function sanitiseExtracted(extracted) {
  return extracted;
}

module.exports = { extractFieldsFromText, sanitiseExtracted };
