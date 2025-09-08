from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base

class StudentMonthlyOverride(Base):
    __tablename__ = "student_monthly_overrides"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    year_month = Column(String, nullable=False)  # Format: YYYY-MM
    lateness_threshold_override = Column(Integer, nullable=True)
    max_yom_lo_ba_li_override = Column(Integer, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="monthly_overrides")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('student_id', 'year_month', name='unique_student_year_month'),
    )