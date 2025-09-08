from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from .base import Base
import enum

class SchoolLevel(enum.Enum):
    ELEMENTARY = "יסודי"
    HIGH_SCHOOL = "תיכון"

class ActivityStatus(enum.Enum):
    ACTIVE = "פעיל"
    INACTIVE = "לא פעיל"
    SUSPENDED = "מושעה"

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    student_number = Column(String, unique=True, nullable=False, index=True)
    nickname = Column(String, unique=True, nullable=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    school_level = Column(Enum(SchoolLevel), nullable=False)
    activity_status = Column(Enum(ActivityStatus), nullable=False, default=ActivityStatus.ACTIVE)
    
    # Relationships
    attendances = relationship("Attendance", back_populates="student")
    permanent_absences = relationship("PermanentAbsence", back_populates="student")
    monthly_overrides = relationship("StudentMonthlyOverride", back_populates="student")
    claims = relationship("Claim", back_populates="student")