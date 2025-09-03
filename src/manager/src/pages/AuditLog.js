import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import auditLogService from '../services/auditLogService';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'actor', headerName: 'Actor', width: 150 },
  { field: 'action', headerName: 'Action', width: 150 },
  { field: 'entity', headerName: 'Entity', width: 150 },
  { field: 'entity_id', headerName: 'Entity ID', width: 150 },
  { field: 'before', headerName: 'Before', width: 250 },
  { field: 'after', headerName: 'After', width: 250 },
  { field: 'timestamp', headerName: 'Timestamp', width: 200 },
];

function AuditLog() {
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = () => {
    auditLogService.getAuditLogs().then((response) => {
      setAuditLogs(response.data);
    });
  };

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Audit Log
      </Typography>
      <DataGrid
        rows={auditLogs}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        checkboxSelection
      />
    </Box>
  );
}

export default AuditLog;
