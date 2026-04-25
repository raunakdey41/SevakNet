'use strict';

require('dotenv').config();
const { query, pool } = require('./db');
const { calcUrgencyScore, deriveTitleFromSurvey, skillForCategory } = require('./services/urgency');

async function seed() {
  console.log('\n🌱  Seeding SevakNet database...\n');

  // ─── Locations ──────────────────────────────────────────────────────────────
  const locations = [
    { ward_name: 'Ward 12', block: 'Budge Budge', lat: 22.4734, lng: 88.1789 },
    { ward_name: 'Ward 5',  block: 'Maheshtala',  lat: 22.5102, lng: 88.2394 },
    { ward_name: 'Ward 8',  block: 'Pujali',      lat: 22.4495, lng: 88.1573 },
  ];

  const locIds = [];
  for (const loc of locations) {
    const { rows } = await query(
      `INSERT INTO locations (ward_name, block, district, state, geom)
       VALUES ($1, $2, 'South 24 Parganas', 'West Bengal',
               ST_SetSRID(ST_MakePoint($4, $3), 4326))
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [loc.ward_name, loc.block, loc.lat, loc.lng]
    );
    if (rows.length) {
      locIds.push({ id: rows[0].id, ...loc });
      console.log(`  ✔ Location: ${loc.ward_name} ${loc.block} → ${rows[0].id}`);
    } else {
      // Already exists, fetch id
      const existing = await query(
        `SELECT id FROM locations WHERE ward_name = $1 AND block = $2`,
        [loc.ward_name, loc.block]
      );
      locIds.push({ id: existing.rows[0].id, ...loc });
    }
  }

  // ─── Surveys + Tasks ────────────────────────────────────────────────────────
  const surveys = [
    {
      location: locIds[0],
      reported_by: 'Officer Debashis Roy',
      urgency_level: 5,
      affected_people: 120,
      category: 'water',
      description: 'Severe contamination of drinking water supply. Open drainage mixing with tube-well water. Diarrhoea outbreak reported.',
    },
    {
      location: locIds[1],
      reported_by: 'Officer Priya Chakraborty',
      urgency_level: 4,
      affected_people: 45,
      category: 'medical',
      description: 'High fever and respiratory illness among children under 12. No local doctor. Nearest PHC 8 km away.',
    },
    {
      location: locIds[2],
      reported_by: 'Officer Anupam Das',
      urgency_level: 3,
      affected_people: 30,
      category: 'food',
      description: 'Migrant families without ration cards. No food supplies for 4 days. Children present.',
    },
  ];

  for (const s of surveys) {
    const urgency_score = calcUrgencyScore({
      urgency_level: s.urgency_level,
      affected_people: s.affected_people,
      category: s.category,
      reported_at: new Date(),
    });

    const { rows: sRows } = await query(
      `INSERT INTO surveys (location_id, reported_by, urgency_level, affected_people, category, description, urgency_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [s.location.id, s.reported_by, s.urgency_level, s.affected_people, s.category, s.description, urgency_score]
    );
    const survey = sRows[0];
    console.log(`  ✔ Survey [${s.category}] urgency_score=${urgency_score} → ${survey.id}`);

    const title = deriveTitleFromSurvey(survey);
    const skill = skillForCategory(s.category);
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const { rows: tRows } = await query(
      `INSERT INTO tasks (survey_id, location_id, title, skill_required, status, deadline, urgency_score)
       VALUES ($1, $2, $3, $4, 'open', $5, $6) RETURNING *`,
      [survey.id, s.location.id, title, skill, deadline, urgency_score]
    );
    console.log(`  ✔ Task "${title}" → ${tRows[0].id}`);
  }

  // ─── Volunteers ─────────────────────────────────────────────────────────────
  const volunteers = [
    {
      name: 'Rakesh Mondal',
      phone: '+919800000001',
      skills: ['first-aid', 'driving', 'logistics'],
      availability: ['morning', 'evening'],
      lat: 22.471,
      lng: 88.175,
      location: locIds[0],
    },
    {
      name: 'Sunita Biswas',
      phone: '+919800000002',
      skills: ['teaching', 'cooking', 'first-aid'],
      availability: ['afternoon', 'evening'],
      lat: 22.508,
      lng: 88.237,
      location: locIds[1],
    },
  ];

  for (const v of volunteers) {
    const { rows } = await query(
      `INSERT INTO volunteers (name, phone, skills, availability, geom, location_id, is_active)
       VALUES ($1, $2, $3, $4,
               ST_SetSRID(ST_MakePoint($6, $5), 4326),
               $7, TRUE)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
      [v.name, v.phone, v.skills, v.availability, v.lat, v.lng, v.location.id]
    );
    console.log(`  ✔ Volunteer ${v.name} [${v.skills.join(', ')}] → ${rows[0].id}`);
  }

  console.log('\n✅  Seed complete.\n');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
