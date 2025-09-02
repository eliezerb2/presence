
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Date,
    Time,
    Boolean,
    ForeignKey,
    Enum,
    JSON,
    DateTime,
    UniqueConstraint,
    Text
)
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
    DAY_OFF = "יום לא בא לי"
    APPROVED_ABSENCE = "חיסור מאושר"
    PERMANENT_ABSENCE = "אישור היעדרות קבוע"


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
    student_number = Column(String, unique=True, index=True, nullable=False)
    nickname = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone_number = Column(String)
    school_level = Column(Enum(SchoolLevel), nullable=False)
    activity_status = Column(Enum(ActivityStatus), default=ActivityStatus.ACTIVE, nullable=False)

    attendances = relationship("Attendance", back_populates="student")
    permanent_absences = relationship("PermanentAbsence", back_populates="student")
    monthly_overrides = relationship("StudentMonthlyOverride", back_populates="student")
    claims = relationship("Claim", back_populates="student")


class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.NOT_REPORTED, nullable=False)
    sub_status = Column(Enum(SubStatus), default=SubStatus.NONE, nullable=False)
    reported_by = Column(Enum(ReportedBy), nullable=False)
    check_in_time = Column(Time, nullable=True)
    check_out_time = Column(Time, nullable=True)
    closed_reason = Column(Enum(ClosedReason), default=ClosedReason.NA)
    override_locked = Column(Boolean, default=False)
    override_locked_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="attendances")
    __table_args__ = (UniqueConstraint("student_id", "date", name="_student_date_uc"),)


class PermanentAbsence(Base):
    __tablename__ = "permanent_absences"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    weekday = Column(Enum(Weekday), nullable=False)
    reason = Column(Text)

    student = relationship("Student", back_populates="permanent_absences")
    __table_args__ = (UniqueConstraint("student_id", "weekday", name="_student_weekday_uc"),)


class SchoolHoliday(Base):
    __tablename__ = "school_holidays"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, nullable=False)
    description = Column(String, nullable=False)


class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    lateness_threshold_per_month_default = Column(Integer, nullable=False)
    max_yom_lo_ba_li_per_month_default = Column(Integer, default=2, nullable=False)
    court_chair_name = Column(String)
    court_chair_phone = Column(String)


class StudentMonthlyOverride(Base):
    __tablename__ = "student_monthly_overrides"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    year_month = Column(String, nullable=False)  # Format: YYYY-MM
    lateness_threshold_override = Column(Integer)
    max_yom_lo_ba_li_override = Column(Integer)

    student = relationship("Student", back_populates="monthly_overrides")
    __table_args__ = (UniqueConstraint("student_id", "year_month", name="_student_year_month_uc"),)


class Claim(Base):
    __tablename__ = "claims"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date_opened = Column(Date, default=func.now())
    reason = Column(Enum(ClaimReason), nullable=False)
    notified_to = Column(JSON)
    status = Column(Enum(ClaimStatus), default=ClaimStatus.OPEN)

    student = relationship("Student", back_populates="claims")


class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String, nullable=False)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(Integer)
    before = Column(JSON)
    after = Column(JSON)
    timestamp = Column(DateTime, default=func.now())
