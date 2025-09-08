from pydantic import BaseModel
from typing import Optional
from datetime import date

class SchoolHolidayBase(BaseModel):
    date: date
    description: str

class SchoolHolidayCreate(SchoolHolidayBase):
    pass

class SchoolHolidayUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None

class SchoolHolidayResponse(SchoolHolidayBase):
    id: int
    
    class Config:
        from_attributes = True