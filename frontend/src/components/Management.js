import React, { useState, useEffect } from 'react';
import { Container, Typography, Tabs, Tab, Box, Button, TextField, 
         Table, TableBody, TableCell, TableHead, TableRow, Dialog, 
         DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Management() {
  const [tabValue, setTabValue] = useState(0);
  const [students, setStudents] = useState([]);
  const [settings, setSettings] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_number: '',
    nickname: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    school_level: 'תיכון',
    activity_status: 'פעיל'
  });

  useEffect(() => {
    loadStudents();
    loadSettings();
    loadHolidays();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE}/students/`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/management/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadHolidays = async () => {
    try {
      const response = await axios.get(`${API_BASE}/management/holidays`);
      setHolidays(response.data);
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  const createStudent = async () => {
    try {
      await axios.post(`${API_BASE}/students/`, newStudent);
      setOpenDialog(false);
      setNewStudent({
        student_number: '',
        nickname: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        school_level: 'תיכון',
        activity_status: 'פעיל'
      });
      loadStudents();
    } catch (error) {
      console.error('Error creating student:', error);
    }
  };

  const updateSettings = async () => {
    try {
      await axios.put(`${API_BASE}/management/settings`, settings);
      alert('הגדרות נשמרו בהצלחה');
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        ניהול מערכת
      </Typography>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
        <Tab label="תלמידים" />
        <Tab label="הגדרות" />
        <Tab label="חגים וחופשות" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={() => setOpenDialog(true)}>
            הוסף תלמיד חדש
          </Button>
        </Box>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>מספר תלמיד</TableCell>
              <TableCell>כינוי</TableCell>
              <TableCell>שם פרטי</TableCell>
              <TableCell>שם משפחה</TableCell>
              <TableCell>רמת בית ספר</TableCell>
              <TableCell>סטטוס פעילות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.student_number}</TableCell>
                <TableCell>{student.nickname}</TableCell>
                <TableCell>{student.first_name}</TableCell>
                <TableCell>{student.last_name}</TableCell>
                <TableCell>{student.school_level}</TableCell>
                <TableCell>{student.activity_status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ maxWidth: 400 }}>
          <TextField
            fullWidth
            label="סף איחורים לחודש (ברירת מחדל)"
            type="number"
            value={settings.lateness_threshold_per_month_default || ''}
            onChange={(e) => setSettings({...settings, lateness_threshold_per_month_default: parseInt(e.target.value)})}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="מקסימום 'יום לא בא לי' לחודש (ברירת מחדל)"
            type="number"
            value={settings.max_yom_lo_ba_li_per_month_default || ''}
            onChange={(e) => setSettings({...settings, max_yom_lo_ba_li_per_month_default: parseInt(e.target.value)})}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="שם יו״ר בית המשפט"
            value={settings.court_chair_name || ''}
            onChange={(e) => setSettings({...settings, court_chair_name: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="טלפון יו״ר בית המשפט"
            value={settings.court_chair_phone || ''}
            onChange={(e) => setSettings({...settings, court_chair_phone: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={updateSettings}>
            שמור הגדרות
          </Button>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6">חגים וחופשות</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>תאריך</TableCell>
              <TableCell>תיאור</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {holidays.map((holiday) => (
              <TableRow key={holiday.id}>
                <TableCell>{holiday.date}</TableCell>
                <TableCell>{holiday.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabPanel>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>הוסף תלמיד חדש</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="מספר תלמיד"
            value={newStudent.student_number}
            onChange={(e) => setNewStudent({...newStudent, student_number: e.target.value})}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="כינוי"
            value={newStudent.nickname}
            onChange={(e) => setNewStudent({...newStudent, nickname: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="שם פרטי"
            value={newStudent.first_name}
            onChange={(e) => setNewStudent({...newStudent, first_name: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="שם משפחה"
            value={newStudent.last_name}
            onChange={(e) => setNewStudent({...newStudent, last_name: e.target.value})}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>רמת בית ספר</InputLabel>
            <Select
              value={newStudent.school_level}
              onChange={(e) => setNewStudent({...newStudent, school_level: e.target.value})}
            >
              <MenuItem value="יסודי">יסודי</MenuItem>
              <MenuItem value="תיכון">תיכון</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>ביטול</Button>
          <Button onClick={createStudent} variant="contained">הוסף</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Management;