import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Define the Student type according to our schema
interface Student {
  id: number;
  student_number: string;
  nickname: string | null;
  first_name: string;
  last_name: string;
}

function Kiosk() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const fetchStudents = () => {
    axios.get(`${apiUrl}/students/`)
      .then(response => {
        setStudents(response.data);
        setFilteredStudents(response.data); // Initialize filtered students with all students
      })
      .catch(err => {
        console.error("There was an error fetching the students!", err);
        setError(`Failed to fetch students. Is the backend running at ${apiUrl}?`);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search term
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results = students.filter(student =>
      student.student_number.toLowerCase().includes(lowerCaseSearchTerm) ||
      (student.nickname && student.nickname.toLowerCase().includes(lowerCaseSearchTerm)) ||
      student.first_name.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.last_name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredStudents(results);
  }, [searchTerm, students]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleCheckIn = (studentId: number) => {
    axios.post(`${apiUrl}/attendance/check-in`, null, { params: { student_id: studentId, reported_by: 'student' } })
      .then(response => {
        setMessage(`Check-in successful for student ID ${studentId}. Status: ${response.data.status}`);
        setError(null);
        // Optionally refresh student list or attendance status
      })
      .catch(err => {
        console.error("Error during check-in:", err);
        setMessage(null);
        setError(`Check-in failed: ${err.response?.data?.detail || err.message}`);
      });
  };

  const handleCheckOut = (studentId: number) => {
    axios.post(`${apiUrl}/attendance/check-out`, null, { params: { student_id: studentId, reported_by: 'student' } })
      .then(response => {
        setMessage(`Check-out successful for student ID ${studentId}. Status: ${response.data.status}`);
        setError(null);
        // Optionally refresh student list or attendance status
      })
      .catch(err => {
        console.error("Error during check-out:", err);
        setMessage(null);
        setError(`Check-out failed: ${err.response?.data?.detail || err.message}`);
      });
  };

  return (
    <div className="kiosk-container">
      <h1>Student Kiosk</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <input
        type="text"
        placeholder="Search by ID, Nickname, First or Last Name"
        value={searchTerm}
        onChange={handleSearchChange}
        style={{ padding: '10px', fontSize: '1.2em', width: '80%', marginBottom: '20px' }}
      />
      <div style={{ textAlign: 'left' }}>
        {filteredStudents.length > 0 ? (
          <ul>
            {filteredStudents.map(student => (
              <li key={student.id} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {student.first_name} {student.last_name} ({student.student_number})
                  {student.nickname && ` - ${student.nickname}`}
                </span>
                <div>
                  <button 
                    onClick={() => handleCheckIn(student.id)}
                    style={{ padding: '10px 20px', fontSize: '1em', marginRight: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Check In
                  </button>
                  <button 
                    onClick={() => handleCheckOut(student.id)}
                    style={{ padding: '10px 20px', fontSize: '1em', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Check Out
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No students found matching your search.</p>
        )}
      </div>
    </div>
  );
}

export default Kiosk;
