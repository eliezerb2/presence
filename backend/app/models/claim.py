from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from .base import Base
import enum

class ClaimReason(enum.Enum):
    LATE_THRESHOLD = "late_threshold"
    THIRD_YOM_LO_BA_LI = "third_yom_lo_ba_li"
    OTHER = "other"

class ClaimStatus(enum.Enum):
    OPEN = "open"
    CLOSED = "closed"

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date_opened = Column(Date, nullable=False, index=True)
    reason = Column(Enum(ClaimReason), nullable=False)
    notified_to = Column(JSON, nullable=False)  # Array: ["manager", "student", "court_chair"]
    status = Column(Enum(ClaimStatus), nullable=False, default=ClaimStatus.OPEN)
    
    # Relationships
    student = relationship("Student", back_populates="claims")