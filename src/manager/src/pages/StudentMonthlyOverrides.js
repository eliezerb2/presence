import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import studentMonthlyOverrideService from '../services/studentMonthlyOverrideService';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'student_id', headerName: 'Student ID', width: 150 },
  { field: 'year_month', headerName: 'Year Month', width: 150 },
  { field: 'lateness_threshold_override', headerName: 'Lateness Threshold Override', width: 250 },
  { field: 'max_yom_lo_ba_li_override', headerName: 'Max "I Don\'t Feel Like It" Override', width: 250 },
];

function StudentMonthlyOverrides() {
  const [studentMonthlyOverrides, setStudentMonthlyOverrides] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedStudentMonthlyOverride, setSelectedStudentMonthlyOverride] = useState(null);

  useEffect(() => {
    loadStudentMonthlyOverrides();
  }, []);

  const loadStudentMonthlyOverrides = () => {
    studentMonthlyOverrideService.getStudentMonthlyOverrides().then((response) => {
      setStudentMonthlyOverrides(response.data);
    });
  };

  const handleOpen = (studentMonthlyOverride = null) => {
    setSelectedStudentMonthlyOverride(studentMonthlyOverride);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStudentMonthlyOverride(null);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const studentMonthlyOverrideData = Object.fromEntries(formData.entries());

    if (selectedStudentMonthlyOverride) {
      studentMonthlyOverrideService.updateStudentMonthlyOverride(selectedStudentMonthlyOverride.id, studentMonthlyOverrideData).then(() => {
        loadStudentMonthlyOverrides();
        handleClose();
      });
    } else {
      studentMonthlyOverrideService.createStudentMonthlyOverride(studentMonthlyOverrideData).then(() => {
        loadStudentMonthlyOverrides();
        handleClose();
      });
    }
  };

  const handleDelete = (id) => {
    studentMonthlyOverrideService.deleteStudentMonthlyOverride(id).then(() => {
      loadStudentMonthlyOverrides();
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
        Student Monthly Overrides
      </Typography>
      <Button variant="contained" onClick={() => handleOpen()}>
        Add Student Monthly Override
      </Button>
      <DataGrid
        rows={studentMonthlyOverrides}
        columns={[...columns, actionsColumn]}
        pageSize={10}
        rowsPerPageOptions={[10]}
        checkboxSelection
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedStudentMonthlyOverride ? 'Edit Student Monthly Override' : 'Add Student Monthly Override'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="student-monthly-override-form" onSubmit={handleSave}>
            <TextField name="student_id" label="Student ID" defaultValue={selectedStudentMonthlyOverride?.student_id} fullWidth margin="normal" />
            <TextField name="year_month" label="Year Month (YYYY-MM)" defaultValue={selectedStudentMonthlyOverride?.year_month} fullWidth margin="normal" />
            <TextField name="lateness_threshold_override" label="Lateness Threshold Override" defaultValue={selectedStudentMonthlyOverride?.lateness_threshold_override} fullWidth margin="normal" />
            <TextField name="max_yom_lo_ba_li_override" label="Max 'I Don\'t Feel Like It' Override" defaultValue={selectedStudentMonthlyOverride?.max_yom_lo_ba_li_override} fullWidth margin="normal" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="student-monthly-override-form">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StudentMonthlyOverrides;
