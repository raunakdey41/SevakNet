# SevakNet 🚨

> **From paper to action** — Digitize community surveys, score urgency automatically, visualize needs on a live map, and match the right volunteer to the right task in minutes.

---

## What Problem Does This Solve?

NGOs operating in rural and semi-urban India — particularly in districts like South 24 Parganas, West Bengal — collect community need surveys **on paper**. Field officers walk door to door, record issues (contaminated water, medical emergencies, food shortages), and then manually type everything up back at the office. By the time a task reaches a volunteer, hours or days have passed.

SevakNet eliminates that delay. A field officer photographs a paper survey, the system reads it via OCR, scores the urgency mathematically, pins it on a live map, and surfaces the best-matched volunteers — all within minutes of the survey being collected.

**Without SevakNet:**
- Paper surveys sit in a pile waiting to be typed up
- No way to compare urgency across different areas
- Volunteer matching is done manually via phone calls
- No visibility into what's happening where

**With SevakNet:**
- Photograph a paper form → fields auto-fill via OCR
- Every survey gets an urgency score calculated from affected population, category, and recency
- NGO dashboard shows a live map of all open tasks coloured by urgency tier
- Algorithm ranks volunteers by proximity, skill match, and availability — top 5 shown instantly

---

## Who Is This For?

| User | Role |
|---|---|
| **NGO Field Officer** | Submits surveys (paper scan or manual), views the ops dashboard, assigns volunteers to tasks |
| **Volunteer** | Opens the volunteer view, sees tasks near their location, accepts assignments |

---

## How It Works — End to End

```
Field Officer photographs paper survey
        ↓
Browser runs Tesseract.js OCR (client-side, no upload needed)
        ↓
Extracted fields auto-fill the survey form
        ↓
Officer reviews and submits → POST /api/surveys
        ↓
Backend calculates urgency score using the formula:
  score = (urgency_level × 3)
        + (log10(affected_people + 1) × 2)
        + (recency_factor × 2)        ← fades over 72 hours
        + category_weight             ← medical=3, food/water=2.5 ...
        ↓
Score thresholds: ≥18 🔴 Critical | 12–17 🟠 High | 6–11 🟡 Medium | <6 🟢 Low
        ↓
Task is auto-created and pinned on the live Leaflet map
        ↓
Officer clicks "Find Volunteers" on any task card
        ↓
Matching algorithm scores every active volunteer:
  match = (0.4 × location_score)     ← haversine distance, 10km max
        + (0.4 × skill_score)         ← 1.0 if skill matches, 0.3 if not
        + (0.2 × availability_score)  ← slot overlap
        ↓
Top 5 volunteers (score ≥ 0.5) shown in a modal
        ↓
Officer clicks Assign → volunteer is notified (FCM token stored)
        ↓
Volunteer opens their task feed, sees nearby open tasks, clicks Accept
```

---

## Features

### NGO Dashboard (`/`)
- Full-screen dark map centred on West Bengal (CartoDB dark tiles)
- Coloured circle markers per task — red, orange, yellow, green by urgency tier
- Click any marker for a popup with task title, score, location
- Right sidebar lists all open tasks sorted by urgency score
- Filter by tier (Critical / High / Medium / Low) using the top stat pills
- **Find Volunteers** button on each card opens the match modal
- Sidebar auto-collapses on mobile
- Live polling every 30 seconds

### Survey Form (`/survey`)
- Drag and drop or click to upload a paper survey photograph
- Tesseract.js runs entirely in the browser — no image is sent to any server
- Extraction status shown inline ("Extracting fields…" → "Review below")
- Auto-fills: category, affected people count, description
- Manual override for all fields
- Urgency level slider (1–5) with colour-coded indicator
- On submit: urgency score calculated, task auto-created, success card shown

### Volunteer View (`/volunteer`)
- Uses browser Geolocation API (falls back to South 24 Parganas centroid)
- Radius slider from 2 to 30 km
- Task feed sorted by urgency score — shows distance, skill required, deadline
- One-tap Accept Task button → creates assignment, marks task as assigned

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev server, HMR, ES module builds |
| Styling | TailwindCSS | Utility-first, dark theme, custom palette |
| Maps | Leaflet + react-leaflet | Lightweight, works offline, PostGIS-compatible |
| OCR | Tesseract.js | Runs in the browser — no server cost, no privacy risk |
| Backend | Node.js + Express | Lightweight REST API |
| Database | PostgreSQL + PostGIS | Spatial queries (ST_DWithin, ST_MakePoint) for nearby tasks |
| Auth | Firebase Auth | Phone OTP for volunteer login |
| Notifications | Firebase Cloud Messaging | Push notify volunteers on assignment |
| Deploy | Railway (API) + Vercel (frontend) | Free tier sufficient for NGO scale |

---

## Project Structure

```
sevaknet/
├── backend/
│   ├── server.js              ← Express entry: CORS, routes, health check
│   ├── db.js                  ← PostgreSQL pool (pg)
│   ├── schema.sql             ← All tables + PostGIS + indexes
│   ├── seed.js                ← Demo data: 3 locations, 3 surveys, 2 volunteers
│   ├── package.json
│   ├── .env
│   ├── routes/
│   │   ├── surveys.js         ← POST /api/surveys, POST /api/surveys/ocr
│   │   ├── tasks.js           ← GET dashboard, nearby, matches
│   │   ├── volunteers.js      ← CRUD volunteers
│   │   └── assignments.js     ← Create + update assignments
│   └── services/
│       ├── urgency.js         ← Score formula, label thresholds, title derivation
│       ├── matching.js        ← Haversine + match score + top-N filter
│       └── ocr.js             ← Text → structured field extraction
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    ├── .env
    └── src/
        ├── App.jsx            ← Router + Nav + Toaster
        ├── main.jsx
        ├── index.css          ← Tailwind base + Leaflet dark overrides
        ├── api/
        │   └── client.js      ← Axios instance + all API helpers
        ├── utils/
        │   └── urgency.js     ← Tier colours, labels, icons (shared)
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── SurveyForm.jsx
        │   └── VolunteerView.jsx
        └── components/
            ├── MapView.jsx    ← Leaflet map, dark tiles, circle markers
            ├── TaskCard.jsx   ← Urgency-coloured card with glow
            └── MatchList.jsx  ← Match modal with score bars + assign
```

---

## Setup & Installation

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher with the PostGIS extension available
- npm or yarn

### Step 1 — Database

```bash
# Create the database
createdb sevaknet

# Run the schema (creates all tables + PostGIS extension + indexes)
psql sevaknet -f backend/schema.sql
```

### Step 2 — Backend

```bash
cd backend
npm install
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://localhost:5432/sevaknet
PORT=4000
NODE_ENV=development
JWT_SECRET=replace_with_a_long_random_string
CORS_ORIGIN=http://localhost:5173
```

Load demo data (3 real locations in South 24 Parganas, 3 surveys, 2 volunteers):

```bash
npm run seed
```

Start the API server:

```bash
npm run dev       # development — uses nodemon, auto-restarts on changes
npm start         # production
```

The API will be available at `http://localhost:4000`. Test it:

```bash
curl http://localhost:4000/health
# → {"status":"ok","service":"SevakNet API"}
```

### Step 3 — Frontend

```bash
cd frontend
npm install
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Reference

### Surveys

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/surveys` | Submit a survey. Auto-calculates urgency score, auto-creates a task. |
| `GET` | `/api/surveys` | List all surveys, ordered by urgency score descending. |
| `GET` | `/api/surveys/:id` | Get a single survey with location details. |
| `POST` | `/api/surveys/ocr` | Parse raw OCR text → return extracted fields + confidence score. |

**POST /api/surveys — request body:**
```json
{
  "location_id": "uuid",
  "reported_by": "Officer Name",
  "urgency_level": 4,
  "affected_people": 45,
  "category": "medical",
  "description": "High fever among children, no doctor nearby."
}
```

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks/dashboard` | All open tasks grouped by tier (critical/high/medium/low) + summary counts. |
| `GET` | `/api/tasks/nearby` | `?lat=&lng=&radius=` — PostGIS spatial query, returns tasks with `distance_km`. |
| `GET` | `/api/tasks/:id/matches` | Run volunteer matching → top 5 with match scores. |
| `GET` | `/api/tasks` | List all tasks. Optional `?status=open`. |
| `PATCH` | `/api/tasks/:id` | Update task status, title, skill, deadline. |

### Volunteers

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/volunteers` | Register a volunteer (upserts on phone number). |
| `GET` | `/api/volunteers` | List all active volunteers. |
| `GET` | `/api/volunteers/:id` | Get a single volunteer. |
| `PATCH` | `/api/volunteers/:id` | Update skills, availability, FCM token, active status. |

### Assignments

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/assignments` | Assign a volunteer to a task. Task status → `assigned`. Atomic transaction. |
| `GET` | `/api/assignments` | List assignments. Filter by `?volunteer_id=`, `?task_id=`, `?status=`. |
| `PATCH` | `/api/assignments/:id` | Update status: `accepted`, `in_progress`, `completed`, `rejected`. |

### Locations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/locations` | List all locations (used to populate the survey form dropdown). |
| `POST` | `/api/locations` | Create a location with lat/lng → stored as PostGIS geometry. |

---

## Urgency Score Formula

```
urgency_score = (urgency_level × 3)
              + (log10(affected_people + 1) × 2)
              + (recency_factor × 2)
              + category_weight

where:
  urgency_level    = 1 to 5, set by the field officer
  recency_factor   = max(0, 1 - hours_since_report / 72)
  category_weight  = medical:3 | food:2.5 | water:2.5 | shelter:2 | education:1

Thresholds:
  score ≥ 18  →  🔴 Critical
  score 12–17 →  🟠 High
  score 6–11  →  🟡 Medium
  score < 6   →  🟢 Low
```

Example — water contamination, urgency 5, 120 affected, just reported:

```
= (5 × 3) + (log10(121) × 2) + (1.0 × 2) + 2.5
= 15 + 4.17 + 2 + 2.5
= 23.67  →  🔴 Critical
```

---

## Volunteer Matching Algorithm

```
dist_km         = haversine(volunteer_coords, task_coords)
location_score  = max(0, 1 - dist_km / 10)
skill_score     = 1.0  if volunteer.skills contains task.skill_required
                  0.3  otherwise
availability_score = overlapping_slots / required_slots

match_score = (0.4 × location_score)
            + (0.4 × skill_score)
            + (0.2 × availability_score)

Filter: match_score ≥ 0.5
Return: top 5, sorted by match_score descending
```

This is pure arithmetic — no ML, no external service, runs in milliseconds.

---

## Seed Data (Demo)

The seed script inserts real locations and plausible scenario data for South 24 Parganas:

| Location | Category | Urgency Level | Affected | Score |
|---|---|---|---|---|
| Ward 12, Budge Budge | 💧 Water contamination | 5 | 120 | ~23.7 🔴 Critical |
| Ward 5, Maheshtala | 🏥 Medical emergency | 4 | 45 | ~20.3 🔴 Critical |
| Ward 8, Pujali | 🌾 Food shortage | 3 | 30 | ~16.5 🟠 High |

**Volunteers seeded:**
- **Rakesh Mondal** — skills: first-aid, driving, logistics — available mornings and evenings
- **Sunita Biswas** — skills: teaching, cooking, first-aid — available afternoons and evenings

---

## Deployment

### Backend → Railway

1. Push your code to GitHub
2. Create a new Railway project, connect the repo
3. Add a PostgreSQL plugin — Railway gives you a `DATABASE_URL`
4. Run the schema: `psql $DATABASE_URL -f backend/schema.sql`
5. Set environment variables in Railway dashboard
6. Deploy — Railway auto-detects Node and runs `npm start`

### Frontend → Vercel

1. Connect the `frontend/` folder to a Vercel project
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-railway-app.railway.app/api`
5. Deploy

---

## Environment Variables

### backend/.env

```env
DATABASE_URL=postgresql://localhost:5432/sevaknet
PORT=4000
NODE_ENV=development
JWT_SECRET=replace_with_long_random_string
CORS_ORIGIN=http://localhost:5173
```

### frontend/.env

```env
VITE_API_URL=http://localhost:4000/api
```

---

## Known Limitations

- **OCR accuracy** depends on image quality. Printed forms work well; handwritten forms may need manual correction.
- **Firebase Auth** (phone OTP for volunteers) requires setting up a Firebase project and adding the config to the frontend. The current build stores volunteer ID in `localStorage` for the demo.
- **Notifications** via FCM require the volunteer's browser to grant notification permission and the FCM token to be registered at login.
- **No IoT or hardware** integration — software only.

---

## Contributing

This project was built for NGOs operating in West Bengal, India. If you are working with a community organisation and want to adapt it for your district or language, feel free to fork and open a pull request.

---

## License

MIT — free to use, modify, and distribute.
