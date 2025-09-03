from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# Enums for Pydantic models
class SchoolLevel(str, Enum):
    ELEMENTARY = "יסודי"
    HIGH_SCHOOL = "תיכון"

class ActivityStatus(str, Enum):
    ACTIVE = "פעיל"
    INACTIVE = "לא פעיל"
    SUSPENDED = "מושעה"

class AttendanceStatus(str, Enum):
    NOT_REPORTED = "לא דיווח"
    PRESENT = "נוכח"
    LEFT = "יצא"
    NOT_IN_MOOD = "יום לא בא לי"
    APPROVED_ABSENCE = "חיסור מאושר"
    PERMANENT_ABSENCE_APPROVAL = "אישור היעדרות קבוע"

class AttendanceSubStatus(str, Enum):
    NONE = "ללא"
    LATE = "איחור"
    AUTO_CLOSED = "נסגר אוטומטית"

class ReportedBy(str, Enum):
    STUDENT = "student"
    MANAGER = "manager"
    AUTO = "auto"

class ClosedReason(str, Enum):
    N_A = "n/a"
    MANUAL = "manual"
    AUTO_16 = "auto_16"

class Weekday(str, Enum):
    SUNDAY = "א"
    MONDAY = "ב"
    TUESDAY = "ג"
    WEDNESDAY = "ד"
    THURSDAY = "ה"

class ClaimReason(str, Enum):
    LATE_THRESHOLD = "late_threshold"
    THIRD_YOM_LO_BA_LI = "third_yom_lo_ba_li"
    OTHER = "other"

class ClaimStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"

class StudentBase(BaseModel):
    student_number: str = Field(..., min_length=1)
    nickname: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    school_level: Optional[SchoolLevel] = None
    activity_status: Optional[ActivityStatus] = ActivityStatus.ACTIVE

class StudentCreate(StudentBase):
    pass

class StudentUpdate(StudentBase):
    student_number: Optional[str] = None # Allow updating student_number
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
    status: AttendanceStatus = AttendanceStatus.NOT_REPORTED
    sub_status: AttendanceSubStatus = AttendanceSubStatus.NONE
    reported_by: ReportedBy = ReportedBy.AUTO
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    closed_reason: ClosedReason = ClosedReason.N_A
    override_locked: bool = False
    override_locked_at: Optional[datetime] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(AttendanceBase):
    student_id: Optional[int] = None
    date: Optional[date] = None
    status: Optional[AttendanceStatus] = None
    sub_status: Optional[AttendanceSubStatus] = None
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
    pass

class Setting(SettingBase):
    id: int

    class Config:
        orm_mode = True

class StudentMonthlyOverrideBase(BaseModel):
    student_id: int
    year_month: str # YYYY-MM
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
    reason: ClaimReason
    notified_to: List[str] # Assuming this will be a list of strings (manager, student, court_chair)
    status: ClaimStatus = ClaimStatus.OPEN

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
    actor: str
    action: str
    entity: str
    entity_id: int
    before: Optional[Dict[str, Any]] = None # Assuming JSON will be dict
    after: Optional[Dict[str, Any]] = None  # Assuming JSON will be dict
    timestamp: Optional[datetime] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLog(AuditLogBase):
    id: int

    class Config:
        orm_mode = True
