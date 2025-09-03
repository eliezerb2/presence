import axios from 'axios';
import { Student, Attendance, Settings } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const kioskApi = {
  searchStudents: (query: string) => 
    api.get<Student[]>(`/kiosk/search?query=${encodeURIComponent(query)}`),
  
  checkIn: (studentId: number) => 
    api.post<Attendance>(`/kiosk/checkin/${studentId}`),
  
  checkOut: (studentId: number) => 
    api.post<Attendance>(`/kiosk/checkout/${studentId}`),
};

export const managerApi = {
  getDailyAttendance: (date?: string) => 
    api.get<Attendance[]>(`/manager/attendance${date ? `?date=${date}` : ''}`),
  
  overrideAttendance: (id: number, updates: Partial<Attendance>) => 
    api.put<Attendance>(`/manager/attendance/${id}`, updates),
  
  getMonthlyStats: (studentId: number, yearMonth: string) => 
    api.get(`/manager/stats?studentId=${studentId}&yearMonth=${yearMonth}`),
  
  exportCSV: (startDate: string, endDate: string) => 
    api.get(`/manager/export?startDate=${startDate}&endDate=${endDate}`, {
      responseType: 'blob'
    }),
};

export const adminApi = {
  // Students
  getStudents: () => api.get<Student[]>('/admin/students'),
  createStudent: (student: Omit<Student, 'id'>) => api.post<Student>('/admin/students', student),
  updateStudent: (id: number, student: Partial<Student>) => api.put<Student>(`/admin/students/${id}`, student),
  deleteStudent: (id: number) => api.delete(`/admin/students/${id}`),
  
  // Settings
  getSettings: () => api.get<Settings>('/admin/settings'),
  updateSettings: (settings: Partial<Settings>) => api.put<Settings>('/admin/settings', settings),
};