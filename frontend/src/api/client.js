import axios from 'axios';

// Use a relative URL so all requests go through Vite's dev server proxy.
// Vite proxies /api/* to the backend service (see vite.config.js).
// This works both locally and inside Docker containers.
const BASE_URL = '/api/';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token if present
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sevaknet_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor — normalise errors
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error || err.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ─── Surveys ──────────────────────────────────────────────────────────────────
export const createSurvey = (data) => client.post('surveys', data).then((r) => r.data);
export const listSurveys  = ()     => client.get('surveys').then((r) => r.data);
export const getSurvey    = (id)   => client.get(`surveys/${id}`).then((r) => r.data);
export const parseOcrText = (raw_text) =>
  client.post('surveys/ocr', { raw_text }).then((r) => r.data);

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const getDashboard  = ()              => client.get('tasks/dashboard').then((r) => r.data);
export const getNearbyTasks = (lat, lng, radius = 10) =>
  client.get('tasks/nearby', { params: { lat, lng, radius } }).then((r) => r.data);
export const getTaskMatches = (taskId)       => client.get(`tasks/${taskId}/matches`).then((r) => r.data);
export const listTasks      = (status)       =>
  client.get('tasks', { params: status ? { status } : {} }).then((r) => r.data);
export const getTask        = (id)           => client.get(`tasks/${id}`).then((r) => r.data);
export const updateTask     = (id, data)     => client.patch(`tasks/${id}`, data).then((r) => r.data);

// ─── Volunteers ───────────────────────────────────────────────────────────────
export const listVolunteers    = ()         => client.get('volunteers').then((r) => r.data);
export const createVolunteer   = (data)     => client.post('volunteers', data).then((r) => r.data);
export const updateVolunteer   = (id, data) => client.patch(`volunteers/${id}`, data).then((r) => r.data);

// ─── Assignments ──────────────────────────────────────────────────────────────
export const createAssignment  = (data)     => client.post('assignments', data).then((r) => r.data);
export const listAssignments   = (params)   => client.get('assignments', { params }).then((r) => r.data);
export const updateAssignment  = (id, data) => client.patch(`assignments/${id}`, data).then((r) => r.data);

// ─── Locations ────────────────────────────────────────────────────────────────
export const listLocations     = ()         => client.get('locations').then((r) => r.data);
export const createLocation    = (data)     => client.post('locations', data).then((r) => r.data);

export default client;
