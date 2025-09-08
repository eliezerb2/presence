import pytest
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient


class TestStudentWorkflow:
    def test_complete_student_lifecycle(self, client):
        """Test complete student lifecycle: create, update, use, delete."""
        # 1. Create student
        student_data = {
            "student_number": "99999",
            "nickname": "E2E Test",
            "first_name": "End",
            "last_name": "ToEnd",
            "phone_number": "050-9999999",
            "school_level": "elementary",
            "activity_status": "active"
        }
        
        response = client.post("/api/students", json=student_data)
        assert response.status_code == 200
        student = response.json()
        student_id = student["id"]
        
        # 2. Search for student
        response = client.get(f"/api/students/search/End")
        assert response.status_code == 200
        search_results = response.json()
        assert any(s["id"] == student_id for s in search_results)
        
        # 3. Check in student
        response = client.post(f"/api/kiosk/check-in/{student_id}")
        assert response.status_code == 200
        attendance = response.json()
        assert attendance["status"] == "present"
        
        # 4. Check out student
        response = client.post(f"/api/kiosk/check-out/{student_id}")
        assert response.status_code == 200
        attendance = response.json()
        assert attendance["check_out_time"] is not None
        
        # 5. View daily attendance
        response = client.get(f"/api/manager/daily-attendance/{date.today()}")
        assert response.status_code == 200
        daily_attendance = response.json()
        assert any(record["student_id"] == student_id for record in daily_attendance)
        
        # 6. Update student
        update_data = {
            **student_data,
            "first_name": "Updated"
        }
        response = client.put(f"/api/students/{student_id}", json=update_data)
        assert response.status_code == 200
        updated_student = response.json()
        assert updated_student["first_name"] == "Updated"
        
        # 7. Delete student
        response = client.delete(f"/api/students/{student_id}")
        assert response.status_code == 200


class TestAttendanceWorkflow:
    def test_daily_attendance_workflow(self, client, sample_student):
        """Test complete daily attendance workflow."""
        student_id = sample_student.id
        today = date.today()
        
        # 1. Check initial status (should be not_reported)
        response = client.get(f"/api/manager/daily-attendance/{today}")
        assert response.status_code == 200
        daily_attendance = response.json()
        student_record = next((r for r in daily_attendance if r["student_id"] == student_id), None)
        if student_record:
            assert student_record["attendance"]["status"] == "not_reported"
        
        # 2. Student checks in
        response = client.post(f"/api/kiosk/check-in/{student_id}")
        assert response.status_code == 200
        attendance = response.json()
        assert attendance["status"] == "present"
        attendance_id = attendance["id"]
        
        # 3. Verify attendance updated
        response = client.get(f"/api/manager/daily-attendance/{today}")
        assert response.status_code == 200
        daily_attendance = response.json()
        student_record = next(r for r in daily_attendance if r["student_id"] == student_id)
        assert student_record["attendance"]["status"] == "present"
        
        # 4. Manager updates attendance status
        update_data = {
            "status": "present",
            "sub_status": "late",
            "check_in_time": datetime.now().isoformat(),
            "override_locked": False
        }
        response = client.put(f"/api/attendance/{attendance_id}", json=update_data)
        assert response.status_code == 200
        
        # 5. Student checks out
        response = client.post(f"/api/kiosk/check-out/{student_id}")
        assert response.status_code == 200
        
        # 6. Export daily report
        response = client.get(f"/api/manager/export-csv/{today}")
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"


class TestClaimsWorkflow:
    def test_claims_management_workflow(self, client, sample_student, sample_settings):
        """Test claims management workflow."""
        student_id = sample_student.id
        
        # 1. Create multiple late attendances to trigger claim
        for i in range(6):  # More than threshold (5)
            attendance_date = date.today() - timedelta(days=i)
            attendance_data = {
                "student_id": student_id,
                "date": str(attendance_date),
                "status": "present",
                "sub_status": "late",
                "check_in_time": datetime.now().isoformat()
            }
            response = client.post("/api/attendance", json=attendance_data)
            assert response.status_code == 200
        
        # 2. Check if claim was created (this would normally be done by scheduler)
        # For testing, we'll create a claim manually
        claim_data = {
            "student_id": student_id,
            "date_opened": str(date.today()),
            "reason": "late_threshold",
            "status": "open",
            "notified_to": ["parent", "court_chair"]
        }
        response = client.post("/api/claims", json=claim_data)
        assert response.status_code == 200
        claim = response.json()
        claim_id = claim["id"]
        
        # 3. View claims summary
        response = client.get("/api/manager/claims-summary")
        assert response.status_code == 200
        claims_summary = response.json()
        assert len(claims_summary) >= 1
        
        # 4. Get all claims
        response = client.get("/api/claims")
        assert response.status_code == 200
        claims = response.json()
        assert any(c["id"] == claim_id for c in claims)
        
        # 5. Update claim status
        update_data = {
            "student_id": student_id,
            "date_opened": str(date.today()),
            "reason": "late_threshold",
            "status": "resolved",
            "notified_to": ["parent", "court_chair"]
        }
        response = client.put(f"/api/claims/{claim_id}", json=update_data)
        assert response.status_code == 200
        
        # 6. Verify claim status updated
        response = client.get(f"/api/claims/{claim_id}")
        assert response.status_code == 200
        updated_claim = response.json()
        assert updated_claim["status"] == "resolved"


class TestPermanentAbsenceWorkflow:
    def test_permanent_absence_workflow(self, client, sample_student):
        """Test permanent absence management workflow."""
        student_id = sample_student.id
        
        # 1. Create permanent absence
        absence_data = {
            "student_id": student_id,
            "weekday": "monday",
            "reason": "Medical treatment"
        }
        response = client.post("/api/permanent-absences", json=absence_data)
        assert response.status_code == 200
        absence = response.json()
        absence_id = absence["id"]
        
        # 2. Get all permanent absences
        response = client.get("/api/permanent-absences")
        assert response.status_code == 200
        absences = response.json()
        assert any(a["id"] == absence_id for a in absences)
        
        # 3. Get permanent absences for specific student
        response = client.get(f"/api/permanent-absences/student/{student_id}")
        assert response.status_code == 200
        student_absences = response.json()
        assert len(student_absences) >= 1
        
        # 4. Update permanent absence
        update_data = {
            "student_id": student_id,
            "weekday": "tuesday",
            "reason": "Updated medical treatment"
        }
        response = client.put(f"/api/permanent-absences/{absence_id}", json=update_data)
        assert response.status_code == 200
        
        # 5. Verify update
        response = client.get(f"/api/permanent-absences/{absence_id}")
        assert response.status_code == 200
        updated_absence = response.json()
        assert updated_absence["weekday"] == "tuesday"
        assert updated_absence["reason"] == "Updated medical treatment"
        
        # 6. Delete permanent absence
        response = client.delete(f"/api/permanent-absences/{absence_id}")
        assert response.status_code == 200


class TestSettingsWorkflow:
    def test_settings_management_workflow(self, client):
        """Test settings management workflow."""
        # 1. Get current settings
        response = client.get("/api/settings")
        if response.status_code == 404:
            # Create initial settings if they don't exist
            initial_settings = {
                "lateness_threshold_per_month_default": 5,
                "max_yom_lo_ba_li_per_month_default": 2,
                "court_chair_name": "Test Chair",
                "court_chair_phone": "050-1234567"
            }
            response = client.put("/api/settings", json=initial_settings)
            assert response.status_code == 200
        
        # 2. Update settings
        update_data = {
            "lateness_threshold_per_month_default": 8,
            "max_yom_lo_ba_li_per_month_default": 4,
            "court_chair_name": "Updated Chair",
            "court_chair_phone": "050-9876543"
        }
        response = client.put("/api/settings", json=update_data)
        assert response.status_code == 200
        
        # 3. Verify settings updated
        response = client.get("/api/settings")
        assert response.status_code == 200
        settings = response.json()
        assert settings["lateness_threshold_per_month_default"] == 8
        assert settings["max_yom_lo_ba_li_per_month_default"] == 4
        assert settings["court_chair_name"] == "Updated Chair"