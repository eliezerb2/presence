from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base
import enum
from datetime import datetime

class AttendanceStatus(enum.Enum):
    NOT_REPORTED = "לא דיווח"
    PRESENT = "נוכח"
    LEFT = "יצא"
    DIDNT_FEEL_LIKE_IT = "יום לא בא לי"
    APPROVED_ABSENCE = "חיסור מאושר"
    PERMANENT_ABSENCE_APPROVAL = "אישור היעדרות קבוע"

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

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    status = Column(Enum(AttendanceStatus), nullable=False, default=AttendanceStatus.NOT_REPORTED)
    sub_status = Column(Enum(SubStatus), nullable=False, default=SubStatus.NONE)
    reported_by = Column(Enum(ReportedBy), nullable=False, default=ReportedBy.STUDENT)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    closed_reason = Column(Enum(ClosedReason), nullable=False, default=ClosedReason.NA)
    override_locked = Column(Boolean, nullable=False, default=False)
    override_locked_at = Column(DateTime, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="attendances")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('student_id', 'date', name='unique_student_date'),
    )