import axios from 'axios';

const API_URL = '/api/claims';

const getClaims = () => {
  return axios.get(API_URL);
};

const getClaim = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

const createClaim = (claim) => {
  return axios.post(API_URL, claim);
};

const updateClaim = (id, claim) => {
  return axios.put(`${API_URL}/${id}`, claim);
};

const deleteClaim = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

const claimService = {
  getClaims,
  getClaim,
  createClaim,
  updateClaim,
  deleteClaim,
};

export default claimService;
