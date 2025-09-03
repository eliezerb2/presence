import axios from 'axios';

const API_URL = '/api/student-monthly-overrides';

const getStudentMonthlyOverrides = () => {
  return axios.get(API_URL);
};

const getStudentMonthlyOverride = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

const createStudentMonthlyOverride = (studentMonthlyOverride) => {
  return axios.post(API_URL, studentMonthlyOverride);
};

const updateStudentMonthlyOverride = (id, studentMonthlyOverride) => {
  return axios.put(`${API_URL}/${id}`, studentMonthlyOverride);
};

const deleteStudentMonthlyOverride = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

const studentMonthlyOverrideService = {
  getStudentMonthlyOverrides,
  getStudentMonthlyOverride,
  createStudentMonthlyOverride,
  updateStudentMonthlyOverride,
  deleteStudentMonthlyOverride,
};

export default studentMonthlyOverrideService;
