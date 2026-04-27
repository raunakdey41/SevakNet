import axios from 'axios';

// Use a relative URL so all requests go through Vite's dev server proxy.
// Vite proxies /api/* to the backend service (see vite.config.js).
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

export default client;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const ngoLogin            = (data) => client.post('auth/ngo/login', data);
export const ngoRegister         = (data) => client.post('auth/ngo/register', data);
export const volunteerLogin      = (data) => client.post('auth/volunteer/login', data);
export const volunteerRegister   = (data) => client.post('auth/volunteer/register', data);

// ─── Phone OTP (Twilio Verify) ────────────────────────────────────────────────
export const sendOtp    = (phone) => client.post('auth/send-otp', { phone });
export const verifyOtp  = (phone, code) => client.post('auth/verify-otp', { phone, code });

// ─── Surveys ──────────────────────────────────────────────────────────────────
export const createSurvey   = (data)       => client.post('surveys', data).then((r) => r.data);
export const listSurveys    = ()           => client.get('surveys').then((r) => r.data);
export const getSurvey      = (id)         => client.get(`surveys/${id}`).then((r) => r.data);
export const updateSurvey   = (id, data)   => client.patch(`surveys/${id}`, data).then((r) => r.data);
export const parseOcrText   = (raw_text)   => client.post('surveys/ocr', { raw_text }).then((r) => r.data);

// ─── Citizen Reports ──────────────────────────────────────────────────────────
export const submitCitizenReport = (data)  => client.post('citizen-reports', data);
export const trackReport         = (phone) => client.get(`citizen-reports/track/${phone}`);
export const listCitizenReports  = (params) => client.get('citizen-reports', { params }).then(r => r.data);

// ─── Locations ────────────────────────────────────────────────────────────────
export const listLocations  = ()           => client.get('locations').then((r) => r.data);
export const getLocations   = ()           => client.get('locations');
export const createLocation = (data)       => client.post('locations', data).then((r) => r.data);

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const getDashboard      = (params)                   => client.get('tasks/dashboard', { params }).then((r) => r.data);
export const getDashboardTasks = (params)                   => client.get('tasks/dashboard', { params });
export const getNearbyTasks    = (lat, lng, radius = 10)   => client.get('tasks/nearby', { params: { lat, lng, radius } });
export const getTaskMatches    = (taskId)                   => client.get(`tasks/${taskId}/matches`);
export const assignVolunteer   = (data)                     => client.post('assignments', data);
export const listTasks         = (params)                   => client.get('tasks', { params: params || {} }).then((r) => r.data);
export const getTask           = (id)                       => client.get(`tasks/${id}`).then((r) => r.data);
export const updateTask        = (id, data)                 => client.patch(`tasks/${id}`, data).then((r) => r.data);

// ─── Volunteers ───────────────────────────────────────────────────────────────
export const listVolunteers    = (params)   => client.get('volunteers', { params }).then((r) => r.data);
export const createVolunteer   = (data)     => client.post('volunteers', data).then((r) => r.data);
export const updateVolunteer   = (id, data) => client.patch(`volunteers/${id}`, data).then((r) => r.data);
export const deleteVolunteer   = (id)       => client.delete(`volunteers/${id}`).then((r) => r.data);

// ─── Assignments ──────────────────────────────────────────────────────────────
export const createAssignment        = (data) => client.post('assignments', data).then((r) => r.data);
export const listAssignments         = (params) => client.get('assignments', { params }).then((r) => r.data);
export const updateAssignment        = (id, data) => client.patch(`assignments/${id}`, data).then((r) => r.data);
export const getMyAssignments        = () => client.get('assignments/mine');
export const updateAssignmentStatus  = (id, status) => client.patch(`assignments/${id}/status`, { status });

/**
 * Complete an assignment — sends photo evidence as multipart/form-data.
 * @param {string} id       Assignment ID
 * @param {File}   photoFile  File object from <input type="file">
 */
export const completeAssignment = (id, photoFile) => {
  const fd = new FormData();
  fd.append('proof', photoFile);
  return client.post(`assignments/${id}/complete`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }).then((r) => r.data);
};
