import React from 'react';
import { Container } from '@mui/material';
import { KioskSearch } from '../components/KioskSearch';

export const KioskPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <KioskSearch />
    </Container>
  );
};