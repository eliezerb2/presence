import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import schoolHolidayService from '../services/schoolHolidayService';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'date', headerName: 'Date', width: 150 },
  { field: 'description', headerName: 'Description', width: 250 },
];

function SchoolHolidays() {
  const [schoolHolidays, setSchoolHolidays] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedSchoolHoliday, setSelectedSchoolHoliday] = useState(null);

  useEffect(() => {
    loadSchoolHolidays();
  }, []);

  const loadSchoolHolidays = () => {
    schoolHolidayService.getSchoolHolidays().then((response) => {
      setSchoolHolidays(response.data);
    });
  };

  const handleOpen = (schoolHoliday = null) => {
    setSelectedSchoolHoliday(schoolHoliday);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSchoolHoliday(null);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const schoolHolidayData = Object.fromEntries(formData.entries());

    if (selectedSchoolHoliday) {
      schoolHolidayService.updateSchoolHoliday(selectedSchoolHoliday.id, schoolHolidayData).then(() => {
        loadSchoolHolidays();
        handleClose();
      });
    } else {
      schoolHolidayService.createSchoolHoliday(schoolHolidayData).then(() => {
        loadSchoolHolidays();
        handleClose();
      });
    }
  };

  const handleDelete = (id) => {
    schoolHolidayService.deleteSchoolHoliday(id).then(() => {
      loadSchoolHolidays();
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
        School Holidays
      </Typography>
      <Button variant="contained" onClick={() => handleOpen()}>
        Add School Holiday
      </Button>
      <DataGrid
        rows={schoolHolidays}
        columns={[...columns, actionsColumn]}
        pageSize={10}
        rowsPerPageOptions={[10]}
        checkboxSelection
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedSchoolHoliday ? 'Edit School Holiday' : 'Add School Holiday'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="school-holiday-form" onSubmit={handleSave}>
            <TextField name="date" label="Date" defaultValue={selectedSchoolHoliday?.date} fullWidth margin="normal" />
            <TextField name="description" label="Description" defaultValue={selectedSchoolHoliday?.description} fullWidth margin="normal" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="school-holiday-form">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SchoolHolidays;
