import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import permanentAbsenceService from '../services/permanentAbsenceService';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'student_id', headerName: 'Student ID', width: 150 },
  { field: 'weekday', headerName: 'Weekday', width: 150 },
  { field: 'reason', headerName: 'Reason', width: 250 },
];

function PermanentAbsences() {
  const [permanentAbsences, setPermanentAbsences] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPermanentAbsence, setSelectedPermanentAbsence] = useState(null);

  useEffect(() => {
    loadPermanentAbsences();
  }, []);

  const loadPermanentAbsences = () => {
    permanentAbsenceService.getPermanentAbsences().then((response) => {
      setPermanentAbsences(response.data);
    });
  };

  const handleOpen = (permanentAbsence = null) => {
    setSelectedPermanentAbsence(permanentAbsence);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPermanentAbsence(null);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const permanentAbsenceData = Object.fromEntries(formData.entries());

    if (selectedPermanentAbsence) {
      permanentAbsenceService.updatePermanentAbsence(selectedPermanentAbsence.id, permanentAbsenceData).then(() => {
        loadPermanentAbsences();
        handleClose();
      });
    } else {
      permanentAbsenceService.createPermanentAbsence(permanentAbsenceData).then(() => {
        loadPermanentAbsences();
        handleClose();
      });
    }
  };

  const handleDelete = (id) => {
    permanentAbsenceService.deletePermanentAbsence(id).then(() => {
      loadPermanentAbsences();
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
        Permanent Absences
      </Typography>
      <Button variant="contained" onClick={() => handleOpen()}>
        Add Permanent Absence
      </Button>
      <DataGrid
        rows={permanentAbsences}
        columns={[...columns, actionsColumn]}
        pageSize={10}
        rowsPerPageOptions={[10]}
        checkboxSelection
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedPermanentAbsence ? 'Edit Permanent Absence' : 'Add Permanent Absence'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="permanent-absence-form" onSubmit={handleSave}>
            <TextField name="student_id" label="Student ID" defaultValue={selectedPermanentAbsence?.student_id} fullWidth margin="normal" />
            <TextField name="weekday" label="Weekday" defaultValue={selectedPermanentAbsence?.weekday} fullWidth margin="normal" />
            <TextField name="reason" label="Reason" defaultValue={selectedPermanentAbsence?.reason} fullWidth margin="normal" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="permanent-absence-form">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PermanentAbsences;
