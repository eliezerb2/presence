from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..services.student_service import StudentService
from ..services.claims_service import ClaimsService
from ..schemas import (
    StudentCreate, StudentUpdate, PermanentAbsenceCreate, PermanentAbsenceUpdate,
    SchoolHolidayCreate, SchoolHolidayUpdate, SettingsUpdate, 
    StudentMonthlyOverrideCreate, StudentMonthlyOverrideUpdate,
    MessageResponse
)
from ..models import Settings, SchoolHoliday, PermanentAbsence, StudentMonthlyOverride

router = APIRouter(prefix="/admin", tags=["admin"])

# Student management
@router.post("/students", response_model=dict)
def create_student(student_data: StudentCreate, db: Session = Depends(get_db)):
    """Create a new student"""
    student_service = StudentService(db)
    
    # Check if student number or nickname already exists
    if student_service.get_student_by_number(student_data.student_number):
        raise HTTPException(status_code=400, detail="Student number already exists")
    
    if student_service.get_student_by_nickname(student_data.nickname):
        raise HTTPException(status_code=400, detail="Nickname already exists")
    
    student = student_service.create_student(student_data)
    
    return {
        "id": student.id,
        "student_number": student.student_number,
        "nickname": student.nickname,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "message": "Student created successfully"
    }

@router.put("/students/{student_id}", response_model=dict)
def update_student(
    student_id: int, 
    update_data: StudentUpdate, 
    db: Session = Depends(get_db)
):
    """Update a student"""
    student_service = StudentService(db)
    
    # Check if student exists
    existing_student = student_service.get_student(student_id)
    if not existing_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check for conflicts if updating unique fields
    if update_data.nickname and update_data.nickname != existing_student.nickname:
        if student_service.get_student_by_nickname(update_data.nickname):
            raise HTTPException(status_code=400, detail="Nickname already exists")
    
    if update_data.student_number and update_data.student_number != existing_student.student_number:
        if student_service.get_student_by_number(update_data.student_number):
            raise HTTPException(status_code=400, detail="Student number already exists")
    
    updated = student_service.update_student(student_id, update_data)
    
    return {
        "id": updated.id,
        "nickname": updated.nickname,
        "first_name": updated.first_name,
        "last_name": updated.last_name,
        "message": "Student updated successfully"
    }

@router.delete("/students/{student_id}", response_model=MessageResponse)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """Delete a student (soft delete)"""
    student_service = StudentService(db)
    
    success = student_service.delete_student(student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return MessageResponse(message="Student deleted successfully")

# Permanent absences management
@router.post("/permanent-absences", response_model=dict)
def create_permanent_absence(
    absence_data: PermanentAbsenceCreate, 
    db: Session = Depends(get_db)
):
    """Create a new permanent absence"""
    # Check if student exists
    student_service = StudentService(db)
    student = student_service.get_student(absence_data.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if permanent absence already exists for this student and weekday
    existing = db.query(PermanentAbsence).filter(
        PermanentAbsence.student_id == absence_data.student_id,
        PermanentAbsence.weekday == absence_data.weekday
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Permanent absence already exists for this student and weekday"
        )
    
    absence = PermanentAbsence(**absence_data.dict())
    db.add(absence)
    db.commit()
    db.refresh(absence)
    
    return {
        "id": absence.id,
        "student_name": f"{student.first_name} {student.last_name}",
        "weekday": absence.weekday,
        "reason": absence.reason,
        "message": "Permanent absence created successfully"
    }

@router.put("/permanent-absences/{absence_id}", response_model=dict)
def update_permanent_absence(
    absence_id: int,
    update_data: PermanentAbsenceUpdate,
    db: Session = Depends(get_db)
):
    """Update a permanent absence"""
    absence = db.query(PermanentAbsence).filter(PermanentAbsence.id == absence_id).first()
    if not absence:
        raise HTTPException(status_code=404, detail="Permanent absence not found")
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(absence, field, value)
    
    db.commit()
    db.refresh(absence)
    
    return {
        "id": absence.id,
        "weekday": absence.weekday,
        "reason": absence.reason,
        "message": "Permanent absence updated successfully"
    }

@router.delete("/permanent-absences/{absence_id}", response_model=MessageResponse)
def delete_permanent_absence(absence_id: int, db: Session = Depends(get_db)):
    """Delete a permanent absence"""
    absence = db.query(PermanentAbsence).filter(PermanentAbsence.id == absence_id).first()
    if not absence:
        raise HTTPException(status_code=404, detail="Permanent absence not found")
    
    db.delete(absence)
    db.commit()
    
    return MessageResponse(message="Permanent absence deleted successfully")

# School holidays management
@router.post("/holidays", response_model=dict)
def create_school_holiday(
    holiday_data: SchoolHolidayCreate,
    db: Session = Depends(get_db)
):
    """Create a new school holiday"""
    # Check if holiday already exists for this date
    existing = db.query(SchoolHoliday).filter(
        SchoolHoliday.date == holiday_data.date
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Holiday already exists for this date")
    
    holiday = SchoolHoliday(**holiday_data.dict())
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    
    return {
        "id": holiday.id,
        "date": holiday.date,
        "description": holiday.description,
        "message": "School holiday created successfully"
    }

@router.put("/holidays/{holiday_id}", response_model=dict)
def update_school_holiday(
    holiday_id: int,
    update_data: SchoolHolidayUpdate,
    db: Session = Depends(get_db)
):
    """Update a school holiday"""
    holiday = db.query(SchoolHoliday).filter(SchoolHoliday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="School holiday not found")
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(holiday, field, value)
    
    db.commit()
    db.refresh(holiday)
    
    return {
        "id": holiday.id,
        "date": holiday.date,
        "description": holiday.description,
        "message": "School holiday updated successfully"
    }

@router.delete("/holidays/{holiday_id}", response_model=MessageResponse)
def delete_school_holiday(holiday_id: int, db: Session = Depends(get_db)):
    """Delete a school holiday"""
    holiday = db.query(SchoolHoliday).filter(SchoolHoliday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="School holiday not found")
    
    db.delete(holiday)
    db.commit()
    
    return MessageResponse(message="School holiday deleted successfully")

# Settings management
@router.get("/settings", response_model=dict)
def get_settings(db: Session = Depends(get_db)):
    """Get current system settings"""
    settings = db.query(Settings).first()
    if not settings:
        # Create default settings
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return {
        "id": settings.id,
        "lateness_threshold_per_month_default": settings.lateness_threshold_per_month_default,
        "max_yom_lo_ba_li_per_month_default": settings.max_yom_lo_ba_li_per_month_default,
        "court_chair_name": settings.court_chair_name,
        "court_chair_phone": settings.court_chair_phone
    }

@router.put("/settings", response_model=dict)
def update_settings(
    update_data: SettingsUpdate,
    db: Session = Depends(get_db)
):
    """Update system settings"""
    settings = db.query(Settings).first()
    if not settings:
        # Create settings if they don't exist
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    
    return {
        "id": settings.id,
        "lateness_threshold_per_month_default": settings.lateness_threshold_per_month_default,
        "max_yom_lo_ba_li_per_month_default": settings.max_yom_lo_ba_li_per_month_default,
        "court_chair_name": settings.court_chair_name,
        "court_chair_phone": settings.court_chair_phone,
        "message": "Settings updated successfully"
    }

# Monthly overrides management
@router.post("/monthly-overrides", response_model=dict)
def create_monthly_override(
    override_data: StudentMonthlyOverrideCreate,
    db: Session = Depends(get_db)
):
    """Create a new monthly override for a student"""
    # Check if student exists
    student_service = StudentService(db)
    student = student_service.get_student(override_data.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if override already exists for this student and month
    existing = db.query(StudentMonthlyOverride).filter(
        StudentMonthlyOverride.student_id == override_data.student_id,
        StudentMonthlyOverride.year_month == override_data.year_month
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Monthly override already exists for this student and month"
        )
    
    override = StudentMonthlyOverride(**override_data.dict())
    db.add(override)
    db.commit()
    db.refresh(override)
    
    return {
        "id": override.id,
        "student_name": f"{student.first_name} {student.last_name}",
        "year_month": override.year_month,
        "lateness_threshold_override": override.lateness_threshold_override,
        "max_yom_lo_ba_li_override": override.max_yom_lo_ba_li_override,
        "message": "Monthly override created successfully"
    }

@router.put("/monthly-overrides/{override_id}", response_model=dict)
def update_monthly_override(
    override_id: int,
    update_data: StudentMonthlyOverrideUpdate,
    db: Session = Depends(get_db)
):
    """Update a monthly override"""
    override = db.query(StudentMonthlyOverride).filter(
        StudentMonthlyOverride.id == override_id
    ).first()
    
    if not override:
        raise HTTPException(status_code=404, detail="Monthly override not found")
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(override, field, value)
    
    db.commit()
    db.refresh(override)
    
    return {
        "id": override.id,
        "year_month": override.year_month,
        "lateness_threshold_override": override.lateness_threshold_override,
        "max_yom_lo_ba_li_override": override.max_yom_lo_ba_li_override,
        "message": "Monthly override updated successfully"
    }

@router.delete("/monthly-overrides/{override_id}", response_model=MessageResponse)
def delete_monthly_override(override_id: int, db: Session = Depends(get_db)):
    """Delete a monthly override"""
    override = db.query(StudentMonthlyOverride).filter(
        StudentMonthlyOverride.id == override_id
    ).first()
    
    if not override:
        raise HTTPException(status_code=404, detail="Monthly override not found")
    
    db.delete(override)
    db.commit()
    
    return MessageResponse(message="Monthly override deleted successfully")

# System operations
@router.post("/system/process-monthly-claims")
def process_monthly_claims(year_month: str, db: Session = Depends(get_db)):
    """Process monthly claims for a specific month"""
    claims_service = ClaimsService(db)
    
    try:
        # Validate format YYYY-MM
        from datetime import datetime
        datetime.strptime(year_month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid year-month format. Use YYYY-MM")
    
    created_claims = claims_service.process_monthly_claims(year_month)
    
    return {
        "message": f"Monthly claims processed for {year_month}",
        "claims_created": len(created_claims),
        "year_month": year_month
    }

@router.get("/system/status")
def get_system_status(db: Session = Depends(get_db)):
    """Get overall system status"""
    student_service = StudentService(db)
    claims_service = ClaimsService(db)
    
    # Get counts
    student_counts = student_service.count_students_by_school_level()
    claims_summary = claims_service.get_claims_summary()
    
    # Get settings
    settings = db.query(Settings).first()
    
    return {
        "students": student_counts,
        "claims": claims_summary,
        "settings": {
            "lateness_threshold_default": settings.lateness_threshold_per_month_default if settings else 3,
            "max_yom_lo_ba_li_default": settings.max_yom_lo_ba_li_per_month_default if settings else 2
        } if settings else {},
        "system_health": "healthy"
    }
