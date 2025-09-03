from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Settings, PermanentAbsence, SchoolHoliday, StudentMonthlyOverride, Claim
from pydantic import BaseModel
from datetime import date
from typing import Optional

router = APIRouter()

class SettingsUpdate(BaseModel):
    lateness_threshold_per_month_default: Optional[int] = None
    max_yom_lo_ba_li_per_month_default: Optional[int] = None
    court_chair_name: Optional[str] = None
    court_chair_phone: Optional[str] = None

class PermanentAbsenceCreate(BaseModel):
    student_id: int
    weekday: str
    reason: str

class HolidayCreate(BaseModel):
    date: date
    description: str

@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    stmt = select(Settings)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    if not settings:
        settings = Settings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings

@router.put("/settings")
async def update_settings(settings_update: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Settings)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        settings = Settings()
        db.add(settings)
    
    for field, value in settings_update.dict(exclude_unset=True).items():
        setattr(settings, field, value)
    
    await db.commit()
    return settings

@router.get("/permanent-absences")
async def get_permanent_absences(db: AsyncSession = Depends(get_db)):
    stmt = select(PermanentAbsence)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/permanent-absences")
async def create_permanent_absence(absence: PermanentAbsenceCreate, db: AsyncSession = Depends(get_db)):
    db_absence = PermanentAbsence(**absence.dict())
    db.add(db_absence)
    await db.commit()
    await db.refresh(db_absence)
    return db_absence

@router.get("/holidays")
async def get_holidays(db: AsyncSession = Depends(get_db)):
    stmt = select(SchoolHoliday)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/holidays")
async def create_holiday(holiday: HolidayCreate, db: AsyncSession = Depends(get_db)):
    db_holiday = SchoolHoliday(**holiday.dict())
    db.add(db_holiday)
    await db.commit()
    await db.refresh(db_holiday)
    return db_holiday

@router.get("/claims")
async def get_claims(db: AsyncSession = Depends(get_db)):
    stmt = select(Claim)
    result = await db.execute(stmt)
    return result.scalars().all()