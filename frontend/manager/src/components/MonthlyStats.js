import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { studentsApi, managerApi } from '../services/api';

const MonthlyStats = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent && selectedMonth) {
      loadMonthlyStats();
    }
  }, [selectedStudent, selectedMonth]);

  const loadStudents = async () => {
    try {
      const response = await studentsApi.getAll();
      setStudents(response.data);
      if (response.data.length > 0) {
        setSelectedStudent(response.data[0].id.toString());
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setMessage({ text: 'שגיאה בטעינת רשימת תלמידים', type: 'error' });
    }
  };

  const loadMonthlyStats = async () => {
    setLoading(true);
    try {
      const response = await managerApi.getMonthlyStats(selectedStudent, selectedMonth);
      setMonthlyStats(response.data);
    } catch (error) {
      console.error('Error loading monthly stats:', error);
      setMessage({ text: 'שגיאה בטעינת סטטיסטיקות חודשיות', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const selectedStudentData = students.find(s => s.id.toString() === selectedStudent);

  return (
    <div>
      <div className="card">
        <h2>סטטיסטיקות חודשיות</h2>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'}`}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">תלמיד:</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="form-select"
              style={{ minWidth: '200px' }}
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
            <label className="form-label">חודש:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-control"
              style={{ width: 'auto' }}
            />
          </div>
        </div>

        {selectedStudentData && (
          <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
            <h3>פרטי תלמיד</h3>
            <p>
              <strong>שם:</strong> {selectedStudentData.first_name} {selectedStudentData.last_name}
              {selectedStudentData.nickname && ` (${selectedStudentData.nickname})`}
            </p>
            <p><strong>מספר תלמיד:</strong> {selectedStudentData.student_number}</p>
            <p><strong>רמת בית ספר:</strong> {selectedStudentData.school_level}</p>
            <p><strong>סטטוס פעילות:</strong> {selectedStudentData.activity_status}</p>
          </div>
        )}

        {loading ? (
          <div className="loading">טוען סטטיסטיקות...</div>
        ) : monthlyStats ? (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{monthlyStats.late_count}</div>
                <div className="stat-label">איחורים החודש</div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                  סף: {monthlyStats.late_threshold}
                </div>
                {monthlyStats.late_exceeded && (
                  <div style={{ color: '#e74c3c', fontWeight: 'bold', marginTop: '5px' }}>
                    ⚠️ חרג מהסף!
                  </div>
                )}
              </div>

              <div className="stat-card">
                <div className="stat-number">{monthlyStats.yom_lo_ba_li_count}</div>
                <div className="stat-label">ימי "לא בא לי"</div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                  סף: {monthlyStats.yom_lo_ba_li_threshold}
                </div>
                {monthlyStats.yom_lo_ba_li_exceeded && (
                  <div style={{ color: '#e74c3c', fontWeight: 'bold', marginTop: '5px' }}>
                    ⚠️ חרג מהסף!
                  </div>
                )}
              </div>
            </div>

            {(monthlyStats.late_exceeded || monthlyStats.yom_lo_ba_li_exceeded) && (
              <div className="alert alert-warning">
                <h4>התראה!</h4>
                <p>התלמיד חרג מהספים החודשיים. יש לבדוק אם נפתחה תביעה.</p>
                {monthlyStats.late_exceeded && (
                  <p>• חרג מסף האיחורים: {monthlyStats.late_count}/{monthlyStats.late_threshold}</p>
                )}
                {monthlyStats.yom_lo_ba_li_exceeded && (
                  <p>• חרג מסף "יום לא בא לי": {monthlyStats.yom_lo_ba_li_count}/{monthlyStats.yom_lo_ba_li_threshold}</p>
                )}
              </div>
            )}

            <div className="card">
              <h3>פירוט חודשי</h3>
              <table className="table">
                <tbody>
                  <tr>
                    <td><strong>חודש:</strong></td>
                    <td>{selectedMonth}</td>
                  </tr>
                  <tr>
                    <td><strong>סה"כ איחורים:</strong></td>
                    <td>
                      {monthlyStats.late_count}
                      {monthlyStats.late_exceeded && <span style={{ color: '#e74c3c' }}> (חרג מהסף)</span>}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>סף איחורים:</strong></td>
                    <td>{monthlyStats.late_threshold}</td>
                  </tr>
                  <tr>
                    <td><strong>סה"כ ימי "לא בא לי":</strong></td>
                    <td>
                      {monthlyStats.yom_lo_ba_li_count}
                      {monthlyStats.yom_lo_ba_li_exceeded && <span style={{ color: '#e74c3c' }}> (חרג מהסף)</span>}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>סף "יום לא בא לי":</strong></td>
                    <td>{monthlyStats.yom_lo_ba_li_threshold}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedStudent && selectedMonth ? (
          <div className="alert alert-warning">
            לא נמצאו נתונים עבור התלמיד והחודש שנבחרו
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MonthlyStats;