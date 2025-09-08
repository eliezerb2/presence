import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Students API
export const studentsApi = {
  getAll: (skip = 0, limit = 100) => api.get(`/students?skip=${skip}&limit=${limit}`),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  search: (query) => api.get(`/students/search/${encodeURIComponent(query)}`),
};

// Permanent Absences API
export const permanentAbsencesApi = {
  getAll: (skip = 0, limit = 100) => api.get(`/permanent-absences?skip=${skip}&limit=${limit}`),
  getById: (id) => api.get(`/permanent-absences/${id}`),
  create: (data) => api.post('/permanent-absences', data),
  update: (id, data) => api.put(`/permanent-absences/${id}`, data),
  delete: (id) => api.delete(`/permanent-absences/${id}`),
  getByStudent: (studentId) => api.get(`/permanent-absences/student/${studentId}`),
};

// School Holidays API
export const schoolHolidaysApi = {
  getAll: (skip = 0, limit = 100) => api.get(`/school-holidays?skip=${skip}&limit=${limit}`),
  getById: (id) => api.get(`/school-holidays/${id}`),
  create: (data) => api.post('/school-holidays', data),
  update: (id, data) => api.put(`/school-holidays/${id}`, data),
  delete: (id) => api.delete(`/school-holidays/${id}`),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Student Monthly Overrides API (we'll need to add this to the backend)
export const studentMonthlyOverridesApi = {
  getAll: (skip = 0, limit = 100) => api.get(`/student-monthly-overrides?skip=${skip}&limit=${limit}`),
  getById: (id) => api.get(`/student-monthly-overrides/${id}`),
  create: (data) => api.post('/student-monthly-overrides', data),
  update: (id, data) => api.put(`/student-monthly-overrides/${id}`, data),
  delete: (id) => api.delete(`/student-monthly-overrides/${id}`),
  getByStudent: (studentId) => api.get(`/student-monthly-overrides/student/${studentId}`),
};

export default api;