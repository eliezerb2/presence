import React from 'react';
import { Container, Typography } from '@mui/material';
import { StudentManagement } from '../components/StudentManagement';

export const AdminPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        ניהול מערכת
      </Typography>
      <StudentManagement />
    </Container>
  );
};