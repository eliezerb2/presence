import React, { useState, useEffect } from 'react';
import { permanentAbsencesApi, studentsApi } from '../services/api';

const PermanentAbsences = () => {
  const [absences, setAbsences] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState(null);

  const [formData, setFormData] = useState({
    student_id: '',
    weekday: 'sunday',
    reason: ''
  });

  useEffect(() => {
    loadAbsences();
    loadStudents();
  }, []);

  const loadAbsences = async () => {
    setLoading(true);
    try {
      const response = await permanentAbsencesApi.getAll(0, 1000);
      setAbsences(response.data);
    } catch (error) {
      console.error('Error loading absences:', error);
      setMessage({ text: 'שגיאה בטעינת היעדרויות קבועות', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await studentsApi.getAll(0, 1000);
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAbsence) {
        await permanentAbsencesApi.update(editingAbsence.id, formData);
        setMessage({ text: 'היעדרות קבועה עודכנה בהצלחה', type: 'success' });
      } else {
        await permanentAbsencesApi.create(formData);
        setMessage({ text: 'היעדרות קבועה נוספה בהצלחה', type: 'success' });
      }
      setShowModal(false);
      setEditingAbsence(null);
      resetForm();
      loadAbsences();
    } catch (error) {
      console.error('Error saving absence:', error);
      const errorMessage = error.response?.data?.detail || 'שגיאה בשמירת היעדרות קבועה';
      setMessage({ text: errorMessage, type: 'error' });
    }
  };

  const handleEdit = (absence) => {
    setEditingAbsence(absence);
    setFormData({
      student_id: absence.student_id,
      weekday: absence.weekday,
      reason: absence.reason
    });
    setShowModal(true);
  };

  const handleDelete = async (absenceId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את ההיעדרות הקבועה?')) {
      try {
        await permanentAbsencesApi.delete(absenceId);
        setMessage({ text: 'היעדרות קבועה נמחקה בהצלחה', type: 'success' });
        loadAbsences();
      } catch (error) {
        console.error('Error deleting absence:', error);
        setMessage({ text: 'שגיאה במחיקת היעדרות קבועה', type: 'error' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      weekday: 'sunday',
      reason: ''
    });
  };

  const handleAddNew = () => {
    setEditingAbsence(null);
    resetForm();
    setShowModal(true);
  };

  const getWeekdayText = (weekday) => {
    const weekdayMap = {
      'sunday': 'ראשון',
      'monday': 'שני',
      'tuesday': 'שלישי',
      'wednesday': 'רביעי',
      'thursday': 'חמישי'
    };
    return weekdayMap[weekday] || weekday;
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name} (${student.student_number})` : 'לא נמצא';
  };

  return (
    <div>
      <div className="card">
        <h2>היעדרויות קבועות</h2>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'}`}>
            {message.text}
          </div>
        )}

        <div className="actions-bar">
          <button onClick={handleAddNew} className="btn btn-primary">
            הוסף היעדרות קבועה
          </button>
        </div>

        {loading ? (
          <div className="loading">טוען היעדרויות קבועות...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>תלמיד</th>
                <th>יום בשבוע</th>
                <th>סיבה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((absence) => (
                <tr key={absence.id}>
                  <td>{getStudentName(absence.student_id)}</td>
                  <td>{getWeekdayText(absence.weekday)}</td>
                  <td>{absence.reason}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(absence)}
                      className="btn btn-warning btn-sm"
                    >
                      עריכה
                    </button>
                    <button
                      onClick={() => handleDelete(absence.id)}
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
              <h3>{editingAbsence ? 'עריכת היעדרות קבועה' : 'הוספת היעדרות קבועה'}</h3>
              <button
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">תלמיד *</label>
                <select
                  className="form-select"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
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
                <label className="form-label">יום בשבוע *</label>
                <select
                  className="form-select"
                  value={formData.weekday}
                  onChange={(e) => setFormData({ ...formData, weekday: e.target.value })}
                  required
                >
                  <option value="sunday">ראשון</option>
                  <option value="monday">שני</option>
                  <option value="tuesday">שלישי</option>
                  <option value="wednesday">רביעי</option>
                  <option value="thursday">חמישי</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">סיבה *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="הכנס סיבה להיעדרות"
                  required
                />
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button type="submit" className="btn btn-success">
                  {editingAbsence ? 'עדכן' : 'הוסף'}
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

export default PermanentAbsences;