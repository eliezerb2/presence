import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Button, Select, MenuItem, FormControl, Box } from '@mui/material';
import { Attendance } from '../types';
import { managerApi } from '../services/api';

export const AttendanceGrid: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const response = await managerApi.getDailyAttendance(selectedDate);
      setAttendances(response.data);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (id: number, field: string, value: any) => {
    try {
      await managerApi.overrideAttendance(id, { [field]: value });
      loadAttendance();
    } catch (error) {
      console.error('Override failed:', error);
    }
  };

  const columns: GridColDef[] = [
    { field: 'student_number', headerName: 'מספר תלמיד', width: 120 },
    { 
      field: 'student_name', 
      headerName: 'שם', 
      width: 200,
      valueGetter: (params) => `${params.row.student?.first_name} ${params.row.student?.last_name}`
    },
    {
      field: 'status',
      headerName: 'סטטוס',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <FormControl size="small" fullWidth>
          <Select
            value={params.value}
            onChange={(e) => handleOverride(params.row.id, 'status', e.target.value)}
            disabled={params.row.override_locked}
          >
            <MenuItem value="לא דיווח">לא דיווח</MenuItem>
            <MenuItem value="נוכח">נוכח</MenuItem>
            <MenuItem value="יצא">יצא</MenuItem>
            <MenuItem value="יום לא בא לי">יום לא בא לי</MenuItem>
            <MenuItem value="חיסור מאושר">חיסור מאושר</MenuItem>
            <MenuItem value="אישור היעדרות קבוע">אישור היעדרות קבוע</MenuItem>
          </Select>
        </FormControl>
      )
    },
    {
      field: 'sub_status',
      headerName: 'סטטוס משנה',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <FormControl size="small" fullWidth>
          <Select
            value={params.value}
            onChange={(e) => handleOverride(params.row.id, 'sub_status', e.target.value)}
            disabled={params.row.override_locked}
          >
            <MenuItem value="ללא">ללא</MenuItem>
            <MenuItem value="איחור">איחור</MenuItem>
            <MenuItem value="נסגר אוטומטית">נסגר אוטומטית</MenuItem>
          </Select>
        </FormControl>
      )
    },
    { field: 'check_in_time', headerName: 'כניסה', width: 100 },
    { field: 'check_out_time', headerName: 'יציאה', width: 100 },
    { field: 'reported_by', headerName: 'דווח על ידי', width: 120 },
    {
      field: 'override_locked',
      headerName: 'נעול',
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        params.value ? '🔒' : ''
      )
    }
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <Button variant="contained" onClick={loadAttendance}>
          רענן
        </Button>
      </Box>
      
      <DataGrid
        rows={attendances}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        sx={{ direction: 'rtl' }}
      />
    </Box>
  );
};