import React, { useState, useEffect } from 'react';
import { studentsApi } from '../services/api';

const MonthlyOverrides = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    lateness_threshold_override: '',
    max_yom_lo_ba_li_override: ''
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await studentsApi.getAll(0, 1000);
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      setMessage({ text: 'שגיאה בטעינת רשימת תלמידים', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // This would need to be implemented in the backend
    setMessage({ text: 'תכונה זו תיושם בגרסה עתידית', type: 'warning' });
  };

  return (
    <div>
      <div className="card">
        <h2>עקיפות חודשיות</h2>
        <p style={{ color: '#6c757d' }}>
          כאן ניתן להגדיר ספים שונים לתלמידים ספציפיים בחודשים ספציפיים
        </p>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type === 'warning' ? 'warning' : 'success'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">תלמיד *</label>
              <select
                className="form-select"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
              >
                <option value="">בחר תלמיד</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.student_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">חודש *</label>
              <input
                type="month"
                className="form-control"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">סף איחורים (עקיפה)</label>
              <input
                type="number"
                className="form-control"
                value={formData.lateness_threshold_override}
                onChange={(e) => setFormData({ ...formData, lateness_threshold_override: e.target.value })}
                min="0"
                max="31"
                placeholder="השאר ריק לשימוש בברירת המחדל"
              />
            </div>

            <div className="form-group">
              <label className="form-label">סף "יום לא בא לי" (עקיפה)</label>
              <input
                type="number"
                className="form-control"
                value={formData.max_yom_lo_ba_li_override}
                onChange={(e) => setFormData({ ...formData, max_yom_lo_ba_li_override: e.target.value })}
                min="0"
                max="31"
                placeholder="השאר ריק לשימוש בברירת המחדל"
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button type="submit" className="btn btn-success">
              שמור עקיפה
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>מידע על עקיפות חודשיות</h3>
        <div style={{ color: '#6c757d' }}>
          <p>עקיפות חודשיות מאפשרות להגדיר ספים שונים לתלמידים ספציפיים בחודשים ספציפיים.</p>
          <p>זה שימושי במקרים כמו:</p>
          <ul>
            <li>תלמיד שיש לו בעיות רפואיות זמניות</li>
            <li>תלמיד שעובר תקופה קשה</li>
            <li>התאמות מיוחדות לפי החלטת הנהלה</li>
          </ul>
          <p>אם לא מוגדרת עקיפה, המערכת תשתמש בספים הגלובליים מהגדרות המערכת.</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyOverrides;