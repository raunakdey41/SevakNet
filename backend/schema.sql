CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_name TEXT,
  block TEXT,
  district TEXT DEFAULT 'South 24 Parganas',
  state TEXT DEFAULT 'West Bengal',
  geom GEOMETRY(Point, 4326)
);

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  reported_by TEXT,
  urgency_level INT CHECK (urgency_level BETWEEN 1 AND 5),
  affected_people INT,
  category TEXT CHECK (category IN ('medical','food','water','shelter','education')),
  description TEXT,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  urgency_score FLOAT
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id),
  location_id UUID REFERENCES locations(id),
  title TEXT,
  skill_required TEXT,
  status TEXT DEFAULT 'open',
  deadline TIMESTAMPTZ,
  urgency_score FLOAT
);

CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  name TEXT,
  phone TEXT UNIQUE,
  skills TEXT[],
  availability TEXT[],
  geom GEOMETRY(Point, 4326),
  is_active BOOL DEFAULT TRUE,
  fcm_token TEXT
);

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  volunteer_id UUID REFERENCES volunteers(id),
  match_score FLOAT,
  status TEXT DEFAULT 'pending',
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast geo queries
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_volunteers_geom ON volunteers USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_tasks_urgency ON tasks(urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_surveys_reported_at ON surveys(reported_at DESC);
