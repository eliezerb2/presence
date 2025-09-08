from sqlalchemy import Column, Integer, String, Date
from .base import Base

class SchoolHoliday(Base):
    __tablename__ = "school_holidays"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True, index=True)
    description = Column(String, nullable=False)