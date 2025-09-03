import axios from 'axios';

const API_URL = '/api/permanent-absences';

const getPermanentAbsences = () => {
  return axios.get(API_URL);
};

const getPermanentAbsence = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

const createPermanentAbsence = (permanentAbsence) => {
  return axios.post(API_URL, permanentAbsence);
};

const updatePermanentAbsence = (id, permanentAbsence) => {
  return axios.put(`${API_URL}/${id}`, permanentAbsence);
};

const deletePermanentAbsence = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

const permanentAbsenceService = {
  getPermanentAbsences,
  getPermanentAbsence,
  createPermanentAbsence,
  updatePermanentAbsence,
  deletePermanentAbsence,
};

export default permanentAbsenceService;
