from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from ..models.claim import ClaimReason, ClaimStatus

class ClaimBase(BaseModel):
    student_id: int
    date_opened: date
    reason: ClaimReason
    notified_to: List[str]
    status: ClaimStatus = ClaimStatus.OPEN

class ClaimCreate(ClaimBase):
    pass

class ClaimUpdate(BaseModel):
    reason: Optional[ClaimReason] = None
    notified_to: Optional[List[str]] = None
    status: Optional[ClaimStatus] = None

class ClaimResponse(ClaimBase):
    id: int
    
    class Config:
        from_attributes = True