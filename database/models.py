from sqlalchemy import create_engine, Column, Integer, String, Enum, Boolean, Date, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSON # Assuming PostgreSQL for JSON type
import datetime

Base = declarative_base()

class Student(Base):
    __tablename__ = 'students'
    id = Column(Integer, primary_key=True)
    student_number = Column(String, unique=True, nullable=False)
    nickname = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    phone_number = Column(String)
    school_level = Column(Enum('יסודי', 'תיכון', name='school_level_enum'))
    activity_status = Column(Enum('פעיל', 'לא פעיל', 'מושעה', name='activity_status_enum'))

    attendance_records = relationship("Attendance", back_populates="student")
    permanent_absences = relationship("PermanentAbsence", back_populates="student")
    monthly_overrides = relationship("StudentMonthlyOverride", back_populates="student")
    claims = relationship("Claim", back_populates="student")

    def __repr__(self):
        return f"<Student(id={self.id}, student_number='{self.student_number}', nickname='{self.nickname}')>"

class Attendance(Base):
    __tablename__ = 'attendance'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum('לא דיווח', 'נוכח', 'יצא', 'יום לא בא לי', 'חיסור מאושר', 'אישור היעדרות קבוע', name='attendance_status_enum'))
    sub_status = Column(Enum('ללא', 'איחור', 'נסגר אוטומטית', name='attendance_sub_status_enum'))
    reported_by = Column(Enum('student', 'manager', 'auto', name='reported_by_enum'))
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime)
    closed_reason = Column(Enum('n/a', 'manual', 'auto_16', name='closed_reason_enum'))
    override_locked = Column(Boolean, default=False)
    override_locked_at = Column(DateTime)

    student = relationship("Student", back_populates="attendance_records")

    __table_args__ = (UniqueConstraint('student_id', 'date', name='_student_date_uc'),)

    def __repr__(self):
        return f"<Attendance(id={self.id}, student_id={self.student_id}, date='{self.date}')>"

class PermanentAbsence(Base):
    __tablename__ = 'permanent_absences'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False)
    weekday = Column(Enum('א', 'ב', 'ג', 'ד', 'ה', name='weekday_enum'))
    reason = Column(String)

    student = relationship("Student", back_populates="permanent_absences")

    __table_args__ = (UniqueConstraint('student_id', 'weekday', name='_student_weekday_uc'),)

    def __repr__(self):
        return f"<PermanentAbsence(id={self.id}, student_id={self.student_id}, weekday='{self.weekday}')>"

class SchoolHoliday(Base):
    __tablename__ = 'school_holidays'
    id = Column(Integer, primary_key=True)
    date = Column(Date, unique=True, nullable=False) # Assuming date should be unique for holidays
    description = Column(String)

    def __repr__(self):
        return f"<SchoolHoliday(id={self.id}, date='{self.date}')>"

class Setting(Base):
    __tablename__ = 'settings'
    id = Column(Integer, primary_key=True)
    lateness_threshold_per_month_default = Column(Integer)
    max_yom_lo_ba_li_per_month_default = Column(Integer)
    court_chair_name = Column(String)
    court_chair_phone = Column(String)

    def __repr__(self):
        return f"<Setting(id={self.id})>"

class StudentMonthlyOverride(Base):
    __tablename__ = 'student_monthly_overrides'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False)
    year_month = Column(String, nullable=False) # YYYY-MM format
    lateness_threshold_override = Column(Integer)
    max_yom_lo_ba_li_override = Column(Integer)

    student = relationship("Student", back_populates="monthly_overrides")

    __table_args__ = (UniqueConstraint('student_id', 'year_month', name='_student_year_month_uc'),)

    def __repr__(self):
        return f"<StudentMonthlyOverride(id={self.id}, student_id={self.student_id}, year_month='{self.year_month}')>"

class Claim(Base):
    __tablename__ = 'claims'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False)
    date_opened = Column(DateTime, default=datetime.datetime.now)
    reason = Column(Enum('late_threshold', 'third_yom_lo_ba_li', 'other', name='claim_reason_enum'))
    notified_to = Column(JSON) # Storing as JSON type for array of strings
    status = Column(Enum('open', 'closed', name='claim_status_enum'))

    student = relationship("Student", back_populates="claims")

    def __repr__(self):
        return f"<Claim(id={self.id}, student_id={self.student_id}, status='{self.status}')>"

class AuditLog(Base):
    __tablename__ = 'audit_log'
    id = Column(Integer, primary_key=True)
    actor = Column(String)
    action = Column(String)
    entity = Column(String)
    entity_id = Column(Integer)
    before = Column(Text) # Store as JSON string
    after = Column(Text)  # Store as JSON string
    timestamp = Column(DateTime, default=datetime.datetime.now)

    def __repr__(self):
        return f"<AuditLog(id={self.id}, actor='{self.actor}', action='{self.action}')>