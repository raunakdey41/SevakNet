'use strict';

const CATEGORY_WEIGHTS = {
  medical: 3,
  food: 2.5,
  water: 2.5,
  shelter: 2,
  education: 1,
};

const URGENCY_THRESHOLDS = {
  CRITICAL: 18,
  HIGH: 12,
  MEDIUM: 6,
};

/**
 * Calculate urgency score for a survey.
 *
 * Formula:
 *   urgency_score = (urgency_level × 3)
 *                 + (log10(affected_people + 1) × 2)
 *                 + (recency_factor × 2)
 *                 + category_weight
 *
 * where recency_factor = max(0, 1 - hours_since_report / 72)
 *
 * @param {Object} params
 * @param {number} params.urgency_level     Integer 1–5
 * @param {number} params.affected_people   Non-negative integer
 * @param {string} params.category          One of medical/food/water/shelter/education
 * @param {Date|string} [params.reported_at] Defaults to now
 * @returns {number} urgency_score rounded to 2 decimal places
 */
function calcUrgencyScore({ urgency_level, affected_people, category, reported_at }) {
  const level = Math.max(1, Math.min(5, Number(urgency_level)));
  const people = Math.max(0, Number(affected_people) || 0);
  const cat = (category || '').toLowerCase();

  const reportedAt = reported_at ? new Date(reported_at) : new Date();
  const hoursSince = (Date.now() - reportedAt.getTime()) / (1000 * 60 * 60);
  const recencyFactor = Math.max(0, 1 - hoursSince / 72);
  const categoryWeight = CATEGORY_WEIGHTS[cat] ?? 1;

  const score =
    level * 3 +
    Math.log10(people + 1) * 2 +
    recencyFactor * 2 +
    categoryWeight;

  return Math.round(score * 100) / 100;
}

/**
 * Returns human-readable urgency label and colour key.
 * @param {number} score
 * @returns {{ label: string, colour: string }}
 */
function getUrgencyLabel(score) {
  if (score >= URGENCY_THRESHOLDS.CRITICAL) return { label: 'Critical', colour: 'red' };
  if (score >= URGENCY_THRESHOLDS.HIGH) return { label: 'High', colour: 'orange' };
  if (score >= URGENCY_THRESHOLDS.MEDIUM) return { label: 'Medium', colour: 'yellow' };
  return { label: 'Low', colour: 'green' };
}

/**
 * Derive a sensible task title from a survey.
 * @param {Object} survey
 * @returns {string}
 */
function deriveTitleFromSurvey({ category, urgency_level, affected_people, ai_suggested_title }) {
  if (ai_suggested_title) return ai_suggested_title;
  const cat = (category || 'general').charAt(0).toUpperCase() + (category || 'general').slice(1);
  const lvl = urgency_level >= 4 ? 'Urgent ' : '';
  return `${lvl}${cat} Aid — ${affected_people} affected`;
}

/**
 * Maps category to a representative skill.
 */
const CATEGORY_TO_SKILL = {
  medical: 'first-aid',
  food: 'cooking',
  water: 'logistics',
  shelter: 'construction',
  education: 'teaching',
};

function skillForCategory(category) {
  return CATEGORY_TO_SKILL[(category || '').toLowerCase()] ?? 'general';
}

module.exports = {
  calcUrgencyScore,
  getUrgencyLabel,
  deriveTitleFromSurvey,
  skillForCategory,
  CATEGORY_WEIGHTS,
  URGENCY_THRESHOLDS,
};
