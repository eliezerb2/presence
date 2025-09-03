import React, { useState } from 'react';
import { TextField, List, ListItem, ListItemText, Button, Box, Typography } from '@mui/material';
import { Student } from '../types';
import { kioskApi } from '../services/api';

export const KioskSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setStudents([]);
      return;
    }

    setLoading(true);
    try {
      const response = await kioskApi.searchStudents(searchQuery);
      setStudents(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (studentId: number) => {
    try {
      await kioskApi.checkIn(studentId);
      setQuery('');
      setStudents([]);
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleCheckOut = async (studentId: number) => {
    try {
      await kioskApi.checkOut(studentId);
      setQuery('');
      setStudents([]);
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h4" align="center" gutterBottom>
        מערכת נוכחות
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="חפש תלמיד (מספר, כינוי, שם)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        sx={{ mb: 2, fontSize: '1.5rem' }}
        InputProps={{ style: { fontSize: '1.5rem' } }}
      />

      {loading && <Typography>מחפש...</Typography>}

      <List>
        {students.map((student) => (
          <ListItem key={student.id} sx={{ border: 1, borderColor: 'grey.300', mb: 1, borderRadius: 1 }}>
            <ListItemText
              primary={`${student.first_name} ${student.last_name}`}
              secondary={`${student.nickname} - ${student.student_number}`}
              sx={{ fontSize: '1.2rem' }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={() => handleCheckIn(student.id)}
              >
                כניסה
              </Button>
              <Button
                variant="contained"
                color="error"
                size="large"
                onClick={() => handleCheckOut(student.id)}
              >
                יציאה
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};