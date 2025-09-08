from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    actor: str
    action: str
    entity: str
    entity_id: int
    before: Optional[Dict[str, Any]]
    after: Optional[Dict[str, Any]]
    timestamp: datetime
    
    class Config:
        from_attributes = True