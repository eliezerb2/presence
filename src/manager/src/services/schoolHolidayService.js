import axios from 'axios';

const API_URL = '/api/school-holidays';

const getSchoolHolidays = () => {
  return axios.get(API_URL);
};

const getSchoolHoliday = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

const createSchoolHoliday = (schoolHoliday) => {
  return axios.post(API_URL, schoolHoliday);
};

const updateSchoolHoliday = (id, schoolHoliday) => {
  return axios.put(`${API_URL}/${id}`, schoolHoliday);
};

const deleteSchoolHoliday = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

const schoolHolidayService = {
  getSchoolHolidays,
  getSchoolHoliday,
  createSchoolHoliday,
  updateSchoolHoliday,
  deleteSchoolHoliday,
};

export default schoolHolidayService;
