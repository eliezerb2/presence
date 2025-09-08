from sqlalchemy import Column, Integer, String, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base
import enum

class Weekday(enum.Enum):
    SUNDAY = "א"
    MONDAY = "ב"
    TUESDAY = "ג"
    WEDNESDAY = "ד"
    THURSDAY = "ה"

class PermanentAbsence(Base):
    __tablename__ = "permanent_absences"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    weekday = Column(Enum(Weekday), nullable=False)
    reason = Column(String, nullable=False)
    
    # Relationships
    student = relationship("Student", back_populates="permanent_absences")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('student_id', 'weekday', name='unique_student_weekday'),
    )