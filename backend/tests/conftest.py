import pytest
from unittest.mock import Mock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import (
    Student, Attendance, PermanentAbsence, SchoolHoliday, 
    Settings, StudentMonthlyOverride, Claim, AuditLog
)

@pytest.fixture(scope="session")
def engine():
    """Create a test database engine"""
    engine = create_engine(
        "sqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    return engine

@pytest.fixture(scope="function")
def db_session(engine):
    """Create a new database session for each test"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    
    yield session
    
    session.close()

@pytest.fixture
def sample_student():
    """Create a sample student for testing"""
    return Student(
        id=1,
        student_number="12345",
        nickname="test_user",
        first_name="Test",
        last_name="Student",
        phone_number="+972501234567",
        school_level="יסודי",
        activity_status="פעיל"
    )

@pytest.fixture
def sample_students():
    """Create multiple sample students for testing"""
    return [
        Student(
            id=1,
            student_number="12345",
            nickname="user1",
            first_name="Test",
            last_name="Student1",
            phone_number="+972501234567",
            school_level="יסודי",
            activity_status="פעיל"
        ),
        Student(
            id=2,
            student_number="12346",
            nickname="user2",
            first_name="Test",
            last_name="Student2",
            phone_number="+972501234568",
            school_level="תיכון",
            activity_status="פעיל"
        ),
        Student(
            id=3,
            student_number="12347",
            nickname="user3",
            first_name="Test",
            last_name="Student3",
            phone_number="+972501234569",
            school_level="יסודי",
            activity_status="לא פעיל"
        )
    ]

@pytest.fixture
def sample_attendance():
    """Create a sample attendance record for testing"""
    from datetime import date
    from app.models import AttendanceStatus, SubStatus, ReportedBy
    
    return Attendance(
        id=1,
        student_id=1,
        date=date.today(),
        status=AttendanceStatus.PRESENT,
        sub_status=SubStatus.NONE,
        reported_by=ReportedBy.STUDENT
    )

@pytest.fixture
def sample_attendance_records():
    """Create multiple sample attendance records for testing"""
    from datetime import date
    from app.models import AttendanceStatus, SubStatus, ReportedBy
    
    return [
        Attendance(
            id=1,
            student_id=1,
            date=date.today(),
            status=AttendanceStatus.PRESENT,
            sub_status=SubStatus.NONE,
            reported_by=ReportedBy.STUDENT
        ),
        Attendance(
            id=2,
            student_id=2,
            date=date.today(),
            status=AttendanceStatus.LATE,
            sub_status=SubStatus.LATE,
            reported_by=ReportedBy.AUTO
        ),
        Attendance(
            id=3,
            student_id=3,
            date=date.today(),
            status=AttendanceStatus.YOM_LO_BA_LI,
            sub_status=SubStatus.NONE,
            reported_by=ReportedBy.AUTO
        )
    ]

@pytest.fixture
def sample_permanent_absence():
    """Create a sample permanent absence for testing"""
    from app.models import Weekday
    
    return PermanentAbsence(
        id=1,
        student_id=1,
        weekday=Weekday.MONDAY,
        reason="Religious studies"
    )

@pytest.fixture
def sample_school_holiday():
    """Create a sample school holiday for testing"""
    from datetime import date
    
    return SchoolHoliday(
        id=1,
        date=date(2024, 1, 1),
        description="New Year"
    )

@pytest.fixture
def sample_settings():
    """Create sample system settings for testing"""
    return Settings(
        id=1,
        lateness_threshold_per_month_default=3,
        max_yom_lo_ba_li_per_month_default=2,
        court_chair_name="Judge Smith",
        court_chair_phone="+972501234570"
    )

@pytest.fixture
def sample_monthly_override():
    """Create a sample monthly override for testing"""
    return StudentMonthlyOverride(
        id=1,
        student_id=1,
        year_month="2024-01",
        lateness_threshold_override=5,
        max_yom_lo_ba_li_override=3
    )

@pytest.fixture
def sample_claim():
    """Create a sample claim for testing"""
    from datetime import date
    from app.models import ClaimReason, ClaimStatus
    
    return Claim(
        id=1,
        student_id=1,
        date_opened=date.today(),
        reason=ClaimReason.LATE_THRESHOLD,
        notified_to=["manager", "student", "court_chair"],
        status=ClaimStatus.OPEN
    )

@pytest.fixture
def sample_audit_log():
    """Create a sample audit log entry for testing"""
    from datetime import datetime
    
    return AuditLog(
        id=1,
        actor="manager",
        action="update_student",
        entity="student",
        entity_id=1,
        before='{"status": "פעיל"}',
        after='{"status": "לא פעיל"}',
        timestamp=datetime.now()
    )

@pytest.fixture
def populated_db(db_session, sample_students, sample_attendance_records, 
                sample_permanent_absence, sample_school_holiday, 
                sample_settings, sample_monthly_override, sample_claim):
    """Create a database with sample data for integration tests"""
    
    # Add students
    for student in sample_students:
        db_session.add(student)
    
    # Add attendance records
    for attendance in sample_attendance_records:
        db_session.add(attendance)
    
    # Add other entities
    db_session.add(sample_permanent_absence)
    db_session.add(sample_school_holiday)
    db_session.add(sample_settings)
    db_session.add(sample_monthly_override)
    db_session.add(sample_claim)
    
    db_session.commit()
    
    return db_session

@pytest.fixture
def mock_whatsapp_service():
    """Create a mock WhatsApp service for testing"""
    mock_service = Mock()
    mock_service.enabled = True
    mock_service.send_reminder.return_value = True
    mock_service.send_claim_notification.return_value = True
    return mock_service
