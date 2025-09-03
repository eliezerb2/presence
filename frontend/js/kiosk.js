const API_BASE_URL = 'http://localhost:8000'; // Replace with your backend API URL

function initializeKiosk() {
    const studentSearchInput = document.getElementById('student-search-input');
    const studentResultsDiv = document.getElementById('student-results');

    let searchTimeout;

    studentSearchInput.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = studentSearchInput.value;
            if (query.length > 2) {
                searchStudents(query);
            } else {
                studentResultsDiv.innerHTML = '';
            }
        }, 500);
    });

    async function searchStudents(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/students/search/?query=${query}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const students = await response.json();
            displayStudents(students);
        } catch (error) {
            console.error('Error searching students:', error);
            studentResultsDiv.innerHTML = '<p>Error searching for students.</p>';
        }
    }

    function displayStudents(students) {
        studentResultsDiv.innerHTML = '';
        if (students.length === 0) {
            studentResultsDiv.innerHTML = '<p>No students found.</p>';
            return;
        }

        students.forEach(student => {
            const studentDiv = document.createElement('div');
            studentDiv.innerHTML = `
                <h3>${student.first_name} ${student.last_name} (${student.nickname || student.student_number})</h3>
                <button data-student-id="${student.id}" class="check-in-btn">Check In</button>
                <button data-student-id="${student.id}" class="check-out-btn">Check Out</button>
            `;
            studentResultsDiv.appendChild(studentDiv);
        });

        document.querySelectorAll('.check-in-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const studentId = event.target.dataset.studentId;
                checkIn(studentId);
            });
        });

        document.querySelectorAll('.check-out-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const studentId = event.target.dataset.studentId;
                checkOut(studentId);
            });
        });
    }

    async function checkIn(studentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/attendance/check-in/${studentId}?reported_by=student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            alert(`Checked in ${data.student_id} successfully!`);
            studentSearchInput.value = '';
            studentResultsDiv.innerHTML = '';
        } catch (error) {
            console.error('Error checking in:', error);
            alert(`Error checking in: ${error.message}`);
        }
    }

    async function checkOut(studentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/attendance/check-out/${studentId}?reported_by=student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            alert(`Checked out ${data.student_id} successfully!`);
            studentSearchInput.value = '';
            studentResultsDiv.innerHTML = '';
        } catch (error) {
            console.error('Error checking out:', error);
            alert(`Error checking out: ${error.message}`);
        }
    }
}
