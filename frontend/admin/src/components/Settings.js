import React, { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    lateness_threshold_per_month_default: 5,
    max_yom_lo_ba_li_per_month_default: 2,
    court_chair_name: '',
    court_chair_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.get();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ text: 'שגיאה בטעינת הגדרות המערכת', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsApi.update(settings);
      setMessage({ text: 'הגדרות המערכת עודכנו בהצלחה', type: 'success' });
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ text: 'שגיאה בעדכון הגדרות המערכת', type: 'error' });
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div>
      <div className="card">
        <h2>הגדרות מערכת</h2>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="loading">טוען הגדרות...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
              <h3>ספי התראות חודשיים</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">סף איחורים חודשי (ברירת מחדל)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.lateness_threshold_per_month_default}
                    onChange={(e) => handleChange('lateness_threshold_per_month_default', parseInt(e.target.value))}
                    min="1"
                    max="31"
                    required
                  />
                  <small style={{ color: '#6c757d' }}>
                    מספר האיחורים המקסימלי בחודש לפני פתיחת תביעה
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">סף "יום לא בא לי" חודשי (ברירת מחדל)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.max_yom_lo_ba_li_per_month_default}
                    onChange={(e) => handleChange('max_yom_lo_ba_li_per_month_default', parseInt(e.target.value))}
                    min="0"
                    max="31"
                    required
                  />
                  <small style={{ color: '#6c757d' }}>
                    מספר ימי "לא בא לי" המקסימלי בחודש לפני פתיחת תביעה
                  </small>
                </div>
              </div>
            </div>

            <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
              <h3>פרטי יו"ר בית דין</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">שם יו"ר בית דין</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.court_chair_name}
                    onChange={(e) => handleChange('court_chair_name', e.target.value)}
                    placeholder="הכנס שם יו"ר בית דין"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">טלפון יו"ר בית דין</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={settings.court_chair_phone}
                    onChange={(e) => handleChange('court_chair_phone', e.target.value)}
                    placeholder="הכנס מספר טלפון"
                  />
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button type="submit" className="btn btn-success">
                שמור הגדרות
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <h3>מידע על הגדרות המערכת</h3>
        <div style={{ color: '#6c757d' }}>
          <p><strong>סף איחורים חודשי:</strong> כאשר תלמיד חורג מהמספר הזה של איחורים בחודש, תיפתח תביעה אוטומטית.</p>
          <p><strong>סף "יום לא בא לי" חודשי:</strong> כאשר תלמיד מגיע למספר הזה של ימי "לא בא לי" בחודש, תיפתח תביעה אוטומטית.</p>
          <p><strong>פרטי יו"ר בית דין:</strong> פרטים אלה ישמשו לשליחת התראות על תביעות חדשות.</p>
          <p><strong>עקיפות חודשיות:</strong> ניתן להגדיר ספים שונים לתלמידים ספציפיים בחודשים ספציפיים בעמוד "עקיפות חודשיות".</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;