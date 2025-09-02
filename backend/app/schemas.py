from pydantic import BaseModel
from typing import List, Optional
from datetime import date, time, datetime
from .models import (
    SchoolLevel,
    ActivityStatus,
    AttendanceStatus,
    SubStatus,
    ReportedBy,
    ClosedReason,
    Weekday,
    ClaimReason,
    ClaimStatus,
)

# Base and Create schemas

class StudentBase(BaseModel):
    student_number: str
    nickname: Optional[str] = None
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    school_level: SchoolLevel
    activity_status: ActivityStatus = ActivityStatus.ACTIVE

class StudentCreate(StudentBase):
    pass

class AttendanceBase(BaseModel):
    student_id: int
    date: date
    status: AttendanceStatus = AttendanceStatus.NOT_REPORTED
    sub_status: SubStatus = SubStatus.NONE
    reported_by: ReportedBy
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    closed_reason: Optional[ClosedReason] = ClosedReason.NA
    override_locked: bool = False
    override_locked_at: Optional[datetime] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    # All fields are optional for partial updates
    student_id: Optional[int] = None
    date: Optional[date] = None
    status: Optional[AttendanceStatus] = None
    sub_status: Optional[SubStatus] = None
    reported_by: Optional[ReportedBy] = None
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    closed_reason: Optional[ClosedReason] = None
    override_locked: Optional[bool] = None
    override_locked_at: Optional[datetime] = None

class PermanentAbsenceBase(BaseModel):
    student_id: int
    weekday: Weekday
    reason: Optional[str] = None

class PermanentAbsenceCreate(PermanentAbsenceBase):
    pass

class SchoolHolidayBase(BaseModel):
    date: date
    description: str

class SchoolHolidayCreate(SchoolHolidayBase):
    pass

class SettingBase(BaseModel):
    lateness_threshold_per_month_default: int
    max_yom_lo_ba_li_per_month_default: int = 2
    court_chair_name: Optional[str] = None
    court_chair_phone: Optional[str] = None

class SettingCreate(SettingBase):
    pass

class StudentMonthlyOverrideBase(BaseModel):
    student_id: int
    year_month: str # YYYY-MM
    lateness_threshold_override: Optional[int] = None
    max_yom_lo_ba_li_override: Optional[int] = None

class StudentMonthlyOverrideCreate(StudentMonthlyOverrideBase):
    pass

# Schemas with IDs (for reading from DB)

class Student(StudentBase):
    id: int

    class Config:
        orm_mode = True

class Attendance(AttendanceBase):
    id: int

    class Config:
        orm_mode = True

class PermanentAbsence(PermanentAbsenceBase):
    id: int

    class Config:
        orm_mode = True

class SchoolHoliday(SchoolHolidayBase):
    id: int

    class Config:
        orm_mode = True

class Setting(SettingBase):
    id: int

    class Config:
        orm_mode = True

class StudentMonthlyOverride(StudentMonthlyOverrideBase):
    id: int

    class Config:
        orm_mode = True

class Claim(BaseModel):
    id: int
    student_id: int
    date_opened: date
    reason: ClaimReason
    notified_to: Optional[list] = None
    status: ClaimStatus

    class Config:
        orm_mode = True

class AuditLog(BaseModel):
    id: int
    actor: str
    action: str
    entity: str
    entity_id: Optional[int] = None
    before: Optional[dict] = None
    after: Optional[dict] = None
    timestamp: datetime

    class Config:
        orm_mode = True