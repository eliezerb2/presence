from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from .models import (
    SchoolLevel, ActivityStatus, AttendanceStatus, SubStatus, 
    ReportedBy, ClosedReason, Weekday, ClaimReason, ClaimStatus
)

# Base schemas
class StudentBase(BaseModel):
    student_number: str
    nickname: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    school_level: SchoolLevel
    activity_status: ActivityStatus = ActivityStatus.ACTIVE

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    nickname: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    school_level: Optional[SchoolLevel] = None
    activity_status: Optional[ActivityStatus] = None

class Student(StudentBase):
    id: int
    
    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    student_id: int
    date: date
    status: AttendanceStatus = AttendanceStatus.NOT_REPORTED
    sub_status: SubStatus = SubStatus.NONE
    reported_by: ReportedBy = ReportedBy.STUDENT
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    closed_reason: ClosedReason = ClosedReason.NA
    override_locked: bool = False
    override_locked_at: Optional[datetime] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    sub_status: Optional[SubStatus] = None
    reported_by: Optional[ReportedBy] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    closed_reason: Optional[ClosedReason] = None
    override_locked: Optional[bool] = None
    override_locked_at: Optional[datetime] = None

class Attendance(AttendanceBase):
    id: int
    student: Student
    
    class Config:
        from_attributes = True

class PermanentAbsenceBase(BaseModel):
    student_id: int
    weekday: Weekday
    reason: Optional[str] = None

class PermanentAbsenceCreate(PermanentAbsenceBase):
    pass

class PermanentAbsenceUpdate(BaseModel):
    weekday: Optional[Weekday] = None
    reason: Optional[str] = None

class PermanentAbsence(PermanentAbsenceBase):
    id: int
    student: Student
    
    class Config:
        from_attributes = True

class SchoolHolidayBase(BaseModel):
    date: date
    description: str

class SchoolHolidayCreate(SchoolHolidayBase):
    pass

class SchoolHolidayUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None

class SchoolHoliday(SchoolHolidayBase):
    id: int
    
    class Config:
        from_attributes = True

class SettingsBase(BaseModel):
    lateness_threshold_per_month_default: int = 3
    max_yom_lo_ba_li_per_month_default: int = 2
    court_chair_name: Optional[str] = None
    court_chair_phone: Optional[str] = None

class SettingsUpdate(BaseModel):
    lateness_threshold_per_month_default: Optional[int] = None
    max_yom_lo_ba_li_per_month_default: Optional[int] = None
    court_chair_name: Optional[str] = None
    court_chair_phone: Optional[str] = None

class Settings(SettingsBase):
    id: int
    
    class Config:
        from_attributes = True

class StudentMonthlyOverrideBase(BaseModel):
    student_id: int
    year_month: str  # Format: YYYY-MM
    lateness_threshold_override: Optional[int] = None
    max_yom_lo_ba_li_override: Optional[int] = None

class StudentMonthlyOverrideCreate(StudentMonthlyOverrideBase):
    pass

class StudentMonthlyOverrideUpdate(BaseModel):
    lateness_threshold_override: Optional[int] = None
    max_yom_lo_ba_li_override: Optional[int] = None

class StudentMonthlyOverride(StudentMonthlyOverrideBase):
    id: int
    student: Student
    
    class Config:
        from_attributes = True

class ClaimBase(BaseModel):
    student_id: int
    reason: ClaimReason
    notified_to: List[str] = []
    status: ClaimStatus = ClaimStatus.OPEN

class ClaimCreate(ClaimBase):
    pass

class ClaimUpdate(BaseModel):
    reason: Optional[ClaimReason] = None
    notified_to: Optional[List[str]] = None
    status: Optional[ClaimStatus] = None

class Claim(ClaimBase):
    id: int
    date_opened: date
    student: Student
    
    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    actor: str
    action: str
    entity: str
    entity_id: int
    before: Optional[str] = None
    after: Optional[str] = None

class AuditLog(AuditLogBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Special schemas for kiosk
class StudentSearch(BaseModel):
    query: str = Field(..., min_length=1, description="Search by student number, nickname, first name, or last name")

class StudentSearchResult(BaseModel):
    id: int
    student_number: str
    nickname: str
    first_name: str
    last_name: str
    school_level: SchoolLevel

class AttendanceAction(BaseModel):
    action: str = Field(..., pattern="^(check_in|check_out)$")
    student_id: int

# Dashboard schemas
class DailyAttendanceSummary(BaseModel):
    date: date
    total_students: int
    present: int
    absent: int
    late: int
    left: int
    yom_lo_ba_li: int
    not_reported: int

class MonthlyStatistics(BaseModel):
    year_month: str
    student_id: int
    student_name: str
    late_count: int
    yom_lo_ba_li_count: int
    threshold_late: int
    threshold_yom_lo_ba_li: int
    over_threshold: bool

# Response schemas
class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
