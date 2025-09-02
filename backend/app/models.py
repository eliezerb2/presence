from sqlalchemy import Column, Integer, String, Boolean, Date, Enum, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

from .database import Base

import enum

class SchoolLevel(str, enum.Enum):
    elementary = "יסודי"
    high_school = "תיכון"

class ActivityStatus(str, enum.Enum):
    active = "פעיל"
    inactive = "לא פעיל"
    suspended = "מושעה"

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_number = Column(String, unique=True, nullable=False)
    nickname = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    phone_number = Column(String)
    school_level = Column(Enum(SchoolLevel))
    activity_status = Column(Enum(ActivityStatus))

    attendance_records = relationship("Attendance", back_populates="student")
    permanent_absences = relationship("PermanentAbsence", back_populates="student")
    monthly_overrides = relationship("StudentMonthlyOverride", back_populates="student")
    claims = relationship("Claim", back_populates="student")

class AttendanceStatus(str, enum.Enum):
    not_reported = "לא דיווח"
    present = "נוכח"
    left = "יצא"
    yom_lo_ba_li = "יום לא בא לי"
    approved_absence = "חיסור מאושר"
    permanent_absence_approval = "אישור היעדרות קבוע"

class SubStatus(str, enum.Enum):
    none = "ללא"
    late = "איחור"
    closed_automatically = "נסגר אוטומטית"

class ReportedBy(str, enum.Enum):
    student = "student"
    manager = "manager"
    auto = "auto"

class ClosedReason(str, enum.Enum):
    n_a = "n/a"
    manual = "manual"
    auto_16 = "auto_16"

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False)
    sub_status = Column(Enum(SubStatus), nullable=False)
    reported_by = Column(Enum(ReportedBy), nullable=False)
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime)
    closed_reason = Column(Enum(ClosedReason))
    override_locked = Column(Boolean, default=False)
    override_locked_at = Column(DateTime)

    student = relationship("Student", back_populates="attendance_records")

    __table_args__ = (UniqueConstraint('student_id', 'date', name='_student_date_uc'),)

class Weekday(str, enum.Enum):
    sunday = "א"
    monday = "ב"
    tuesday = "ג"
    wednesday = "ד"
    thursday = "ה"

class PermanentAbsence(Base):
    __tablename__ = "permanent_absences"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    weekday = Column(Enum(Weekday), nullable=False)
    reason = Column(String)

    student = relationship("Student", back_populates="permanent_absences")

    __table_args__ = (UniqueConstraint('student_id', 'weekday', name='_student_weekday_uc'),)

class SchoolHoliday(Base):
    __tablename__ = "school_holidays"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    description = Column(String)

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    lateness_threshold_per_month_default = Column(Integer)
    max_yom_lo_ba_li_per_month_default = Column(Integer)
    court_chair_name = Column(String)
    court_chair_phone = Column(String)

class StudentMonthlyOverride(Base):
    __tablename__ = "student_monthly_overrides"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    year_month = Column(String, nullable=False) # YYYY-MM
    lateness_threshold_override = Column(Integer)
    max_yom_lo_ba_li_override = Column(Integer)

    student = relationship("Student", back_populates="monthly_overrides")

    __table_args__ = (UniqueConstraint('student_id', 'year_month', name='_student_year_month_uc'),)

class ClaimReason(str, enum.Enum):
    late_threshold = "late_threshold"
    third_yom_lo_ba_li = "third_yom_lo_ba_li"
    other = "other"

class ClaimStatus(str, enum.Enum):
    open = "open"
    closed = "closed"

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date_opened = Column(DateTime)
    reason = Column(Enum(ClaimReason))
    notified_to = Column(ARRAY(String)) # Assuming array of strings for now
    status = Column(Enum(ClaimStatus))

    student = relationship("Student", back_populates="claims")

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String)
    action = Column(String)
    entity = Column(String)
    entity_id = Column(Integer)
    before = Column(JSONB) # Assuming JSONB for before/after states
    after = Column(JSONB)
    timestamp = Column(DateTime)
