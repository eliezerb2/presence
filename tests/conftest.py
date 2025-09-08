import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import get_db, Base
from backend.app.models.student import Student
from backend.app.models.attendance import Attendance
from backend.app.models.permanent_absence import PermanentAbsence
from backend.app.models.school_holiday import SchoolHoliday
from backend.app.models.settings import Settings
from backend.app.models.claim import Claim

# Test database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_student(db_session):
    """Create a sample student for testing."""
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
    db_session.refresh(student)
    return student


@pytest.fixture
def sample_settings(db_session):
    """Create sample settings for testing."""
    settings = Settings(
        lateness_threshold_per_month_default=5,
        max_yom_lo_ba_li_per_month_default=2,
        court_chair_name="Test Chair",
        court_chair_phone="050-9876543"
    )
    db_session.add(settings)
    db_session.commit()
    db_session.refresh(settings)
    return settings


@pytest.fixture
def sample_permanent_absence(db_session, sample_student):
    """Create a sample permanent absence for testing."""
    absence = PermanentAbsence(
        student_id=sample_student.id,
        weekday="sunday",
        reason="Medical appointment"
    )
    db_session.add(absence)
    db_session.commit()
    db_session.refresh(absence)
    return absence


@pytest.fixture
def sample_school_holiday(db_session):
    """Create a sample school holiday for testing."""
    holiday = SchoolHoliday(
        date="2024-01-01",
        description="New Year"
    )
    db_session.add(holiday)
    db_session.commit()
    db_session.refresh(holiday)
    return holiday