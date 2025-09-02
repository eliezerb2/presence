import pytest
from datetime import date, datetime
from sqlalchemy.orm import Session

from app.services.attendance_service import AttendanceService
from app.services.student_service import StudentService
from app.services.claims_service import ClaimsService
from app.services.whatsapp_service import WhatsAppService
from app.schemas import (
    StudentCreate, AttendanceCreate, PermanentAbsenceCreate,
    SchoolHolidayCreate, SettingsUpdate
)
from app.models import (
    SchoolLevel, ActivityStatus, AttendanceStatus, SubStatus,
    ReportedBy, Weekday, ClaimReason
)

class TestSystemIntegration:
    """Integration tests for the complete system"""
    
    def test_complete_student_workflow(self, populated_db, sample_student):
        """Test complete student workflow from creation to attendance"""
        student_service = StudentService(populated_db)
        attendance_service = AttendanceService(populated_db)
        
        # Create a new student
        new_student_data = StudentCreate(
            student_number="99999",
            nickname="new_user",
            first_name="New",
            last_name="Student",
            phone_number="+972501234571",
            school_level=SchoolLevel.ELEMENTARY,
            activity_status=ActivityStatus.ACTIVE
        )
        
        new_student = student_service.create_student(new_student_data)
        assert new_student.id is not None
        assert new_student.student_number == "99999"
        
        # Create attendance record
        today = date.today()
        attendance_data = AttendanceCreate(
            student_id=new_student.id,
            date=today,
            status=AttendanceStatus.PRESENT,
            sub_status=SubStatus.NONE,
            reported_by=ReportedBy.STUDENT
        )
        
        attendance = attendance_service.create_attendance(attendance_data)
        assert attendance.id is not None
        assert attendance.student_id == new_student.id
        assert attendance.status == AttendanceStatus.PRESENT
        
        # Verify student can be found
        found_student = student_service.get_student(new_student.id)
        assert found_student is not None
        assert found_student.first_name == "New"
        
        # Verify attendance record exists
        found_attendance = attendance_service.get_attendance_by_student_date(
            new_student.id, today
        )
        assert found_attendance is not None
        assert found_attendance.status == AttendanceStatus.PRESENT
    
    def test_attendance_automation_workflow(self, populated_db):
        """Test the complete attendance automation workflow"""
        attendance_service = AttendanceService(populated_db)
        today = date.today()
        
        # Process permanent absences
        permanent_absences = attendance_service.process_permanent_absences(today)
        assert isinstance(permanent_absences, list)
        
        # Process late attendance (if after 10:00)
        late_attendance = attendance_service.process_late_attendance(today)
        assert isinstance(late_attendance, list)
        
        # Process yom lo ba li (if after 10:30)
        yom_lo_ba_li = attendance_service.process_yom_lo_bi(today)
        assert isinstance(yom_lo_ba_li, list)
        
        # Process end of day (if after 16:00)
        end_of_day = attendance_service.process_end_of_day(today)
        assert isinstance(end_of_day, list)
        
        # Get daily summary
        summary = attendance_service.get_daily_summary(today)
        assert summary["date"] == today
        assert summary["total_students"] >= 0
    
    def test_claims_workflow(self, populated_db):
        """Test the complete claims workflow"""
        claims_service = ClaimsService(populated_db)
        
        # Calculate monthly statistics
        current_month = datetime.now().strftime("%Y-%m")
        statistics = claims_service.calculate_monthly_statistics(current_month)
        assert isinstance(statistics, list)
        
        # Process monthly claims
        claims = claims_service.process_monthly_claims(current_month)
        assert isinstance(claims, list)
        
        # Get claims summary
        summary = claims_service.get_claims_summary()
        assert "total" in summary
        assert "open" in summary
        assert "closed" in summary
    
    def test_whatsapp_integration(self, populated_db, mock_whatsapp_service):
        """Test WhatsApp service integration"""
        whatsapp_service = WhatsAppService(populated_db)
        today = date.today()
        
        # Get students for reminders
        students = whatsapp_service.get_students_for_reminder(today)
        assert isinstance(students, list)
        
        # Test sending reminders
        if students:
            result = whatsapp_service.send_bulk_reminders(students, today)
            assert "sent" in result
            assert "failed" in result
            assert "total" in result
    
    def test_data_consistency(self, populated_db):
        """Test data consistency across the system"""
        student_service = StudentService(populated_db)
        attendance_service = AttendanceService(populated_db)
        
        # Get all active students
        active_students = student_service.get_all_students(active_only=True)
        assert len(active_students) > 0
        
        # Verify each student has proper data
        for student in active_students:
            assert student.student_number is not None
            assert student.nickname is not None
            assert student.first_name is not None
            assert student.last_name is not None
            assert student.school_level in [SchoolLevel.ELEMENTARY, SchoolLevel.HIGH_SCHOOL]
            assert student.activity_status in [ActivityStatus.ACTIVE, ActivityStatus.INACTIVE, ActivityStatus.SUSPENDED]
            
            # Check attendance history
            attendance_history = student_service.get_student_attendance_history(student.id)
            assert isinstance(attendance_history, list)
            
            # Check permanent absences
            permanent_absences = student_service.get_student_permanent_absences(student.id)
            assert isinstance(permanent_absences, list)
    
    def test_audit_logging(self, populated_db):
        """Test that all operations are properly audited"""
        from app.services.audit_service import AuditService
        
        audit_service = AuditService(populated_db)
        
        # Get audit logs
        logs = audit_service.get_audit_logs(limit=100)
        assert isinstance(logs, list)
        
        # Verify audit logs contain expected information
        if logs:
            for log in logs:
                assert log.actor is not None
                assert log.action is not None
                assert log.entity is not None
                assert log.entity_id is not None
                assert log.timestamp is not None
    
    def test_error_handling(self, populated_db):
        """Test error handling in the system"""
        student_service = StudentService(populated_db)
        attendance_service = AttendanceService(populated_db)
        
        # Test with invalid student ID
        invalid_student = student_service.get_student(99999)
        assert invalid_student is None
        
        # Test with invalid attendance ID
        invalid_attendance = attendance_service.get_attendance_by_student_date(99999, date.today())
        assert invalid_attendance is None
        
        # Test with invalid date
        invalid_date = date(1900, 1, 1)
        attendance_records = attendance_service.get_daily_attendance(invalid_date)
        assert isinstance(attendance_records, list)
        assert len(attendance_records) == 0
    
    def test_performance_metrics(self, populated_db):
        """Test system performance metrics"""
        student_service = StudentService(populated_db)
        attendance_service = AttendanceService(populated_db)
        claims_service = ClaimsService(populated_db)
        
        # Count students by school level
        student_counts = student_service.count_students_by_school_level()
        assert "elementary" in student_counts
        assert "high_school" in student_counts
        assert "total" in student_counts
        assert student_counts["total"] == student_counts["elementary"] + student_counts["high_school"]
        
        # Get claims summary
        claims_summary = claims_service.get_claims_summary()
        assert "total" in claims_summary
        assert "open" in claims_summary
        assert "closed" in claims_summary
        assert claims_summary["total"] == claims_summary["open"] + claims_summary["closed"]
    
    def test_weekend_and_holiday_handling(self, populated_db):
        """Test weekend and holiday handling"""
        attendance_service = AttendanceService(populated_db)
        
        # Test weekend (Saturday)
        weekend_date = date(2024, 1, 6)  # Saturday
        is_weekend = attendance_service.is_school_day(weekend_date)
        assert is_weekend == False
        
        # Test holiday
        holiday_date = date(2024, 1, 1)  # New Year
        is_holiday = attendance_service.is_school_day(holiday_date)
        assert is_holiday == False
        
        # Test normal weekday
        normal_date = date(2024, 1, 2)  # Tuesday
        is_normal = attendance_service.is_school_day(normal_date)
        assert is_normal == True
    
    def test_override_functionality(self, populated_db):
        """Test manager override functionality"""
        attendance_service = AttendanceService(populated_db)
        
        # Get today's attendance
        today = date.today()
        attendance_records = attendance_service.get_daily_attendance(today)
        
        if attendance_records:
            # Test override on first attendance record
            attendance = attendance_records[0]
            
            from app.schemas import AttendanceUpdate
            update_data = AttendanceUpdate(
                status=AttendanceStatus.PRESENT,
                sub_status=SubStatus.LATE,
                reported_by=ReportedBy.MANAGER
            )
            
            updated = attendance_service.update_attendance(
                attendance.id, update_data, "manager"
            )
            
            assert updated is not None
            assert updated.override_locked == True
            assert updated.override_locked_at is not None
            assert updated.status == AttendanceStatus.PRESENT
            assert updated.sub_status == SubStatus.LATE
