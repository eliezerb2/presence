import React, { useState, useEffect } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
         Select, MenuItem, Button, TextField, Box } from '@mui/material';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

function AttendanceManager() {
  const [attendances, setAttendances] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadAttendances();
  }, [selectedDate]);

  const loadAttendances = async () => {
    try {
      const response = await axios.get(`${API_BASE}/attendance/daily?target_date=${selectedDate}`);
      setAttendances(response.data);
    } catch (error) {
      console.error('Error loading attendances:', error);
    }
  };

  const updateAttendance = async (attendanceId, field, value) => {
    try {
      await axios.put(`${API_BASE}/attendance/${attendanceId}`, {
        [field]: value
      });
      loadAttendances();
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'לא דיווח': '#f44336',
      'נוכח': '#4caf50',
      'יצא': '#2196f3',
      'יום לא בא לי': '#ff9800',
      'חיסור מאושר': '#9c27b0',
      'אישור היעדרות קבוע': '#607d8b'
    };
    return colors[status] || '#000';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        ניהול נוכחות יומית
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          type="date"
          label="תאריך"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={loadAttendances} sx={{ ml: 2 }}>
          רענן
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>תלמיד</TableCell>
            <TableCell>מספר תלמיד</TableCell>
            <TableCell>סטטוס</TableCell>
            <TableCell>סטטוס משנה</TableCell>
            <TableCell>שעת כניסה</TableCell>
            <TableCell>שעת יציאה</TableCell>
            <TableCell>דווח על ידי</TableCell>
            <TableCell>נעול</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {attendances.map((attendance) => (
            <TableRow key={attendance.id}>
              <TableCell>
                {attendance.student.first_name} {attendance.student.last_name}
              </TableCell>
              <TableCell>{attendance.student.student_number}</TableCell>
              <TableCell>
                <Select
                  value={attendance.status}
                  onChange={(e) => updateAttendance(attendance.id, 'status', e.target.value)}
                  size="small"
                  sx={{ color: getStatusColor(attendance.status) }}
                >
                  <MenuItem value="לא דיווח">לא דיווח</MenuItem>
                  <MenuItem value="נוכח">נוכח</MenuItem>
                  <MenuItem value="יצא">יצא</MenuItem>
                  <MenuItem value="יום לא בא לי">יום לא בא לי</MenuItem>
                  <MenuItem value="חיסור מאושר">חיסור מאושר</MenuItem>
                  <MenuItem value="אישור היעדרות קבוע">אישור היעדרות קבוע</MenuItem>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={attendance.sub_status}
                  onChange={(e) => updateAttendance(attendance.id, 'sub_status', e.target.value)}
                  size="small"
                >
                  <MenuItem value="ללא">ללא</MenuItem>
                  <MenuItem value="איחור">איחור</MenuItem>
                  <MenuItem value="נסגר אוטומטית">נסגר אוטומטית</MenuItem>
                </Select>
              </TableCell>
              <TableCell>
                {attendance.check_in_time ? 
                  new Date(attendance.check_in_time).toLocaleTimeString('he-IL') : 
                  'לא נרשם'
                }
              </TableCell>
              <TableCell>
                {attendance.check_out_time ? 
                  new Date(attendance.check_out_time).toLocaleTimeString('he-IL') : 
                  'לא נרשם'
                }
              </TableCell>
              <TableCell>{attendance.reported_by}</TableCell>
              <TableCell>{attendance.override_locked ? 'כן' : 'לא'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}

export default AttendanceManager;