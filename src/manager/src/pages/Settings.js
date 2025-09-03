import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import settingsService from '../services/settingsService';

function Settings() {
  const [settings, setSettings] = useState({
    lateness_threshold_per_month_default: 0,
    max_yom_lo_ba_li_per_month_default: 2,
    court_chair_name: '',
    court_chair_phone: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    settingsService.getSettings().then((response) => {
      setSettings(response.data);
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleSave = () => {
    settingsService.updateSettings(settings).then(() => {
      alert('Settings saved successfully!');
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <TextField
        name="lateness_threshold_per_month_default"
        label="Lateness Threshold Per Month (Default)"
        value={settings.lateness_threshold_per_month_default}
        onChange={handleChange}
        fullWidth
        margin="normal"
        type="number"
      />
      <TextField
        name="max_yom_lo_ba_li_per_month_default"
        label="Max 'I Don't Feel Like It' Days Per Month (Default)"
        value={settings.max_yom_lo_ba_li_per_month_default}
        onChange={handleChange}
        fullWidth
        margin="normal"
        type="number"
      />
      <TextField
        name="court_chair_name"
        label="Court Chair Name"
        value={settings.court_chair_name}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        name="court_chair_phone"
        label="Court Chair Phone"
        value={settings.court_chair_phone}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" onClick={handleSave}>
        Save Settings
      </Button>
    </Box>
  );
}

export default Settings;
