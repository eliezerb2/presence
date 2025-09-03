import axios from 'axios';

const API_URL = '/api/settings';

const getSettings = () => {
  return axios.get(API_URL);
};

const updateSettings = (settings) => {
  return axios.put(API_URL, settings);
};

const settingsService = {
  getSettings,
  updateSettings,
};

export default settingsService;
