from pydantic import BaseModel
from typing import Optional
from ..models.student import SchoolLevel, ActivityStatus

class StudentBase(BaseModel):
    student_number: str
    nickname: Optional[str] = None
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    school_level: SchoolLevel
    activity_status: ActivityStatus = ActivityStatus.ACTIVE

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    student_number: Optional[str] = None
    nickname: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    school_level: Optional[SchoolLevel] = None
    activity_status: Optional[ActivityStatus] = None

class StudentResponse(StudentBase):
    id: int
    
    class Config:
        from_attributes = True