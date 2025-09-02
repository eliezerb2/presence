import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

// Define interfaces for data from backend
interface Student {
  id: number;
  student_number: string;
  nickname: string | null;
  first_name: string;
  last_name: string;
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  date: string; // YYYY-MM-DD
  status: string;
  sub_status: string;
  reported_by: string;
  check_in_time: string | null; // HH:MM:SS
  check_out_time: string | null; // HH:MM:SS
  closed_reason: string;
  override_locked: boolean;
  override_locked_at: string | null; // ISO string
}

// For the edit modal form
interface AttendanceFormData {
  status: string;
  sub_status: string;
  reported_by: string;
  check_in_time: string;
  check_out_time: string;
  closed_reason: string;
}

function Manager() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [studentsMap, setStudentsMap] = useState<Map<number, Student>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // State for edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [formData, setFormData] = useState<AttendanceFormData>({
    status: '',
    sub_status: '',
    reported_by: '',
    check_in_time: '',
    check_out_time: '',
    closed_reason: '',
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:31152';

  const fetchAttendance = async (dateToFetch: string) => {
    try {
      // Fetch students (if not already fetched)
      if (studentsMap.size === 0) {
        const studentsResponse = await axios.get<Student[]>(`${apiUrl}/students/`);
        const studentsData = studentsResponse.data;
        const map = new Map<number, Student>();
        studentsData.forEach(s => map.set(s.id, s));
        setStudentsMap(map);
      }

      // Fetch attendance records for the selected date
      const attendanceResponse = await axios.get<AttendanceRecord[]>(`${apiUrl}/attendance/by-date?target_date=${dateToFetch}`);
      setAttendanceRecords(attendanceResponse.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching data for manager:", err);
      setError(`Failed to fetch data: ${err.response?.data?.detail || err.message}`);
      setAttendanceRecords([]);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate, apiUrl]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const handleEditClick = (record: AttendanceRecord) => {
    setCurrentRecord(record);
    setFormData({
      status: record.status,
      sub_status: record.sub_status,
      reported_by: record.reported_by,
      check_in_time: record.check_in_time || '',
      check_out_time: record.check_out_time || '',
      closed_reason: record.closed_reason || '',
    });
    setIsModalOpen(true);
  };

  const handleModalChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModalSubmit = async () => {
    if (!currentRecord) return;

    try {
      // Prepare data for backend (only send changed fields)
      const updatePayload: any = {};
      for (const key in formData) {
        if (formData[key as keyof AttendanceFormData] !== currentRecord[key as keyof AttendanceRecord]) {
          // Special handling for time fields: convert empty string to null
          if (key === 'check_in_time' || key === 'check_out_time') {
            updatePayload[key] = formData[key as keyof AttendanceFormData] === '' ? null : formData[key as keyof AttendanceFormData];
          } else {
            updatePayload[key] = formData[key as keyof AttendanceFormData];
          }
        }
      }

      const response = await axios.put(`${apiUrl}/attendance/${currentRecord.id}`, updatePayload);
      setMessage(`Record updated successfully for ${currentRecord.id}`);
      setError(null);
      setIsModalOpen(false);
      fetchAttendance(selectedDate); // Refresh data
    } catch (err) {
      console.error("Error updating record:", err);
      setMessage(null);
      setError(`Update failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="manager-container">
      <h1>Manager Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="attendanceDate">Select Date: </label>
        <input 
          type="date" 
          id="attendanceDate" 
          value={selectedDate} 
          onChange={handleDateChange} 
          style={{ padding: '8px', fontSize: '1em' }}
        />
      </div>

      <h2>Attendance for {selectedDate}</h2>
      {attendanceRecords.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Student Name</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Student ID</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Sub Status</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Reported By</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Check In</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Check Out</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Locked</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map(record => {
              const student = studentsMap.get(record.student_id);
              return (
                <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{student ? `${student.first_name} ${student.last_name}` : 'N/A'}</td>
                  <td style={{ padding: '8px' }}>{record.student_id}</td>
                  <td style={{ padding: '8px' }}>{record.status}</td>
                  <td style={{ padding: '8px' }}>{record.sub_status}</td>
                  <td style={{ padding: '8px' }}>{record.reported_by}</td>
                  <td style={{ padding: '8px' }}>{record.check_in_time || '---'}</td>
                  <td style={{ padding: '8px' }}>{record.check_out_time || '---'}</td>
                  <td style={{ padding: '8px' }}>{record.override_locked ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => handleEditClick(record)} style={{ padding: '5px 10px', fontSize: '0.9em', cursor: 'pointer' }}>Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>No attendance records for {selectedDate}.</p>
      )}

      {/* Edit Modal */}
      {isModalOpen && currentRecord && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1000 
        }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', minWidth: '300px', color: 'black' }}>
            <h3>Edit Attendance Record (ID: {currentRecord.id})</h3>
            <p>Student: {studentsMap.get(currentRecord.student_id)?.first_name} {studentsMap.get(currentRecord.student_id)?.last_name}</p>
            <p>Date: {currentRecord.date}</p>
            
            <div style={{ marginBottom: '10px' }}>
              <label>Status:</label>
              <input type="text" name="status" value={formData.status} onChange={handleModalChange} style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Sub Status:</label>
              <input type="text" name="sub_status" value={formData.sub_status} onChange={handleModalChange} style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Reported By:</label>
              <input type="text" name="reported_by" value={formData.reported_by} onChange={handleModalChange} style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Check In Time:</label>
              <input type="time" name="check_in_time" value={formData.check_in_time} onChange={handleModalChange} style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Check Out Time:</label>
              <input type="time" name="check_out_time" value={formData.check_out_time} onChange={handleModalChange} style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Closed Reason:</label>
              <input type="text" name="closed_reason" value={formData.closed_reason} onChange={handleModalChange} style={{ width: '100%', padding: '8px' }} />
            </div>

            <button onClick={handleModalSubmit} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save</button>
            <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Manager;