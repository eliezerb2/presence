import React, { useState, useEffect } from 'react';
import { studentsApi } from '../services/api';

const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    student_number: '',
    nickname: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    school_level: 'elementary',
    activity_status: 'active'
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await studentsApi.getAll(0, 1000);
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      setMessage({ text: 'שגיאה בטעינת רשימת תלמידים', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent.id, formData);
        setMessage({ text: 'תלמיד עודכן בהצלחה', type: 'success' });
      } else {
        await studentsApi.create(formData);
        setMessage({ text: 'תלמיד נוסף בהצלחה', type: 'success' });
      }
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      loadStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.detail || 'שגיאה בשמירת התלמיד';
      setMessage({ text: errorMessage, type: 'error' });
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      student_number: student.student_number,
      nickname: student.nickname || '',
      first_name: student.first_name,
      last_name: student.last_name,
      phone_number: student.phone_number || '',
      school_level: student.school_level,
      activity_status: student.activity_status
    });
    setShowModal(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את התלמיד?')) {
      try {
        await studentsApi.delete(studentId);
        setMessage({ text: 'תלמיד נמחק בהצלחה', type: 'success' });
        loadStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        setMessage({ text: 'שגיאה במחיקת התלמיד', type: 'error' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      student_number: '',
      nickname: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      school_level: 'elementary',
      activity_status: 'active'
    });
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    resetForm();
    setShowModal(true);
  };

  const filteredStudents = students.filter(student =>
    student.student_number.includes(searchQuery) ||
    student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.nickname && student.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSchoolLevelText = (level) => {
    const levelMap = {
      'elementary': 'יסודי',
      'high_school': 'תיכון'
    };
    return levelMap[level] || level;
  };

  const getActivityStatusText = (status) => {
    const statusMap = {
      'active': 'פעיל',
      'inactive': 'לא פעיל'
    };
    return statusMap[status] || status;
  };

  return (
    <div>
      <div className="card">
        <h2>ניהול תלמידים</h2>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'}`}>
            {message.text}
          </div>
        )}

        <div className="actions-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="חיפוש תלמיד..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={handleAddNew} className="btn btn-primary">
            הוסף תלמיד חדש
          </button>
        </div>

        {loading ? (
          <div className="loading">טוען תלמידים...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>מספר תלמיד</th>
                <th>כינוי</th>
                <th>שם פרטי</th>
                <th>שם משפחה</th>
                <th>טלפון</th>
                <th>רמת בית ספר</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.student_number}</td>
                  <td>{student.nickname || '-'}</td>
                  <td>{student.first_name}</td>
                  <td>{student.last_name}</td>
                  <td>{student.phone_number || '-'}</td>
                  <td>{getSchoolLevelText(student.school_level)}</td>
                  <td>
                    <span className={`status-badge status-${student.activity_status}`}>
                      {getActivityStatusText(student.activity_status)}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(student)}
                      className="btn btn-warning btn-sm"
                    >
                      עריכה
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
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
              <h3>{editingStudent ? 'עריכת תלמיד' : 'הוספת תלמיד חדש'}</h3>
              <button
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">מספר תלמיד *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.student_number}
                    onChange={(e) => setFormData({ ...formData, student_number: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">כינוי</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">שם פרטי *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">שם משפחה *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">מספר טלפון</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">רמת בית ספר *</label>
                  <select
                    className="form-select"
                    value={formData.school_level}
                    onChange={(e) => setFormData({ ...formData, school_level: e.target.value })}
                    required
                  >
                    <option value="elementary">יסודי</option>
                    <option value="high_school">תיכון</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">סטטוס פעילות *</label>
                  <select
                    className="form-select"
                    value={formData.activity_status}
                    onChange={(e) => setFormData({ ...formData, activity_status: e.target.value })}
                    required
                  >
                    <option value="active">פעיל</option>
                    <option value="inactive">לא פעיל</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button type="submit" className="btn btn-success">
                  {editingStudent ? 'עדכן' : 'הוסף'}
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

export default StudentsManagement;