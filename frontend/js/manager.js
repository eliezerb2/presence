const API_BASE_URL = 'http://localhost:8000'; // Replace with your backend API URL

function initializeManager() {
    const attendanceDateInput = document.getElementById('attendance-date-input');
    const loadAttendanceBtn = document.getElementById('load-attendance-btn');
    const attendanceTableBody = document.getElementById('attendance-table-body');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    const overrideModal = document.getElementById('override-modal');
    const closeModalBtn = overrideModal.querySelector('.close-button');
    const overrideForm = document.getElementById('override-form');

    // Set today's date as default
    attendanceDateInput.valueAsDate = new Date();

    loadAttendanceBtn.addEventListener('click', loadDailyAttendance);
    closeModalBtn.addEventListener('click', () => overrideModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target == overrideModal) {
            overrideModal.style.display = 'none';
        }
    });
    overrideForm.addEventListener('submit', handleOverrideSubmit);

    async function loadDailyAttendance() {
        const selectedDate = attendanceDateInput.value;
        if (!selectedDate) {
            alert('Please select a date.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/attendance/daily/${selectedDate}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const attendanceRecords = await response.json();
            displayAttendance(attendanceRecords);
        } catch (error) {
            console.error('Error loading daily attendance:', error);
            attendanceTableBody.innerHTML = '<tr><td colspan="7">Error loading attendance.</td></tr>';
        }
    }

    async function getStudentName(studentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/students/${studentId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const student = await response.json();
            return `${student.first_name} ${student.last_name} (${student.nickname || student.student_number})`;
        } catch (error) {
            console.error(`Error fetching student ${studentId}:`, error);
            return `Student ${studentId}`;
        }
    }

    async function displayAttendance(records) {
        attendanceTableBody.innerHTML = '';
        if (records.length === 0) {
            attendanceTableBody.innerHTML = '<tr><td colspan="7">No attendance records for this date.</td></tr>';
            return;
        }

        for (const record of records) {
            const studentName = await getStudentName(record.student_id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${studentName}</td>
                <td>${record.status}</td>
                <td>${record.sub_status}</td>
                <td>${record.reported_by}</td>
                <td>${record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : 'N/A'}</td>
                <td>${record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : 'N/A'}</td>
                <td>
                    <button class="override-btn" data-attendance-id="${record.id}">Override</button>
                </td>
            `;
            attendanceTableBody.appendChild(row);
        }

        document.querySelectorAll('.override-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const attendanceId = event.target.dataset.attendanceId;
                openOverrideModal(attendanceId);
            });
        });
    }

    async function openOverrideModal(attendanceId) {
        const response = await fetch(`${API_BASE_URL}/attendance/${attendanceId}`);
        const record = await response.json();

        document.getElementById('override-attendance-id').value = record.id;
        document.getElementById('override-status').value = record.status;
        document.getElementById('override-sub-status').value = record.sub_status;
        document.getElementById('override-reported-by').value = record.reported_by;
        document.getElementById('override-check-in').value = record.check_in_time ? new Date(record.check_in_time).toISOString().slice(0, 16) : '';
        document.getElementById('override-check-out').value = record.check_out_time ? new Date(record.check_out_time).toISOString().slice(0, 16) : '';
        document.getElementById('override-closed-reason').value = record.closed_reason;
        document.getElementById('override-locked').checked = record.override_locked;

        overrideModal.style.display = 'block';
    }

    async function handleOverrideSubmit(event) {
        event.preventDefault();

        const attendanceId = document.getElementById('override-attendance-id').value;
        const updatedData = {
            status: document.getElementById('override-status').value,
            sub_status: document.getElementById('override-sub-status').value,
            reported_by: document.getElementById('override-reported-by').value,
            check_in_time: document.getElementById('override-check-in').value || null,
            check_out_time: document.getElementById('override-check-out').value || null,
            closed_reason: document.getElementById('override-closed-reason').value,
            override_locked: document.getElementById('override-locked').checked
        };

        try {
            const response = await fetch(`${API_BASE_URL}/attendance/${attendanceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            alert('Attendance record updated successfully!');
            overrideModal.style.display = 'none';
            loadDailyAttendance(); // Reload attendance to show changes
        } catch (error) {
            console.error('Error updating attendance record:', error);
            alert(`Error updating record: ${error.message}`);
        }
    }

    exportCsvBtn.addEventListener('click', () => {
        alert('CSV Export functionality is not yet implemented.');
        // TODO: Implement CSV export logic
    });

    // Load attendance for today on initial load
    loadDailyAttendance();
}
