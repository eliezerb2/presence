import React, { useState } from 'react';
import { Container, TextField, Button, List, ListItem, ListItemText, Typography, Box } from '@mui/material';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

function Kiosk() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');

  const searchStudents = async () => {
    if (!query.trim()) return;
    
    try {
      const response = await axios.get(`${API_BASE}/kiosk/search/${query}`);
      setStudents(response.data);
    } catch (error) {
      setMessage('שגיאה בחיפוש תלמידים');
    }
  };

  const checkIn = async (studentId) => {
    try {
      const response = await axios.post(`${API_BASE}/kiosk/checkin/${studentId}`);
      setMessage(response.data.message);
      setStudents([]);
      setQuery('');
    } catch (error) {
      setMessage('שגיאה ברישום כניסה');
    }
  };

  const checkOut = async (studentId) => {
    try {
      const response = await axios.post(`${API_BASE}/kiosk/checkout/${studentId}`);
      setMessage(response.data.message);
      setStudents([]);
      setQuery('');
    } catch (error) {
      setMessage('שגיאה ברישום יציאה');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom>
        מערכת נוכחות
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="חפש לפי מספר תלמיד, כינוי, שם פרטי או משפחה"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
          sx={{ mb: 2, fontSize: '1.5rem' }}
        />
        <Button 
          variant="contained" 
          size="large" 
          onClick={searchStudents}
          sx={{ fontSize: '1.2rem', px: 4 }}
        >
          חפש
        </Button>
      </Box>

      {message && (
        <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
          {message}
        </Typography>
      )}

      <List>
        {students.map((student) => (
          <ListItem key={student.id} sx={{ border: 1, borderColor: 'grey.300', mb: 1, borderRadius: 1 }}>
            <ListItemText
              primary={`${student.first_name} ${student.last_name}`}
              secondary={`מספר: ${student.student_number} | כינוי: ${student.nickname || 'ללא'}`}
              sx={{ fontSize: '1.2rem' }}
            />
            <Box sx={{ ml: 2 }}>
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={() => checkIn(student.id)}
                sx={{ mr: 1, fontSize: '1.1rem' }}
              >
                כניסה
              </Button>
              <Button
                variant="contained"
                color="error"
                size="large"
                onClick={() => checkOut(student.id)}
                sx={{ fontSize: '1.1rem' }}
              >
                יציאה
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default Kiosk;