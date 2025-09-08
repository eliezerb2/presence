from sqlalchemy import Column, Integer, String, DateTime, JSON
from .base import Base
from datetime import datetime

class AuditLog(Base):
    __tablename__ = "audit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String, nullable=False)  # manager/auto/student
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=False)
    before = Column(JSON, nullable=True)
    after = Column(JSON, nullable=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)