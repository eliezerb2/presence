import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { managerApi, attendanceApi } from '../services/api';

const DailyAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    loadDailyAttendance();
  }, [selectedDate]);

  const loadDailyAttendance = async () => {
    setLoading(true);
    try {
      const response = await managerApi.getDailyAttendance(selectedDate);
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error loading daily attendance:', error);
      setMessage({ text: 'שגיאה בטעינת נתוני נוכחות', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await managerApi.exportCsv(selectedDate);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ text: 'הקובץ יוצא בהצלחה', type: 'success' });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setMessage({ text: 'שגיאה בייצוא הקובץ', type: 'error' });
    }
  };

  const handleUpdateAttendance = async (attendanceId, updateData) => {
    try {
      await attendanceApi.update(attendanceId, updateData);
      setMessage({ text: 'נוכחות עודכנה בהצלחה', type: 'success' });
      setEditingRecord(null);
      loadDailyAttendance();
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage({ text: 'שגיאה בעדכון נוכחות', type: 'error' });
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'present': 'נוכח',
      'absent': 'נעדר',
      'late': 'מאחר',
      'permanent_absence_approval': 'היעדרות קבועה',
      'didnt_feel_like_it': 'יום לא בא לי',
      'left': 'יצא',
      'not_reported': 'לא דווח'
    };
    return statusMap[status] || status;
  };

  const getSubStatusText = (subStatus) => {
    const subStatusMap = {
      'none': '',
      'late': 'מאחר',
      'auto_closed': 'נסגר אוטומטית'
    };
    return subStatusMap[subStatus] || subStatus;
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      'present': 'status-present',
      'absent': 'status-absent',
      'late': 'status-late',
      'permanent_absence_approval': 'status-permanent-absence',
      'didnt_feel_like_it': 'status-absent',
      'left': 'status-present',
      'not_reported': 'status-not-reported'
    };
    return `status-badge ${classMap[status] || ''}`;
  };

  const AttendanceEditForm = ({ record, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      status: record.attendance.status,
      sub_status: record.attendance.sub_status,
      check_in_time: record.attendance.check_in_time ? record.attendance.check_in_time.substring(0, 5) : '',
      check_out_time: record.attendance.check_out_time ? record.attendance.check_out_time.substring(0, 5) : ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const updateData = { ...formData };
      if (updateData.check_in_time) {
        updateData.check_in_time = `${selectedDate}T${updateData.check_in_time}:00`;
      }
      if (updateData.check_out_time) {
        updateData.check_out_time = `${selectedDate}T${updateData.check_out_time}:00`;
      }
      onSave(record.attendance.id, updateData);
    };

    return (
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group">
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="form-select"
          >
            <option value="present">נוכח</option>
            <option value="absent">נעדר</option>
            <option value="permanent_absence_approval">היעדרות קבועה</option>
            <option value="didnt_feel_like_it">יום לא בא לי</option>
            <option value="left">יצא</option>
          </select>
        </div>
        <div className="form-group">
          <select
            value={formData.sub_status}
            onChange={(e) => setFormData({ ...formData, sub_status: e.target.value })}
            className="form-select"
          >
            <option value="none">ללא</option>
            <option value="late">מאחר</option>
            <option value="auto_closed">נסגר אוטומטית</option>
          </select>
        </div>
        <div className="form-group">
          <input
            type="time"
            value={formData.check_in_time}
            onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
            className="form-control"
            placeholder="שעת כניסה"
          />
        </div>
        <div className="form-group">
          <input
            type="time"
            value={formData.check_out_time}
            onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
            className="form-control"
            placeholder="שעת יציאה"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-success btn-sm">שמור</button>
          <button type="button" onClick={onCancel} className="btn btn-danger btn-sm">ביטול</button>
        </div>
      </form>
    );
  };

  const stats = attendanceData.reduce((acc, record) => {
    const status = record.attendance.status;
    acc.total++;
    if (status === 'present' || status === 'left') acc.present++;
    else if (status === 'absent' || status === 'didnt_feel_like_it') acc.absent++;
    else if (status === 'permanent_absence_approval') acc.permanentAbsence++;
    else acc.notReported++;
    
    if (record.attendance.sub_status === 'late') acc.late++;
    
    return acc;
  }, { total: 0, present: 0, absent: 0, late: 0, permanentAbsence: 0, notReported: 0 });

  return (
    <div>
      <div className="card">
        <h2>נוכחות יומית</h2>
        
        <div className="date-picker">
          <label htmlFor="date" className="form-label">תאריך:</label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-control"
            style={{ width: 'auto' }}
          />
          <button onClick={handleExportCsv} className="btn btn-primary">
            ייצא לקובץ CSV
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'}`}>
            {message.text}
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">סה"כ תלמידים</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.present}</div>
            <div className="stat-label">נוכחים</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.absent}</div>
            <div className="stat-label">נעדרים</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.late}</div>
            <div className="stat-label">מאחרים</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.permanentAbsence}</div>
            <div className="stat-label">היעדרות קבועה</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.notReported}</div>
            <div className="stat-label">לא דווח</div>
          </div>
        </div>

        {loading ? (
          <div className="loading">טוען נתונים...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>מספר תלמיד</th>
                <th>שם</th>
                <th>סטטוס</th>
                <th>תת-סטטוס</th>
                <th>שעת כניסה</th>
                <th>שעת יציאה</th>
                <th>נעול</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.student_id}>
                  <td>{record.student_number}</td>
                  <td>
                    {record.first_name} {record.last_name}
                    {record.nickname && ` (${record.nickname})`}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(record.attendance.status)}>
                      {getStatusText(record.attendance.status)}
                    </span>
                  </td>
                  <td>{getSubStatusText(record.attendance.sub_status)}</td>
                  <td>
                    {record.attendance.check_in_time 
                      ? new Date(record.attendance.check_in_time).toLocaleTimeString('he-IL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : '-'
                    }
                  </td>
                  <td>
                    {record.attendance.check_out_time 
                      ? new Date(record.attendance.check_out_time).toLocaleTimeString('he-IL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : '-'
                    }
                  </td>
                  <td>{record.attendance.override_locked ? '🔒' : ''}</td>
                  <td>
                    {editingRecord === record.student_id ? (
                      <AttendanceEditForm
                        record={record}
                        onSave={handleUpdateAttendance}
                        onCancel={() => setEditingRecord(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingRecord(record.student_id)}
                        className="btn btn-warning btn-sm"
                        disabled={record.attendance.override_locked}
                      >
                        עריכה
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DailyAttendance;