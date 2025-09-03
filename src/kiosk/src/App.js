import React, { useState } from 'react';
import { Box, Button, TextField, Typography, List, ListItem, ListItemText } from '@mui/material';
import studentService from './services/studentService';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setSelectedStudent(null);
      return;
    }
    try {
      // Assuming the API has a search endpoint that returns a list of students
      const response = await studentService.searchStudents(searchQuery);
      setSearchResults(response.data);
      setSelectedStudent(null); // Clear selected student on new search
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchResults([]);
      setSelectedStudent(null);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSearchResults([]); // Clear search results after selecting a student
  };

  const handleCheckIn = async () => {
    if (selectedStudent) {
      try {
        await studentService.checkIn(selectedStudent.id);
        alert(`${selectedStudent.first_name} ${selectedStudent.last_name} checked in!`);
        setSelectedStudent(null); // Clear selected student after action
        setSearchQuery(''); // Clear search query
      } catch (error) {
        console.error('Error checking in:', error);
        alert('Failed to check in.');
      }
    }
  };

  const handleCheckOut = async () => {
    if (selectedStudent) {
      try {
        await studentService.checkOut(selectedStudent.id);
        alert(`${selectedStudent.first_name} ${selectedStudent.last_name} checked out!`);
        setSelectedStudent(null); // Clear selected student after action
        setSearchQuery(''); // Clear search query
      } catch (error) {
        console.error('Error checking out:', error);
        alert('Failed to check out.');
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Typography variant="h3" gutterBottom>
        School Kiosk
      </Typography>

      <TextField
        label="Search Student (Number, Nickname, Name)"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSearch();
          }
        }}
        sx={{ mb: 2, maxWidth: 500 }}
      />
      <Button variant="contained" onClick={handleSearch} sx={{ mb: 3 }}>
        Search
      </Button>

      {searchResults.length > 0 && (
        <List sx={{ width: '100%', maxWidth: 500, bgcolor: 'background.paper', mb: 3 }}>
          {searchResults.map((student) => (
            <ListItem key={student.id} button onClick={() => handleStudentSelect(student)}>
              <ListItemText primary={`${student.first_name} ${student.last_name} (${student.student_number})`} />
            </ListItem>
          ))}
        </List>
      )}

      {selectedStudent && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Selected Student: {selectedStudent.first_name} {selectedStudent.last_name} ({selectedStudent.student_number})
          </Typography>
          <Button variant="contained" color="success" sx={{ mr: 2 }} onClick={handleCheckIn}>
            Check In
          </Button>
          <Button variant="contained" color="error" onClick={handleCheckOut}>
            Check Out
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default App;
