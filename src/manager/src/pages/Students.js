import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import studentService from '../services/studentService';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'student_number', headerName: 'Student Number', width: 150 },
  { field: 'nickname', headerName: 'Nickname', width: 150 },
  { field: 'first_name', headerName: 'First Name', width: 150 },
  { field: 'last_name', headerName: 'Last Name', width: 150 },
  { field: 'phone_number', headerName: 'Phone Number', width: 150 },
  { field: 'school_level', headerName: 'School Level', width: 150 },
  { field: 'activity_status', headerName: 'Activity Status', width: 150 },
];

function Students() {
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = () => {
    studentService.getStudents().then((response) => {
      setStudents(response.data);
    });
  };

  const handleOpen = (student = null) => {
    setSelectedStudent(student);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStudent(null);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const studentData = Object.fromEntries(formData.entries());

    if (selectedStudent) {
      studentService.updateStudent(selectedStudent.id, studentData).then(() => {
        loadStudents();
        handleClose();
      });
    } else {
      studentService.createStudent(studentData).then(() => {
        loadStudents();
        handleClose();
      });
    }
  };

  const handleDelete = (id) => {
    studentService.deleteStudent(id).then(() => {
      loadStudents();
    });
  };

  const actionsColumn = {
    field: 'actions',
    headerName: 'Actions',
    width: 200,
    renderCell: (params) => (
      <>
        <Button onClick={() => handleOpen(params.row)}>Edit</Button>
        <Button onClick={() => handleDelete(params.row.id)}>Delete</Button>
      </>
    ),
  };

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Students
      </Typography>
      <Button variant="contained" onClick={() => handleOpen()}>
        Add Student
      </Button>
      <DataGrid
        rows={students}
        columns={[...columns, actionsColumn]}
        pageSize={10}
        rowsPerPageOptions={[10]}
        checkboxSelection
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="student-form" onSubmit={handleSave}>
            <TextField name="student_number" label="Student Number" defaultValue={selectedStudent?.student_number} fullWidth margin="normal" />
            <TextField name="nickname" label="Nickname" defaultValue={selectedStudent?.nickname} fullWidth margin="normal" />
            <TextField name="first_name" label="First Name" defaultValue={selectedStudent?.first_name} fullWidth margin="normal" />
            <TextField name="last_name" label="Last Name" defaultValue={selectedStudent?.last_name} fullWidth margin="normal" />
            <TextField name="phone_number" label="Phone Number" defaultValue={selectedStudent?.phone_number} fullWidth margin="normal" />
            <TextField name="school_level" label="School Level" defaultValue={selectedStudent?.school_level} fullWidth margin="normal" />
            <TextField name="activity_status" label="Activity Status" defaultValue={selectedStudent?.activity_status} fullWidth margin="normal" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="student-form">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Students;
