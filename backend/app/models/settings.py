from sqlalchemy import Column, Integer, String
from .base import Base

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    lateness_threshold_per_month_default = Column(Integer, nullable=False, default=5)
    max_yom_lo_ba_li_per_month_default = Column(Integer, nullable=False, default=2)
    court_chair_name = Column(String, nullable=True)
    court_chair_phone = Column(String, nullable=True)