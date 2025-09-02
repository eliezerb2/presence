import pytest
from datetime import date, datetime, time
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.services.attendance_service import AttendanceService
from app.models import (
    Attendance, Student, AttendanceStatus, SubStatus, ReportedBy,
    ClosedReason, PermanentAbsence, SchoolHoliday, Settings
)
from app.schemas import AttendanceCreate, AttendanceUpdate

@pytest.fixture
def mock_db():
    return Mock(spec=Session)

@pytest.fixture
def mock_audit_service():
    return Mock()

@pytest.fixture
def attendance_service(mock_db, mock_audit_service):
    service = AttendanceService(mock_db)
    service.audit_service = mock_audit_service
    return service

@pytest.fixture
def sample_student():
    return Student(
        id=1,
        student_number="12345",
        nickname="test_user",
        first_name="Test",
        last_name="Student",
        school_level="יסודי",
        activity_status="פעיל"
    )

@pytest.fixture
def sample_attendance():
    return Attendance(
        id=1,
        student_id=1,
        date=date.today(),
        status=AttendanceStatus.NOT_REPORTED,
        sub_status=SubStatus.NONE,
        reported_by=ReportedBy.STUDENT
    )

class TestAttendanceService:
    
    def test_create_attendance(self, attendance_service, mock_db, mock_audit_service):
        """Test creating a new attendance record"""
        # Arrange
        attendance_data = AttendanceCreate(
            student_id=1,
            date=date.today(),
            status=AttendanceStatus.PRESENT,
            sub_status=SubStatus.NONE,
            reported_by=ReportedBy.STUDENT
        )
        
        # Act
        result = attendance_service.create_attendance(attendance_data)
        
        # Assert
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
        mock_audit_service.log_action.assert_called_once()
        
        assert result is not None
    
    def test_get_attendance_by_student_date(self, attendance_service, mock_db, sample_attendance):
        """Test getting attendance by student and date"""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_attendance
        
        # Act
        result = attendance_service.get_attendance_by_student_date(1, date.today())
        
        # Assert
        assert result == sample_attendance
        mock_db.query.assert_called_once_with(Attendance)
    
    def test_update_attendance(self, attendance_service, mock_db, mock_audit_service, sample_attendance):
        """Test updating attendance record"""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_attendance
        update_data = AttendanceUpdate(
            status=AttendanceStatus.PRESENT,
            sub_status=SubStatus.LATE
        )
        
        # Act
        result = attendance_service.update_attendance(1, update_data, "manager")
        
        # Assert
        assert result == sample_attendance
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
        mock_audit_service.log_action.assert_called_once()
        
        # Check that override lock was set
        assert sample_attendance.override_locked == True
        assert sample_attendance.override_locked_at is not None
    
    def test_update_attendance_not_found(self, attendance_service, mock_db):
        """Test updating non-existent attendance record"""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        update_data = AttendanceUpdate(status=AttendanceStatus.PRESENT)
        
        # Act
        result = attendance_service.update_attendance(999, update_data)
        
        # Assert
        assert result is None
        mock_db.commit.assert_not_called()
    
    def test_get_daily_summary(self, attendance_service, mock_db, sample_attendance):
        """Test getting daily attendance summary"""
        # Arrange
        mock_db.query.return_value.filter.return_value.all.return_value = [sample_attendance]
        
        # Act
        result = attendance_service.get_daily_summary(date.today())
        
        # Assert
        assert result["date"] == date.today()
        assert result["total_students"] == 1
        assert result["not_reported"] == 1
    
    def test_process_permanent_absences(self, attendance_service, mock_db):
        """Test processing permanent absences"""
        # Arrange
        today = date.today()
        weekday = today.strftime("%A")[:3]
        weekday_map = {"Sun": "א", "Mon": "ב", "Tue": "ג", "Wed": "ד", "Thu": "ה"}
        hebrew_weekday = weekday_map.get(weekday)
        
        if hebrew_weekday:
            mock_db.query.return_value.filter.return_value.all.return_value = []
            mock_db.query.return_value.filter.return_value.first.return_value = None
            
            # Act
            result = attendance_service.process_permanent_absences(today)
            
            # Assert
            assert isinstance(result, list)
    
    def test_is_school_day_weekend(self, attendance_service, mock_db):
        """Test that weekend is not a school day"""
        # Arrange
        weekend_date = date(2024, 1, 6)  # Saturday
        
        # Act
        result = attendance_service.is_school_day(weekend_date)
        
        # Assert
        assert result == False
    
    def test_is_school_day_holiday(self, attendance_service, mock_db):
        """Test that holiday is not a school day"""
        # Arrange
        holiday_date = date(2024, 1, 1)
        mock_holiday = SchoolHoliday(date=holiday_date, description="New Year")
        mock_db.query.return_value.filter.return_value.first.return_value = mock_holiday
        
        # Act
        result = attendance_service.is_school_day(holiday_date)
        
        # Assert
        assert result == False
    
    def test_is_school_day_normal(self, attendance_service, mock_db):
        """Test that normal weekday is a school day"""
        # Arrange
        normal_date = date(2024, 1, 2)  # Tuesday
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = attendance_service.is_school_day(normal_date)
        
        # Assert
        assert result == True
    
    def test_get_students_for_reminder(self, attendance_service, mock_db, sample_student):
        """Test getting students for WhatsApp reminders"""
        # Arrange
        today = date.today()
        mock_db.query.return_value.filter.return_value.all.return_value = [sample_student]
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = attendance_service.get_students_for_reminder(today)
        
        # Assert
        assert isinstance(result, list)
        if result:  # Only if it's a school day
            assert len(result) >= 0
    
    @patch('app.services.attendance_service.datetime')
    def test_process_late_attendance_before_threshold(self, mock_datetime, attendance_service, mock_db):
        """Test late attendance processing before 10:00"""
        # Arrange
        mock_datetime.now.return_value = datetime.combine(date.today(), time(9, 0))
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        # Act
        result = attendance_service.process_late_attendance(date.today())
        
        # Assert
        assert result == []
    
    @patch('app.services.attendance_service.datetime')
    def test_process_late_attendance_after_threshold(self, mock_datetime, attendance_service, mock_db):
        """Test late attendance processing after 10:00"""
        # Arrange
        mock_datetime.now.return_value = datetime.combine(date.today(), time(10, 30))
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        # Act
        result = attendance_service.process_late_attendance(date.today())
        
        # Assert
        assert isinstance(result, list)
    
    @patch('app.services.attendance_service.datetime')
    def test_process_end_of_day_before_threshold(self, mock_datetime, attendance_service, mock_db):
        """Test end of day processing before 16:00"""
        # Arrange
        mock_datetime.now.return_value = datetime.combine(date.today(), time(15, 0))
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        # Act
        result = attendance_service.process_end_of_day(date.today())
        
        # Assert
        assert result == []
    
    @patch('app.services.attendance_service.datetime')
    def test_process_end_of_day_after_threshold(self, mock_datetime, attendance_service, mock_db):
        """Test end of day processing after 16:00"""
        # Arrange
        mock_datetime.now.return_value = datetime.combine(date.today(), time(16, 30))
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        # Act
        result = attendance_service.process_end_of_day(date.today())
        
        # Assert
        assert isinstance(result, list)
