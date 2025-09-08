from pydantic import BaseModel
from typing import Optional

class SettingsBase(BaseModel):
    lateness_threshold_per_month_default: int = 5
    max_yom_lo_ba_li_per_month_default: int = 2
    court_chair_name: Optional[str] = None
    court_chair_phone: Optional[str] = None

class SettingsUpdate(BaseModel):
    lateness_threshold_per_month_default: Optional[int] = None
    max_yom_lo_ba_li_per_month_default: Optional[int] = None
    court_chair_name: Optional[str] = None
    court_chair_phone: Optional[str] = None

class SettingsResponse(SettingsBase):
    id: int
    
    class Config:
        from_attributes = True