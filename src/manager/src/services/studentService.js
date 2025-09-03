import axios from 'axios';

const API_URL = '/api/students';

const getStudents = () => {
  return axios.get(API_URL);
};

const getStudent = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

const createStudent = (student) => {
  return axios.post(API_URL, student);
};

const updateStudent = (id, student) => {
  return axios.put(`${API_URL}/${id}`, student);
};

const deleteStudent = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

const studentService = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
};

export default studentService;
