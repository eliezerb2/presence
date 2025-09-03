import axios from 'axios';

const API_URL = '/api/audit-log';

const getAuditLogs = () => {
  return axios.get(API_URL);
};

const getAuditLogsByEntity = (entity, entityId) => {
  return axios.get(`${API_URL}/${entity}/${entityId}`);
};

const auditLogService = {
  getAuditLogs,
  getAuditLogsByEntity,
};

export default auditLogService;
