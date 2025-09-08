import pytest
from datetime import date, datetime
from backend.app.models.student import Student
from backend.app.models.attendance import Attendance
from backend.app.models.permanent_absence import PermanentAbsence
from backend.app.models.school_holiday import SchoolHoliday
from backend.app.models.settings import Settings
from backend.app.models.claim import Claim


class TestStudentModel:
    def test_create_student(self, db_session):
        """Test creating a student."""
        student = Student(
            student_number="12345",
            nickname="Test",
            first_name="John",
            last_name="Doe",
            phone_number="050-1234567",
            school_level="elementary",
            activity_status="active"
        )
        db_session.add(student)
        db_session.commit()
        
        assert student.id is not None
        assert student.student_number == "12345"
        assert student.first_name == "John"
        assert student.last_name == "Doe"

    def test_student_unique_constraint(self, db_session):
        """Test that student number must be unique."""
        student1 = Student(
            student_number="12345",
            first_name="John",
            last_name="Doe",
            school_level="elementary",
            activity_status="active"
        )
        student2 = Student(
            student_number="12345",
            first_name="Jane",
            last_name="Smith",
            school_level="elementary",
            activity_status="active"
        )
        
        db_session.add(student1)
        db_session.commit()
        
        db_session.add(student2)
        with pytest.raises(Exception):  # Should raise integrity error
            db_session.commit()


class TestAttendanceModel:
    def test_create_attendance(self, db_session, sample_student):
        """Test creating an attendance record."""
        attendance = Attendance(
            student_id=sample_student.id,
            date=date.today(),
            status="present",
            sub_status="none",
            check_in_time=datetime.now(),
            override_locked=False
        )
        db_session.add(attendance)
        db_session.commit()
        
        assert attendance.id is not None
        assert attendance.student_id == sample_student.id
        assert attendance.status == "present"

    def test_attendance_unique_constraint(self, db_session, sample_student):
        """Test that student can have only one attendance per date."""
        attendance1 = Attendance(
            student_id=sample_student.id,
            date=date.today(),
            status="present",
            sub_status="none"
        )
        attendance2 = Attendance(
            student_id=sample_student.id,
            date=date.today(),
            status="absent",
            sub_status="none"
        )
        
        db_session.add(attendance1)
        db_session.commit()
        
        db_session.add(attendance2)
        with pytest.raises(Exception):  # Should raise integrity error
            db_session.commit()


class TestPermanentAbsenceModel:
    def test_create_permanent_absence(self, db_session, sample_student):
        """Test creating a permanent absence."""
        absence = PermanentAbsence(
            student_id=sample_student.id,
            weekday="sunday",
            reason="Medical appointment"
        )
        db_session.add(absence)
        db_session.commit()
        
        assert absence.id is not None
        assert absence.student_id == sample_student.id
        assert absence.weekday == "sunday"
        assert absence.reason == "Medical appointment"


class TestSchoolHolidayModel:
    def test_create_school_holiday(self, db_session):
        """Test creating a school holiday."""
        holiday = SchoolHoliday(
            date=date(2024, 1, 1),
            description="New Year"
        )
        db_session.add(holiday)
        db_session.commit()
        
        assert holiday.id is not None
        assert holiday.date == date(2024, 1, 1)
        assert holiday.description == "New Year"


class TestSettingsModel:
    def test_create_settings(self, db_session):
        """Test creating settings."""
        settings = Settings(
            lateness_threshold_per_month_default=5,
            max_yom_lo_ba_li_per_month_default=2,
            court_chair_name="Test Chair",
            court_chair_phone="050-9876543"
        )
        db_session.add(settings)
        db_session.commit()
        
        assert settings.id is not None
        assert settings.lateness_threshold_per_month_default == 5
        assert settings.max_yom_lo_ba_li_per_month_default == 2


class TestClaimModel:
    def test_create_claim(self, db_session, sample_student):
        """Test creating a claim."""
        claim = Claim(
            student_id=sample_student.id,
            date_opened=date.today(),
            reason="late_threshold",
            status="open",
            notified_to=["parent", "court_chair"]
        )
        db_session.add(claim)
        db_session.commit()
        
        assert claim.id is not None
        assert claim.student_id == sample_student.id
        assert claim.reason == "late_threshold"
        assert claim.status == "open"
        assert "parent" in claim.notified_to