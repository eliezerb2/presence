import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Kiosk from './components/Kiosk';
import Management from './components/Management';
import AttendanceManager from './components/AttendanceManager';

const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Kiosk />} />
          <Route path="/management" element={<Management />} />
          <Route path="/attendance" element={<AttendanceManager />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;