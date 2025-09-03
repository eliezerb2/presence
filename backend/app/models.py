from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class SchoolLevel(enum.Enum):
    ELEMENTARY = "יסודי"
    HIGH_SCHOOL = "תיכון"

class ActivityStatus(enum.Enum):
    ACTIVE = "פעיל"
    INACTIVE = "לא פעיל"
    SUSPENDED = "מושעה"

class AttendanceStatus(enum.Enum):
    NOT_REPORTED = "לא דיווח"
    PRESENT = "נוכח"
    LEFT = "יצא"
    YOM_LO_BA_LI = "יום לא בא לי"
    APPROVED_ABSENCE = "חיסור מאושר"
    PERMANENT_ABSENCE = "אישור היעדרות קבוע"

class SubStatus(enum.Enum):
    NONE = "ללא"
    LATE = "איחור"
    AUTO_CLOSED = "נסגר אוטומטית"

class ReportedBy(enum.Enum):
    STUDENT = "student"
    MANAGER = "manager"
    AUTO = "auto"

class ClosedReason(enum.Enum):
    NA = "n/a"
    MANUAL = "manual"
    AUTO_16 = "auto_16"

class Weekday(enum.Enum):
    SUNDAY = "א"
    MONDAY = "ב"
    TUESDAY = "ג"
    WEDNESDAY = "ד"
    THURSDAY = "ה"

class ClaimReason(enum.Enum):
    LATE_THRESHOLD = "late_threshold"
    THIRD_YOM_LO_BA_LI = "third_yom_lo_ba_li"
    OTHER = "other"

class ClaimStatus(enum.Enum):
    OPEN = "open"
    CLOSED = "closed"

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    student_number = Column(String, unique=True, nullable=False, index=True)
    nickname = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone_number = Column(String)
    school_level = Column(SQLEnum(SchoolLevel), nullable=False)
    activity_status = Column(SQLEnum(ActivityStatus), default=ActivityStatus.ACTIVE)
    
    attendances = relationship("Attendance", back_populates="student")
    permanent_absences = relationship("PermanentAbsence", back_populates="student")
    monthly_overrides = relationship("StudentMonthlyOverride", back_populates="student")
    claims = relationship("Claim", back_populates="student")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(SQLEnum(AttendanceStatus), default=AttendanceStatus.NOT_REPORTED)
    sub_status = Column(SQLEnum(SubStatus), default=SubStatus.NONE)
    reported_by = Column(SQLEnum(ReportedBy), default=ReportedBy.STUDENT)
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime)
    closed_reason = Column(SQLEnum(ClosedReason), default=ClosedReason.NA)
    override_locked = Column(Boolean, default=False, nullable=False)
    override_locked_at = Column(DateTime)
    
    student = relationship("Student", back_populates="attendances")
    
    __table_args__ = (UniqueConstraint('student_id', 'date', name='_student_date_uc'),)

class PermanentAbsence(Base):
    __tablename__ = "permanent_absences"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    weekday = Column(SQLEnum(Weekday), nullable=False)
    reason = Column(String, nullable=False)
    
    student = relationship("Student", back_populates="permanent_absences")
    
    __table_args__ = (UniqueConstraint('student_id', 'weekday', name='_student_weekday_uc'),)

class SchoolHoliday(Base):
    __tablename__ = "school_holidays"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    description = Column(String, nullable=False)

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    lateness_threshold_per_month_default = Column(Integer, default=5)
    max_yom_lo_ba_li_per_month_default = Column(Integer, default=2)
    court_chair_name = Column(String)
    court_chair_phone = Column(String)

class StudentMonthlyOverride(Base):
    __tablename__ = "student_monthly_overrides"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    year_month = Column(String, nullable=False)  # YYYY-MM format
    lateness_threshold_override = Column(Integer)
    max_yom_lo_ba_li_override = Column(Integer)
    
    student = relationship("Student", back_populates="monthly_overrides")
    
    __table_args__ = (UniqueConstraint('student_id', 'year_month', name='_student_month_uc'),)

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date_opened = Column(Date, nullable=False)
    reason = Column(SQLEnum(ClaimReason), nullable=False)
    notified_to = Column(String)  # JSON array
    status = Column(SQLEnum(ClaimStatus), default=ClaimStatus.OPEN)
    
    student = relationship("Student", back_populates="claims")

class AuditLog(Base):
    __tablename__ = "audit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String, nullable=False)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=False)
    before = Column(String)  # JSON
    after = Column(String)   # JSON
    timestamp = Column(DateTime, default=datetime.utcnow)