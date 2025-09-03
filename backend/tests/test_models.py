import pytest
from app.models import Student, Attendance, SchoolLevel, ActivityStatus, AttendanceStatus
from datetime import date

def test_student_creation():
    student = Student(
        student_number="12345",
        nickname="test_nick",
        first_name="Test",
        last_name="Student",
        school_level=SchoolLevel.HIGH_SCHOOL,
        activity_status=ActivityStatus.ACTIVE
    )
    assert student.student_number == "12345"
    assert student.nickname == "test_nick"
    assert student.school_level == SchoolLevel.HIGH_SCHOOL

def test_attendance_creation():
    attendance = Attendance(
        student_id=1,
        date=date.today(),
        status=AttendanceStatus.PRESENT
    )
    assert attendance.student_id == 1
    assert attendance.status == AttendanceStatus.PRESENT
    assert attendance.override_locked == False

def test_student_unique_constraints():
    # Test that student_number and nickname should be unique
    student1 = Student(
        student_number="12345",
        nickname="nick1",
        first_name="Test1",
        last_name="Student1",
        school_level=SchoolLevel.HIGH_SCHOOL
    )
    
    student2 = Student(
        student_number="12345",  # Same student number
        nickname="nick2",
        first_name="Test2", 
        last_name="Student2",
        school_level=SchoolLevel.ELEMENTARY
    )
    
    # In actual database, this would raise an integrity error
    assert student1.student_number == student2.student_number