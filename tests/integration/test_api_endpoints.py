import pytest
from datetime import date, datetime
from fastapi.testclient import TestClient


class TestStudentsAPI:
    def test_create_student(self, client):
        """Test creating a student via API."""
        student_data = {
            "student_number": "12345",
            "nickname": "Test",
            "first_name": "John",
            "last_name": "Doe",
            "phone_number": "050-1234567",
            "school_level": "elementary",
            "activity_status": "active"
        }
        
        response = client.post("/api/students", json=student_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["student_number"] == "12345"
        assert data["first_name"] == "John"
        assert data["last_name"] == "Doe"

    def test_get_students(self, client, sample_student):
        """Test getting students list."""
        response = client.get("/api/students")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        assert any(s["student_number"] == sample_student.student_number for s in data)

    def test_get_student_by_id(self, client, sample_student):
        """Test getting a specific student."""
        response = client.get(f"/api/students/{sample_student.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == sample_student.id
        assert data["student_number"] == sample_student.student_number

    def test_update_student(self, client, sample_student):
        """Test updating a student."""
        update_data = {
            "student_number": sample_student.student_number,
            "nickname": "Updated",
            "first_name": "Jane",
            "last_name": sample_student.last_name,
            "phone_number": sample_student.phone_number,
            "school_level": sample_student.school_level,
            "activity_status": sample_student.activity_status
        }
        
        response = client.put(f"/api/students/{sample_student.id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["first_name"] == "Jane"
        assert data["nickname"] == "Updated"

    def test_delete_student(self, client, sample_student):
        """Test deleting a student."""
        response = client.delete(f"/api/students/{sample_student.id}")
        assert response.status_code == 200
        
        # Verify student is deleted
        response = client.get(f"/api/students/{sample_student.id}")
        assert response.status_code == 404

    def test_search_students(self, client, sample_student):
        """Test searching students."""
        response = client.get(f"/api/students/search/{sample_student.first_name}")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        assert any(s["first_name"] == sample_student.first_name for s in data)


class TestAttendanceAPI:
    def test_create_attendance(self, client, sample_student):
        """Test creating attendance via API."""
        attendance_data = {
            "student_id": sample_student.id,
            "date": str(date.today()),
            "status": "present",
            "sub_status": "none",
            "check_in_time": datetime.now().isoformat(),
            "override_locked": False
        }
        
        response = client.post("/api/attendance", json=attendance_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["student_id"] == sample_student.id
        assert data["status"] == "present"

    def test_get_attendance(self, client, sample_student):
        """Test getting attendance records."""
        # First create an attendance record
        attendance_data = {
            "student_id": sample_student.id,
            "date": str(date.today()),
            "status": "present",
            "sub_status": "none"
        }
        client.post("/api/attendance", json=attendance_data)
        
        # Then get attendance records
        response = client.get("/api/attendance")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1

    def test_get_daily_attendance(self, client, sample_student):
        """Test getting daily attendance."""
        # First create an attendance record
        attendance_data = {
            "student_id": sample_student.id,
            "date": str(date.today()),
            "status": "present",
            "sub_status": "none"
        }
        client.post("/api/attendance", json=attendance_data)
        
        # Then get daily attendance
        response = client.get(f"/api/attendance/daily/{date.today()}")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1


class TestKioskAPI:
    def test_check_in(self, client, sample_student):
        """Test student check-in via kiosk API."""
        response = client.post(f"/api/kiosk/check-in/{sample_student.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "present"
        assert data["check_in_time"] is not None

    def test_check_out(self, client, sample_student):
        """Test student check-out via kiosk API."""
        # First check in
        client.post(f"/api/kiosk/check-in/{sample_student.id}")
        
        # Then check out
        response = client.post(f"/api/kiosk/check-out/{sample_student.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["check_out_time"] is not None

    def test_search_students_kiosk(self, client, sample_student):
        """Test searching students via kiosk API."""
        response = client.get(f"/api/kiosk/search/{sample_student.first_name}")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        assert any(s["first_name"] == sample_student.first_name for s in data)


class TestManagerAPI:
    def test_get_daily_attendance_manager(self, client, sample_student):
        """Test getting daily attendance via manager API."""
        # First create an attendance record
        attendance_data = {
            "student_id": sample_student.id,
            "date": str(date.today()),
            "status": "present",
            "sub_status": "none"
        }
        client.post("/api/attendance", json=attendance_data)
        
        # Then get daily attendance
        response = client.get(f"/api/manager/daily-attendance/{date.today()}")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1

    def test_get_monthly_stats(self, client, sample_student):
        """Test getting monthly statistics."""
        year_month = date.today().strftime("%Y-%m")
        response = client.get(f"/api/manager/monthly-stats/{sample_student.id}/{year_month}")
        assert response.status_code == 200
        
        data = response.json()
        assert "late_count" in data
        assert "yom_lo_ba_li_count" in data

    def test_export_csv(self, client, sample_student):
        """Test CSV export."""
        # First create an attendance record
        attendance_data = {
            "student_id": sample_student.id,
            "date": str(date.today()),
            "status": "present",
            "sub_status": "none"
        }
        client.post("/api/attendance", json=attendance_data)
        
        # Then export CSV
        response = client.get(f"/api/manager/export-csv/{date.today()}")
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"


class TestSettingsAPI:
    def test_get_settings(self, client, sample_settings):
        """Test getting settings."""
        response = client.get("/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert data["lateness_threshold_per_month_default"] == 5
        assert data["max_yom_lo_ba_li_per_month_default"] == 2

    def test_update_settings(self, client, sample_settings):
        """Test updating settings."""
        update_data = {
            "lateness_threshold_per_month_default": 7,
            "max_yom_lo_ba_li_per_month_default": 3,
            "court_chair_name": "Updated Chair",
            "court_chair_phone": "050-9999999"
        }
        
        response = client.put("/api/settings", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["lateness_threshold_per_month_default"] == 7
        assert data["court_chair_name"] == "Updated Chair"