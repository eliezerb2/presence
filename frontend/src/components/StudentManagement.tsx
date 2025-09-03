import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Button, Dialog, DialogTitle, DialogContent, TextField, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { Student } from '../types';
import { adminApi } from '../services/api';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Partial<Student>>({});

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await adminApi.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (editStudent.id) {
        await adminApi.updateStudent(editStudent.id, editStudent);
      } else {
        await adminApi.createStudent(editStudent as Omit<Student, 'id'>);
      }
      setOpen(false);
      setEditStudent({});
      loadStudents();
    } catch (error) {
      console.error('Failed to save student:', error);
    }
  };

  const columns: GridColDef[] = [
    { field: 'student_number', headerName: 'מספר תלמיד', width: 120 },
    { field: 'nickname', headerName: 'כינוי', width: 120 },
    { field: 'first_name', headerName: 'שם פרטי', width: 150 },
    { field: 'last_name', headerName: 'שם משפחה', width: 150 },
    { field: 'school_level', headerName: 'רמה', width: 100 },
    { field: 'activity_status', headerName: 'סטטוס', width: 120 },
    {
      field: 'actions',
      headerName: 'פעולות',
      width: 150,
      renderCell: (params) => (
        <Button onClick={() => { setEditStudent(params.row); setOpen(true); }}>
          עריכה
        </Button>
      )
    }
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => { setEditStudent({}); setOpen(true); }}>
          הוסף תלמיד
        </Button>
      </Box>
      
      <DataGrid rows={students} columns={columns} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editStudent.id ? 'עריכת תלמיד' : 'תלמיד חדש'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="מספר תלמיד"
            value={editStudent.student_number || ''}
            onChange={(e) => setEditStudent({...editStudent, student_number: e.target.value})}
          />
          <TextField
            fullWidth
            margin="normal"
            label="כינוי"
            value={editStudent.nickname || ''}
            onChange={(e) => setEditStudent({...editStudent, nickname: e.target.value})}
          />
          <TextField
            fullWidth
            margin="normal"
            label="שם פרטי"
            value={editStudent.first_name || ''}
            onChange={(e) => setEditStudent({...editStudent, first_name: e.target.value})}
          />
          <TextField
            fullWidth
            margin="normal"
            label="שם משפחה"
            value={editStudent.last_name || ''}
            onChange={(e) => setEditStudent({...editStudent, last_name: e.target.value})}
          />
          <TextField
            fullWidth
            margin="normal"
            label="טלפון"
            value={editStudent.phone_number || ''}
            onChange={(e) => setEditStudent({...editStudent, phone_number: e.target.value})}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>רמת בית ספר</InputLabel>
            <Select
              value={editStudent.school_level || ''}
              onChange={(e) => setEditStudent({...editStudent, school_level: e.target.value as any})}
            >
              <MenuItem value="יסודי">יסודי</MenuItem>
              <MenuItem value="תיכון">תיכון</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>סטטוס פעילות</InputLabel>
            <Select
              value={editStudent.activity_status || 'פעיל'}
              onChange={(e) => setEditStudent({...editStudent, activity_status: e.target.value as any})}
            >
              <MenuItem value="פעיל">פעיל</MenuItem>
              <MenuItem value="לא פעיל">לא פעיל</MenuItem>
              <MenuItem value="מושעה">מושעה</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleSave}>שמור</Button>
            <Button onClick={() => setOpen(false)}>ביטול</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};