'use strict';

const EARTH_RADIUS_KM = 6371;
const MAX_DISTANCE_KM = 10;
const MIN_MATCH_SCORE = 0.5;
const TOP_N = 5;

/**
 * Haversine distance between two lat/lng points.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in km
 */
function haversine(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate the match score between a volunteer and a task.
 *
 * match_score = (0.4 × location_score)
 *             + (0.4 × skill_score)
 *             + (0.2 × availability_score)
 *
 * @param {Object} volunteer  DB row with geom parsed as { lat, lng }, skills[], availability[]
 * @param {Object} task       DB row with lat, lng, skill_required, required_slots (optional)
 * @returns {number} match_score in [0, 1]
 */
function calcMatchScore(volunteer, task) {
  // --- Location score ---
  const vLat = volunteer.lat ?? volunteer.geom_lat;
  const vLng = volunteer.lng ?? volunteer.geom_lng;
  const tLat = task.lat ?? task.geom_lat;
  const tLng = task.lng ?? task.geom_lng;

  let locationScore = 0;
  if (vLat != null && vLng != null && tLat != null && tLng != null) {
    const distKm = haversine(vLat, vLng, tLat, tLng);
    locationScore = Math.max(0, 1 - distKm / MAX_DISTANCE_KM);
  }

  // --- Skill score ---
  const volunteerSkills = (volunteer.skills || []).map((s) => s.toLowerCase().trim());
  const requiredSkill = (task.skill_required || '').toLowerCase().trim();
  const skillScore = volunteerSkills.includes(requiredSkill) ? 1 : 0.3;

  // --- Availability score ---
  const volunteerAvail = (volunteer.availability || []).map((s) => s.toLowerCase().trim());
  const requiredSlots = (task.required_slots || ['any']).map((s) => s.toLowerCase().trim());
  let availabilityScore = 0;
  if (requiredSlots.includes('any') || requiredSlots.length === 0) {
    availabilityScore = volunteerAvail.length > 0 ? 1 : 0.5;
  } else {
    const overlap = requiredSlots.filter((s) => volunteerAvail.includes(s)).length;
    availabilityScore = overlap / requiredSlots.length;
  }

  const matchScore =
    0.4 * locationScore + 0.4 * skillScore + 0.2 * availabilityScore;

  return Math.round(matchScore * 1000) / 1000;
}

/**
 * Given a task and a list of volunteers (with lat/lng injected), return the
 * top-N matches sorted by match_score descending, filtered to ≥ MIN_MATCH_SCORE.
 *
 * @param {Object} task
 * @param {Array}  volunteers
 * @returns {Array} sorted volunteer match objects
 */
function getTopMatches(task, volunteers) {
  const scored = volunteers
    .filter((v) => v.is_active)
    .map((v) => ({
      ...v,
      match_score: calcMatchScore(v, task),
    }))
    .filter((v) => v.match_score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, TOP_N);

  return scored;
}

module.exports = {
  haversine,
  calcMatchScore,
  getTopMatches,
  MAX_DISTANCE_KM,
  MIN_MATCH_SCORE,
};
