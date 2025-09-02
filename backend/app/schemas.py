from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime

from .models import SchoolLevel, ActivityStatus, AttendanceStatus, SubStatus, ReportedBy, ClosedReason, Weekday, ClaimReason, ClaimStatus

class StudentBase(BaseModel):
    student_number: str
    nickname: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    school_level: Optional[SchoolLevel] = None
    activity_status: Optional[ActivityStatus] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(StudentBase):
    student_number: Optional[str] = None
    nickname: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    school_level: Optional[SchoolLevel] = None
    activity_status: Optional[ActivityStatus] = None

class Student(StudentBase):
    id: int

    class Config:
        orm_mode = True

class AttendanceBase(BaseModel):
    student_id: int
    date: date
    status: AttendanceStatus
    sub_status: SubStatus
    reported_by: ReportedBy
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    closed_reason: Optional[ClosedReason] = None
    override_locked: Optional[bool] = False
    override_locked_at: Optional[datetime] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(AttendanceBase):
    student_id: Optional[int] = None
    date: Optional[date] = None
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

    class Config:
        orm_mode = True

class PermanentAbsenceBase(BaseModel):
    student_id: int
    weekday: Weekday
    reason: Optional[str] = None

class PermanentAbsenceCreate(PermanentAbsenceBase):
    pass

class PermanentAbsenceUpdate(PermanentAbsenceBase):
    student_id: Optional[int] = None
    weekday: Optional[Weekday] = None
    reason: Optional[str] = None

class PermanentAbsence(PermanentAbsenceBase):
    id: int

    class Config:
        orm_mode = True

class SchoolHolidayBase(BaseModel):
    date: date
    description: Optional[str] = None

class SchoolHolidayCreate(SchoolHolidayBase):
    pass

class SchoolHolidayUpdate(SchoolHolidayBase):
    date: Optional[date] = None
    description: Optional[str] = None

class SchoolHoliday(SchoolHolidayBase):
    id: int

    class Config:
        orm_mode = True

class SettingBase(BaseModel):
    lateness_threshold_per_month_default: Optional[int] = None
    max_yom_lo_ba_li_per_month_default: Optional[int] = None
    court_chair_name: Optional[str] = None
    court_chair_phone: Optional[str] = None

class SettingCreate(SettingBase):
    pass

class SettingUpdate(SettingBase):
    lateness_threshold_per_month_default: Optional[int] = None
    max_yom_lo_ba_li_per_month_default: Optional[int] = None
    court_chair_name: Optional[str] = None
    court_chair_phone: Optional[str] = None

class Setting(SettingBase):
    id: int

    class Config:
        orm_mode = True

class StudentMonthlyOverrideBase(BaseModel):
    student_id: int
    year_month: str
    lateness_threshold_override: Optional[int] = None
    max_yom_lo_ba_li_override: Optional[int] = None

class StudentMonthlyOverrideCreate(StudentMonthlyOverrideBase):
    pass

class StudentMonthlyOverrideUpdate(StudentMonthlyOverrideBase):
    student_id: Optional[int] = None
    year_month: Optional[str] = None
    lateness_threshold_override: Optional[int] = None
    max_yom_lo_ba_li_override: Optional[int] = None

class StudentMonthlyOverride(StudentMonthlyOverrideBase):
    id: int

    class Config:
        orm_mode = True

class ClaimBase(BaseModel):
    student_id: int
    date_opened: Optional[datetime] = None
    reason: Optional[ClaimReason] = None
    notified_to: Optional[List[str]] = None
    status: Optional[ClaimStatus] = None

class ClaimCreate(ClaimBase):
    pass

class ClaimUpdate(ClaimBase):
    student_id: Optional[int] = None
    date_opened: Optional[datetime] = None
    reason: Optional[ClaimReason] = None
    notified_to: Optional[List[str]] = None
    status: Optional[ClaimStatus] = None

class Claim(ClaimBase):
    id: int

    class Config:
        orm_mode = True

class AuditLogBase(BaseModel):
    actor: Optional[str] = None
    action: Optional[str] = None
    entity: Optional[str] = None
    entity_id: Optional[int] = None
    before: Optional[Any] = None # JSONB type, can be any JSON
    after: Optional[Any] = None  # JSONB type, can be any JSON
    timestamp: Optional[datetime] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogUpdate(AuditLogBase):
    actor: Optional[str] = None
    action: Optional[str] = None
    entity: Optional[str] = None
    entity_id: Optional[int] = None
    before: Optional[Any] = None
    after: Optional[Any] = None
    timestamp: Optional[datetime] = None

class AuditLog(AuditLogBase):
    id: int

    class Config:
        orm_mode = True