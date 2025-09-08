from pydantic import BaseModel
from typing import Optional
from ..models.permanent_absence import Weekday

class PermanentAbsenceBase(BaseModel):
    student_id: int
    weekday: Weekday
    reason: str

class PermanentAbsenceCreate(PermanentAbsenceBase):
    pass

class PermanentAbsenceUpdate(BaseModel):
    weekday: Optional[Weekday] = None
    reason: Optional[str] = None

class PermanentAbsenceResponse(PermanentAbsenceBase):
    id: int
    
    class Config:
        from_attributes = True