
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { KioskPage } from './pages/KioskPage';
import { ManagerPage } from './pages/ManagerPage';
import { AdminPage } from './pages/AdminPage';

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
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                מערכת נוכחות בית ספר
              </Typography>
              <Button color="inherit" href="/kiosk">
                קיוסק
              </Button>
              <Button color="inherit" href="/manager">
                ניהול
              </Button>
              <Button color="inherit" href="/admin">
                מנהל
              </Button>
            </Toolbar>
          </AppBar>

          <Routes>
            <Route path="/" element={<Navigate to="/kiosk" replace />} />
            <Route path="/kiosk" element={<KioskPage />} />
            <Route path="/manager" element={<ManagerPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;