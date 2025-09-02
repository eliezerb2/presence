from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, time, datetime
from typing import List, Optional

from .. import models, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/attendance",
    tags=["attendance"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/check-in", response_model=schemas.Attendance)
def check_in_student(
    student_id: int,
    reported_by: schemas.ReportedBy = schemas.ReportedBy.STUDENT,
    db: Session = Depends(get_db)
):
    today = date.today()
    # Check if an attendance record already exists for today
    db_attendance = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.date == today
    ).first()

    if db_attendance:
        # If record exists, update it if not already checked in
        if db_attendance.check_in_time:
            raise HTTPException(status_code=400, detail="Student already checked in today.")
        db_attendance.status = schemas.AttendanceStatus.PRESENT
        db_attendance.sub_status = schemas.SubStatus.NONE # Reset sub_status on manual check-in
        db_attendance.reported_by = reported_by
        db_attendance.check_in_time = datetime.now().time()
    else:
        # Create a new attendance record
        db_attendance = models.Attendance(
            student_id=student_id,
            date=today,
            status=schemas.AttendanceStatus.PRESENT,
            sub_status=schemas.SubStatus.NONE,
            reported_by=reported_by,
            check_in_time=datetime.now().time()
        )
        db.add(db_attendance)

    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.post("/check-out", response_model=schemas.Attendance)
def check_out_student(
    student_id: int,
    reported_by: schemas.ReportedBy = schemas.ReportedBy.STUDENT,
    db: Session = Depends(get_db)
):
    today = date.today()
    db_attendance = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.date == today
    ).first()

    if not db_attendance:
        raise HTTPException(status_code=404, detail="No attendance record found for today. Please check in first.")

    if db_attendance.check_out_time:
        raise HTTPException(status_code=400, detail="Student already checked out today.")

    db_attendance.status = schemas.AttendanceStatus.LEFT
    db_attendance.reported_by = reported_by
    db_attendance.check_out_time = datetime.now().time()
    db_attendance.closed_reason = schemas.ClosedReason.MANUAL # Manual checkout

    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.get("/", response_model=List[schemas.Attendance])
def get_all_attendance_records(db: Session = Depends(get_db)):
    return db.query(models.Attendance).all()

@router.get("/by-date", response_model=List[schemas.Attendance])
def get_attendance_by_date(
    target_date: date, # Expects YYYY-MM-DD
    db: Session = Depends(get_db)
):
    return db.query(models.Attendance).filter(models.Attendance.date == target_date).all()

@router.put("/{attendance_id}", response_model=schemas.Attendance)
def update_attendance_record(
    attendance_id: int,
    attendance_update: schemas.AttendanceUpdate,
    db: Session = Depends(get_db)
):
    db_attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    # Store old state for audit log
    old_data = {k: v for k, v in db_attendance.__dict__.items() if not k.startswith('_')}

    update_data = attendance_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_attendance, key, value)
    
    # Set override_locked and timestamp for manual updates
    db_attendance.override_locked = True
    db_attendance.override_locked_at = datetime.now()

    db.commit()
    db.refresh(db_attendance)

    # Create audit log entry
    new_data = {k: v for k, v in db_attendance.__dict__.items() if not k.startswith('_')}
    audit_entry = models.AuditLog(
        actor="manager", # Assuming manager for manual updates
        action="override_update",
        entity="Attendance",
        entity_id=db_attendance.id,
        before=old_data,
        after=new_data,
        timestamp=datetime.now()
    )
    db.add(audit_entry)
    db.commit()

    return db_attendance
