import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  People as PeopleIcon,
  EventBusy as EventBusyIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Gavel as GavelIcon,
  History as HistoryIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

import Students from './pages/Students';
import PermanentAbsences from './pages/PermanentAbsences';
import SchoolHolidays from './pages/SchoolHolidays';
import Settings from './pages/Settings';
import StudentMonthlyOverrides from './pages/StudentMonthlyOverrides';
import Claims from './pages/Claims';
import AuditLog from './pages/AuditLog';

const drawerWidth = 240;

const navItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Students', icon: <PeopleIcon />, path: '/students' },
  { text: 'Permanent Absences', icon: <EventBusyIcon />, path: '/permanent-absences' },
  { text: 'School Holidays', icon: <ScheduleIcon />, path: '/school-holidays' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Monthly Overrides', icon: <ScheduleIcon />, path: '/monthly-overrides' },
  { text: 'Claims', icon: <GavelIcon />, path: '/claims' },
  { text: 'Audit Log', icon: <HistoryIcon />, path: '/audit-log' },
];

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Presence Manager
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {navItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton component={Link} to={item.path}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/students" element={<Students />} />
            <Route path="/permanent-absences" element={<PermanentAbsences />} />
            <Route path="/school-holidays" element={<SchoolHolidays />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/monthly-overrides" element={<StudentMonthlyOverrides />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/audit-log" element={<AuditLog />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;