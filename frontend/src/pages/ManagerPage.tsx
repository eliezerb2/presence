import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { AttendanceGrid } from '../components/AttendanceGrid';

export const ManagerPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        ניהול נוכחות
      </Typography>
      <Box sx={{ mt: 3 }}>
        <AttendanceGrid />
      </Box>
    </Container>
  );
};