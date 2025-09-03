import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import claimService from '../services/claimService';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'student_id', headerName: 'Student ID', width: 150 },
  { field: 'date_opened', headerName: 'Date Opened', width: 150 },
  { field: 'reason', headerName: 'Reason', width: 250 },
  { field: 'notified_to', headerName: 'Notified To', width: 250 },
  { field: 'status', headerName: 'Status', width: 150 },
];

function Claims() {
  const [claims, setClaims] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = () => {
    claimService.getClaims().then((response) => {
      setClaims(response.data);
    });
  };

  const handleOpen = (claim = null) => {
    setSelectedClaim(claim);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedClaim(null);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const claimData = Object.fromEntries(formData.entries());

    if (selectedClaim) {
      claimService.updateClaim(selectedClaim.id, claimData).then(() => {
        loadClaims();
        handleClose();
      });
    } else {
      claimService.createClaim(claimData).then(() => {
        loadClaims();
        handleClose();
      });
    }
  };

  const handleDelete = (id) => {
    claimService.deleteClaim(id).then(() => {
      loadClaims();
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
        Claims
      </Typography>
      <Button variant="contained" onClick={() => handleOpen()}>
        Add Claim
      </Button>
      <DataGrid
        rows={claims}
        columns={[...columns, actionsColumn]}
        pageSize={10}
        rowsPerPageOptions={[10]}
        checkboxSelection
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedClaim ? 'Edit Claim' : 'Add Claim'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="claim-form" onSubmit={handleSave}>
            <TextField name="student_id" label="Student ID" defaultValue={selectedClaim?.student_id} fullWidth margin="normal" />
            <TextField name="date_opened" label="Date Opened" defaultValue={selectedClaim?.date_opened} fullWidth margin="normal" />
            <TextField name="reason" label="Reason" defaultValue={selectedClaim?.reason} fullWidth margin="normal" />
            <TextField name="notified_to" label="Notified To (JSON)" defaultValue={selectedClaim?.notified_to} fullWidth margin="normal" />
            <TextField name="status" label="Status" defaultValue={selectedClaim?.status} fullWidth margin="normal" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="claim-form">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Claims;
