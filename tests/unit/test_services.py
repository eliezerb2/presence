import pytest
from datetime import date, datetime, timedelta
from unittest.mock import Mock, patch
from backend.app.services.automation import AutomationService
from backend.app.services.notification import NotificationService
from backend.app.models.student import Student
from backend.app.models.attendance import Attendance
from backend.app.models.permanent_absence import PermanentAbsence
from backend.app.models.school_holiday import SchoolHoliday
from backend.app.models.settings import Settings


class TestAutomationService:
    def test_is_permanent_absence_day(self, db_session, sample_student, sample_permanent_absence):
        """Test permanent absence detection."""
        service = AutomationService(db_session)
        
        # Test Sunday (permanent absence day)
        sunday_date = date(2024, 1, 7)  # A Sunday
        assert service.is_permanent_absence_day(sample_student.id, sunday_date) == True
        
        # Test Monday (not permanent absence day)
        monday_date = date(2024, 1, 8)  # A Monday
        assert service.is_permanent_absence_day(sample_student.id, monday_date) == False

    def test_is_school_holiday(self, db_session, sample_school_holiday):
        """Test school holiday detection."""
        service = AutomationService(db_session)
        
        # Test holiday date
        holiday_date = date(2024, 1, 1)
        assert service.is_school_holiday(holiday_date) == True
        
        # Test non-holiday date
        regular_date = date(2024, 1, 2)
        assert service.is_school_holiday(regular_date) == False

    def test_mark_late_arrivals(self, db_session, sample_student, sample_settings):
        """Test automatic late marking."""
        service = AutomationService(db_session)
        
        # Create attendance with late check-in
        late_time = datetime.now().replace(hour=9, minute=30)  # 9:30 AM
        attendance = Attendance(
            student_id=sample_student.id,
            date=date.today(),
            status="present",
            sub_status="none",
            check_in_time=late_time
        )
        db_session.add(attendance)
        db_session.commit()
        
        # Mark late arrivals
        service.mark_late_arrivals()
        
        # Refresh attendance
        db_session.refresh(attendance)
        assert attendance.sub_status == "late"

    def test_auto_close_day(self, db_session, sample_student, sample_settings):
        """Test automatic day closure."""
        service = AutomationService(db_session)
        
        # Create attendance without check-out
        attendance = Attendance(
            student_id=sample_student.id,
            date=date.today(),
            status="present",
            sub_status="none",
            check_in_time=datetime.now().replace(hour=8, minute=0)
        )
        db_session.add(attendance)
        db_session.commit()
        
        # Auto close day
        service.auto_close_day()
        
        # Refresh attendance
        db_session.refresh(attendance)
        assert attendance.check_out_time is not None
        assert attendance.sub_status == "auto_closed"

    @patch('backend.app.services.automation.AutomationService.send_whatsapp_reminder')
    def test_send_whatsapp_reminders(self, mock_send, db_session, sample_student, sample_settings):
        """Test WhatsApp reminder sending."""
        service = AutomationService(db_session)
        
        # Create attendance that needs reminder
        attendance = Attendance(
            student_id=sample_student.id,
            date=date.today(),
            status="not_reported",
            sub_status="none"
        )
        db_session.add(attendance)
        db_session.commit()
        
        # Send reminders
        service.send_whatsapp_reminders()
        
        # Verify reminder was sent
        mock_send.assert_called_once()


class TestNotificationService:
    @patch('requests.post')
    def test_send_whatsapp_message(self, mock_post):
        """Test WhatsApp message sending."""
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"success": True}
        
        service = NotificationService()
        result = service.send_whatsapp_message("050-1234567", "Test message")
        
        assert result == True
        mock_post.assert_called_once()

    @patch('requests.post')
    def test_send_whatsapp_message_failure(self, mock_post):
        """Test WhatsApp message sending failure."""
        mock_post.return_value.status_code = 400
        
        service = NotificationService()
        result = service.send_whatsapp_message("050-1234567", "Test message")
        
        assert result == False

    def test_format_reminder_message(self):
        """Test reminder message formatting."""
        service = NotificationService()
        
        student_name = "John Doe"
        message = service.format_reminder_message(student_name)
        
        assert student_name in message
        assert "נוכחות" in message  # Hebrew word for attendance

    def test_format_claim_notification(self):
        """Test claim notification formatting."""
        service = NotificationService()
        
        student_name = "John Doe"
        reason = "late_threshold"
        message = service.format_claim_notification(student_name, reason)
        
        assert student_name in message
        assert "תביעה" in message  # Hebrew word for claim