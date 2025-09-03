import pytest
from unittest.mock import AsyncMock, MagicMock
from app.automation import AttendanceAutomation
from app.models import *
from datetime import date, time, datetime

@pytest.fixture
def automation():
    return AttendanceAutomation()

@pytest.mark.asyncio
async def test_is_school_day_weekend(automation):
    # Mock session
    automation.session = AsyncMock()
    
    # Test Saturday (weekday = 5)
    saturday = date(2024, 1, 6)  # A Saturday
    result = await automation.is_school_day(saturday)
    assert result == False

@pytest.mark.asyncio
async def test_is_school_day_holiday(automation):
    # Mock session and holiday check
    mock_session = AsyncMock()
    automation.session = mock_session
    
    # Mock holiday exists
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = SchoolHoliday(date=date.today(), description="Test Holiday")
    mock_session.execute.return_value = mock_result
    
    result = await automation.is_school_day(date.today())
    assert result == False

@pytest.mark.asyncio
async def test_is_school_day_regular(automation):
    # Mock session and no holiday
    mock_session = AsyncMock()
    automation.session = mock_session
    
    # Mock no holiday
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result
    
    # Test Monday (weekday = 0)
    monday = date(2024, 1, 1)  # A Monday
    result = await automation.is_school_day(monday)
    assert result == True

@pytest.mark.asyncio
async def test_process_permanent_absences(automation):
    # Mock session
    mock_session = AsyncMock()
    automation.session = mock_session
    automation.is_school_day = AsyncMock(return_value=True)
    
    # Mock permanent absence
    mock_absence = PermanentAbsence(
        student_id=1,
        weekday=Weekday.MONDAY,
        reason="Medical"
    )
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_absence]
    mock_session.execute.return_value = mock_result
    
    # Mock no existing attendance
    mock_attendance_result = MagicMock()
    mock_attendance_result.scalar_one_or_none.return_value = None
    mock_session.execute.side_effect = [mock_result, mock_attendance_result]
    
    monday = date(2024, 1, 1)  # A Monday
    await automation.process_permanent_absences(monday)
    
    # Verify attendance was added
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()

def test_attendance_status_enum():
    assert AttendanceStatus.NOT_REPORTED.value == "לא דיווח"
    assert AttendanceStatus.PRESENT.value == "נוכח"
    assert AttendanceStatus.YOM_LO_BA_LI.value == "יום לא בא לי"

def test_school_level_enum():
    assert SchoolLevel.ELEMENTARY.value == "יסודי"
    assert SchoolLevel.HIGH_SCHOOL.value == "תיכון"