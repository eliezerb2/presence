from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..models.base import get_db
from ..models.school_holiday import SchoolHoliday
from ..schemas.school_holiday import SchoolHolidayCreate, SchoolHolidayUpdate, SchoolHolidayResponse
from ..services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[SchoolHolidayResponse])
def get_school_holidays(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    holidays = db.query(SchoolHoliday).offset(skip).limit(limit).all()
    return holidays

@router.get("/{holiday_id}", response_model=SchoolHolidayResponse)
def get_school_holiday(holiday_id: int, db: Session = Depends(get_db)):
    holiday = db.query(SchoolHoliday).filter(SchoolHoliday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="School holiday not found")
    return holiday

@router.post("/", response_model=SchoolHolidayResponse, status_code=status.HTTP_201_CREATED)
def create_school_holiday(holiday: SchoolHolidayCreate, db: Session = Depends(get_db)):
    # Check if holiday already exists for this date
    existing = db.query(SchoolHoliday).filter(SchoolHoliday.date == holiday.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="School holiday already exists for this date")
    
    db_holiday = SchoolHoliday(**holiday.dict())
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    
    log_audit(db, "manager", "create", "school_holiday", db_holiday.id, None, holiday.dict())
    
    return db_holiday

@router.put("/{holiday_id}", response_model=SchoolHolidayResponse)
def update_school_holiday(holiday_id: int, holiday: SchoolHolidayUpdate, db: Session = Depends(get_db)):
    db_holiday = db.query(SchoolHoliday).filter(SchoolHoliday.id == holiday_id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="School holiday not found")
    
    original_data = {
        "date": db_holiday.date.isoformat(),
        "description": db_holiday.description
    }
    
    # Check for unique constraint if date is being updated
    if holiday.date and holiday.date != db_holiday.date:
        existing = db.query(SchoolHoliday).filter(SchoolHoliday.date == holiday.date).first()
        if existing:
            raise HTTPException(status_code=400, detail="School holiday already exists for this date")
    
    update_data = holiday.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_holiday, field, value)
    
    db.commit()
    db.refresh(db_holiday)
    
    log_audit(db, "manager", "update", "school_holiday", holiday_id, original_data, update_data)
    
    return db_holiday

@router.delete("/{holiday_id}")
def delete_school_holiday(holiday_id: int, db: Session = Depends(get_db)):
    db_holiday = db.query(SchoolHoliday).filter(SchoolHoliday.id == holiday_id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="School holiday not found")
    
    original_data = {
        "date": db_holiday.date.isoformat(),
        "description": db_holiday.description
    }
    
    db.delete(db_holiday)
    db.commit()
    
    log_audit(db, "manager", "delete", "school_holiday", holiday_id, original_data, None)
    
    return {"message": "School holiday deleted successfully"}