from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..models.base import get_db
from ..models.permanent_absence import PermanentAbsence
from ..models.student import Student
from ..schemas.permanent_absence import PermanentAbsenceCreate, PermanentAbsenceUpdate, PermanentAbsenceResponse
from ..services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[PermanentAbsenceResponse])
def get_permanent_absences(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    absences = db.query(PermanentAbsence).offset(skip).limit(limit).all()
    return absences

@router.get("/{absence_id}", response_model=PermanentAbsenceResponse)
def get_permanent_absence(absence_id: int, db: Session = Depends(get_db)):
    absence = db.query(PermanentAbsence).filter(PermanentAbsence.id == absence_id).first()
    if not absence:
        raise HTTPException(status_code=404, detail="Permanent absence not found")
    return absence

@router.post("/", response_model=PermanentAbsenceResponse, status_code=status.HTTP_201_CREATED)
def create_permanent_absence(absence: PermanentAbsenceCreate, db: Session = Depends(get_db)):
    # Check if student exists
    student = db.query(Student).filter(Student.id == absence.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if permanent absence already exists for this student and weekday
    existing = db.query(PermanentAbsence).filter(
        PermanentAbsence.student_id == absence.student_id,
        PermanentAbsence.weekday == absence.weekday
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Permanent absence already exists for this student and weekday")
    
    db_absence = PermanentAbsence(**absence.dict())
    db.add(db_absence)
    db.commit()
    db.refresh(db_absence)
    
    log_audit(db, "manager", "create", "permanent_absence", db_absence.id, None, absence.dict())
    
    return db_absence

@router.put("/{absence_id}", response_model=PermanentAbsenceResponse)
def update_permanent_absence(absence_id: int, absence: PermanentAbsenceUpdate, db: Session = Depends(get_db)):
    db_absence = db.query(PermanentAbsence).filter(PermanentAbsence.id == absence_id).first()
    if not db_absence:
        raise HTTPException(status_code=404, detail="Permanent absence not found")
    
    original_data = {
        "weekday": db_absence.weekday.value if db_absence.weekday else None,
        "reason": db_absence.reason
    }
    
    # Check for unique constraint if weekday is being updated
    if absence.weekday and absence.weekday != db_absence.weekday:
        existing = db.query(PermanentAbsence).filter(
            PermanentAbsence.student_id == db_absence.student_id,
            PermanentAbsence.weekday == absence.weekday
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Permanent absence already exists for this student and weekday")
    
    update_data = absence.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_absence, field, value)
    
    db.commit()
    db.refresh(db_absence)
    
    log_audit(db, "manager", "update", "permanent_absence", absence_id, original_data, update_data)
    
    return db_absence

@router.delete("/{absence_id}")
def delete_permanent_absence(absence_id: int, db: Session = Depends(get_db)):
    db_absence = db.query(PermanentAbsence).filter(PermanentAbsence.id == absence_id).first()
    if not db_absence:
        raise HTTPException(status_code=404, detail="Permanent absence not found")
    
    original_data = {
        "student_id": db_absence.student_id,
        "weekday": db_absence.weekday.value if db_absence.weekday else None,
        "reason": db_absence.reason
    }
    
    db.delete(db_absence)
    db.commit()
    
    log_audit(db, "manager", "delete", "permanent_absence", absence_id, original_data, None)
    
    return {"message": "Permanent absence deleted successfully"}

@router.get("/student/{student_id}", response_model=List[PermanentAbsenceResponse])
def get_student_permanent_absences(student_id: int, db: Session = Depends(get_db)):
    absences = db.query(PermanentAbsence).filter(PermanentAbsence.student_id == student_id).all()
    return absences