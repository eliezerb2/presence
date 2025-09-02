from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, Text, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class SchoolLevel(str, enum.Enum):
    ELEMENTARY = "יסודי"
    HIGH_SCHOOL = "תיכון"

class ActivityStatus(str, enum.Enum):
    ACTIVE = "פעיל"
    INACTIVE = "לא פעיל"
    SUSPENDED = "מושעה"

class AttendanceStatus(str, enum.Enum):
    NOT_REPORTED = "לא דיווח"
    PRESENT = "נוכח"
    LEFT = "יצא"
    YOM_LO_BA_LI = "יום לא בא לי"
    APPROVED_ABSENCE = "חיסור מאושר"
    PERMANENT_ABSENCE_APPROVED = "אישור היעדרות קבוע"

class SubStatus(str, enum.Enum):
    NONE = "ללא"
    LATE = "איחור"
    AUTO_CLOSED = "נסגר אוטומטית"

class ReportedBy(str, enum.Enum):
    STUDENT = "student"
    MANAGER = "manager"
    AUTO = "auto"

class ClosedReason(str, enum.Enum):
    NA = "n/a"
    MANUAL = "manual"
    AUTO_16 = "auto_16"

class Weekday(str, enum.Enum):
    SUNDAY = "א"
    MONDAY = "ב"
    TUESDAY = "ג"
    WEDNESDAY = "ד"
    THURSDAY = "ה"

class ClaimReason(str, enum.Enum):
    LATE_THRESHOLD = "late_threshold"
    THIRD_YOM_LO_BA_LI = "third_yom_lo_ba_li"
    OTHER = "other"

class ClaimStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    student_number = Column(String, unique=True, nullable=False, index=True)
    nickname = Column(String, unique=True, nullable=False, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone_number = Column(String)
    school_level = Column(String, nullable=False)
    activity_status = Column(String, nullable=False, default=ActivityStatus.ACTIVE)
    
    # Relationships
    attendance_records = relationship("Attendance", back_populates="student")
    permanent_absences = relationship("PermanentAbsence", back_populates="student")
    monthly_overrides = relationship("StudentMonthlyOverride", back_populates="student")
    claims = relationship("Claim", back_populates="student")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default=AttendanceStatus.NOT_REPORTED)
    sub_status = Column(String, default=SubStatus.NONE)
    reported_by = Column(String, default=ReportedBy.STUDENT)
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime)
    closed_reason = Column(String, default=ClosedReason.NA)
    override_locked = Column(Boolean, default=False)
    override_locked_at = Column(DateTime)
    
    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('student_id', 'date', name='unique_student_date'),
    )

class PermanentAbsence(Base):
    __tablename__ = "permanent_absences"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    weekday = Column(String, nullable=False)
    reason = Column(Text)
    
    # Relationships
    student = relationship("Student", back_populates="permanent_absences")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('student_id', 'weekday', name='unique_student_weekday'),
    )

class SchoolHoliday(Base):
    __tablename__ = "school_holidays"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    description = Column(Text)

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, default=1)
    lateness_threshold_per_month_default = Column(Integer, default=3)
    max_yom_lo_ba_li_per_month_default = Column(Integer, default=2)
    court_chair_name = Column(String)
    court_chair_phone = Column(String)

class StudentMonthlyOverride(Base):
    __tablename__ = "student_monthly_overrides"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    year_month = Column(String, nullable=False)  # Format: YYYY-MM
    lateness_threshold_override = Column(Integer)
    max_yom_lo_ba_li_override = Column(Integer)
    
    # Relationships
    student = relationship("Student", back_populates="monthly_overrides")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('student_id', 'year_month', name='unique_student_month'),
    )

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date_opened = Column(Date, nullable=False, default=func.current_date())
    reason = Column(String, nullable=False)
    notified_to = Column(Text)  # JSON array as text
    status = Column(String, default=ClaimStatus.OPEN)
    
    # Relationships
    student = relationship("Student", back_populates="claims")

class AuditLog(Base):
    __tablename__ = "audit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String, nullable=False)  # manager/auto/student
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=False)
    before = Column(Text)  # JSON representation
    after = Column(Text)   # JSON representation
    timestamp = Column(DateTime, default=func.now())
