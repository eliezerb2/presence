import axios from 'axios';

const API_URL = '/api/students'; // Assuming API is at /api/students

const searchStudents = (query) => {
  // This will need to be implemented in the API to search by student_number, nickname, first_name, last_name
  return axios.get(`${API_URL}?search=${query}`);
};

const checkIn = (studentId) => {
  // This will need a new API endpoint for check-in
  return axios.post(`${API_URL}/${studentId}/check-in`);
};

const checkOut = (studentId) => {
  // This will need a new API endpoint for check-out
  return axios.post(`${API_URL}/${studentId}/check-out`);
};

const studentService = {
  searchStudents,
  checkIn,
  checkOut,
};

export default studentService;
