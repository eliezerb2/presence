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

// Attendance API
export const attendanceApi = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.date_filter) queryParams.append('date_filter', params.date_filter);
    if (params.student_id) queryParams.append('student_id', params.student_id);
    if (params.skip) queryParams.append('skip', params.skip);
    if (params.limit) queryParams.append('limit', params.limit);
    return api.get(`/attendance?${queryParams}`);
  },
  getById: (id) => api.get(`/attendance/${id}`),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  getDaily: (date) => api.get(`/attendance/daily/${date}`),
};

// Manager API
export const managerApi = {
  getDailyAttendance: (date) => api.get(`/manager/daily-attendance/${date}`),
  getMonthlyStats: (studentId, yearMonth) => api.get(`/manager/monthly-stats/${studentId}/${yearMonth}`),
  exportCsv: (date) => api.get(`/manager/export-csv/${date}`, { responseType: 'blob' }),
  getClaimsSummary: () => api.get('/manager/claims-summary'),
};

// Claims API
export const claimsApi = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.student_id) queryParams.append('student_id', params.student_id);
    if (params.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params.skip) queryParams.append('skip', params.skip);
    if (params.limit) queryParams.append('limit', params.limit);
    return api.get(`/claims?${queryParams}`);
  },
  getById: (id) => api.get(`/claims/${id}`),
  create: (data) => api.post('/claims', data),
  update: (id, data) => api.put(`/claims/${id}`, data),
  delete: (id) => api.delete(`/claims/${id}`),
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

export default api;