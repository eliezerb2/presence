import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchStudents();
    } else {
      setStudents([]);
    }
  }, [searchQuery]);

  const searchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/kiosk/search/${encodeURIComponent(searchQuery)}`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error searching students:', error);
      setMessage({ text: 'שגיאה בחיפוש תלמידים', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (studentId, studentName) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/kiosk/checkin/${studentId}`);
      setMessage({ text: response.data.message, type: 'success' });
      setSearchQuery('');
      setStudents([]);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'שגיאה בדיווח כניסה';
      setMessage({ text: errorMessage, type: 'error' });
    }
  };

  const handleCheckOut = async (studentId, studentName) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/kiosk/checkout/${studentId}`);
      setMessage({ text: response.data.message, type: 'success' });
      setSearchQuery('');
      setStudents([]);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'שגיאה בדיווח יציאה';
      setMessage({ text: errorMessage, type: 'error' });
    }
  };

  const clearMessage = () => {
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 5000);
  };

  useEffect(() => {
    if (message.text) {
      clearMessage();
    }
  }, [message]);

  return (
    <div className="container">
      <div className="header">
        <h1>קיוסק נוכחות</h1>
        <p>חפש את שמך ודווח על נוכחותך</p>
      </div>

      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="הקלד מספר תלמיד, כינוי, שם פרטי או שם משפחה..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {loading && (
          <div className="loading">
            מחפש תלמידים...
          </div>
        )}

        {!loading && searchQuery.length >= 2 && students.length === 0 && (
          <div className="no-results">
            לא נמצאו תלמידים התואמים לחיפוש
          </div>
        )}

        <div className="search-results">
          {students.map((student) => (
            <div key={student.id} className="student-card">
              <div className="student-info">
                <div className="student-name">
                  {student.first_name} {student.last_name}
                </div>
                <div className="student-details">
                  מספר תלמיד: {student.student_number}
                  {student.nickname && ` | כינוי: ${student.nickname}`}
                </div>
              </div>
              <div className="action-buttons">
                <button
                  className="btn btn-checkin"
                  onClick={() => handleCheckIn(student.id, `${student.first_name} ${student.last_name}`)}
                >
                  כניסה
                </button>
                <button
                  className="btn btn-checkout"
                  onClick={() => handleCheckOut(student.id, `${student.first_name} ${student.last_name}`)}
                >
                  יציאה
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;