import React, { useState, useEffect } from 'react';

function DailyAttendanceBoard() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    // In a real application, you would fetch data from the backend API here
    // For now, let's simulate some attendance records
    const dummyRecords = [
      { id: 1, student_id: 1, student_name: "Alice Smith", date: "2025-09-02", status: "נוכח", sub_status: "ללא", reported_by: "student", check_in_time: "08:00" },
      { id: 2, student_id: 2, student_name: "Bob Johnson", date: "2025-09-02", status: "איחור", sub_status: "איחור", reported_by: "auto", check_in_time: "10:15" },
      { id: 3, student_id: 3, student_name: "Charlie Brown", date: "2025-09-02", status: "לא דיווח", sub_status: "ללא", reported_by: "auto", check_in_time: null },
    ];
    setAttendanceRecords(dummyRecords);
  }, []);

  return (
    <div>
      <h2>Daily Attendance Board</h2>
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Date</th>
            <th>Status</th>
            <th>Sub Status</th>
            <th>Reported By</th>
            <th>Check-in Time</th>
          </tr>
        </thead>
        <tbody>
          {attendanceRecords.map(record => (
            <tr key={record.id}>
              <td>{record.student_name}</td>
              <td>{record.date}</td>
              <td>{record.status}</td>
              <td>{record.sub_status}</td>
              <td>{record.reported_by}</td>
              <td>{record.check_in_time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DailyAttendanceBoard;
