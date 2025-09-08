import React, { useState, useEffect } from 'react';
import { schoolHolidaysApi } from '../services/api';

const SchoolHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  const [formData, setFormData] = useState({
    date: '',
    description: ''
  });

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const response = await schoolHolidaysApi.getAll(0, 1000);
      setHolidays(response.data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
      console.error('Error loading holidays:', error);
      setMessage({ text: 'שגיאה בטעינת חגים וחופשות', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHoliday) {
        await schoolHolidaysApi.update(editingHoliday.id, formData);
        setMessage({ text: 'חג/חופשה עודכן בהצלחה', type: 'success' });
      } else {
        await schoolHolidaysApi.create(formData);
        setMessage({ text: 'חג/חופשה נוסף בהצלחה', type: 'success' });
      }
      setShowModal(false);
      setEditingHoliday(null);
      resetForm();
      loadHolidays();
    } catch (error) {
      console.error('Error saving holiday:', error);
      const errorMessage = error.response?.data?.detail || 'שגיאה בשמירת חג/חופשה';
      setMessage({ text: errorMessage, type: 'error' });
    }
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      date: holiday.date,
      description: holiday.description
    });
    setShowModal(true);
  };

  const handleDelete = async (holidayId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את החג/חופשה?')) {
      try {
        await schoolHolidaysApi.delete(holidayId);
        setMessage({ text: 'חג/חופשה נמחק בהצלחה', type: 'success' });
        loadHolidays();
      } catch (error) {
        console.error('Error deleting holiday:', error);
        setMessage({ text: 'שגיאה במחיקת חג/חופשה', type: 'error' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      description: ''
    });
  };

  const handleAddNew = () => {
    setEditingHoliday(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <div>
      <div className="card">
        <h2>חגים וחופשות</h2>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'}`}>
            {message.text}
          </div>
        )}

        <div className="actions-bar">
          <button onClick={handleAddNew} className="btn btn-primary">
            הוסף חג/חופשה
          </button>
        </div>

        {loading ? (
          <div className="loading">טוען חגים וחופשות...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>תאריך</th>
                <th>תיאור</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((holiday) => (
                <tr key={holiday.id}>
                  <td>{new Date(holiday.date).toLocaleDateString('he-IL')}</td>
                  <td>{holiday.description}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(holiday)}
                      className="btn btn-warning btn-sm"
                    >
                      עריכה
                    </button>
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="btn btn-danger btn-sm"
                    >
                      מחיקה
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingHoliday ? 'עריכת חג/חופשה' : 'הוספת חג/חופשה'}</h3>
              <button
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">תאריך *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">תיאור *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="הכנס תיאור החג/חופשה"
                  required
                />
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button type="submit" className="btn btn-success">
                  {editingHoliday ? 'עדכן' : 'הוסף'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-danger"
                  style={{ marginRight: '10px' }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolHolidays;