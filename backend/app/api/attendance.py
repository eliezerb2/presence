from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from ..models.base import get_db
from ..models.attendance import Attendance
from ..models.student import Student
from ..schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceResponse
from ..services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[AttendanceResponse])
def get_attendance(
    date_filter: Optional[date] = None,
    student_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Attendance)
    
    if date_filter:
        query = query.filter(Attendance.date == date_filter)
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    
    attendance = query.offset(skip).limit(limit).all()
    return attendance

@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance_record(attendance_id: int, db: Session = Depends(get_db)):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return attendance

@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db)):
    # Check if student exists
    student = db.query(Student).filter(Student.id == attendance.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if attendance already exists for this student and date
    existing = db.query(Attendance).filter(
        Attendance.student_id == attendance.student_id,
        Attendance.date == attendance.date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already exists for this student and date")
    
    db_attendance = Attendance(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    
    log_audit(db, "manager", "create", "attendance", db_attendance.id, None, attendance.dict())
    
    return db_attendance

@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(attendance_id: int, attendance: AttendanceUpdate, db: Session = Depends(get_db)):
    db_attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Store original data for audit
    original_data = {
        "status": db_attendance.status.value if db_attendance.status else None,
        "sub_status": db_attendance.sub_status.value if db_attendance.sub_status else None,
        "reported_by": db_attendance.reported_by.value if db_attendance.reported_by else None,
        "check_in_time": db_attendance.check_in_time.isoformat() if db_attendance.check_in_time else None,
        "check_out_time": db_attendance.check_out_time.isoformat() if db_attendance.check_out_time else None,
        "closed_reason": db_attendance.closed_reason.value if db_attendance.closed_reason else None,
        "override_locked": db_attendance.override_locked
    }
    
    # Update fields
    update_data = attendance.dict(exclude_unset=True)
    
    # If this is a manager override, set override_locked
    if any(field in update_data for field in ["status", "sub_status", "check_in_time", "check_out_time"]):
        update_data["override_locked"] = True
        update_data["override_locked_at"] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_attendance, field, value)
    
    db.commit()
    db.refresh(db_attendance)
    
    log_audit(db, "manager", "override_update", "attendance", attendance_id, original_data, update_data)
    
    return db_attendance

@router.delete("/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    db_attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    original_data = {
        "student_id": db_attendance.student_id,
        "date": db_attendance.date.isoformat(),
        "status": db_attendance.status.value if db_attendance.status else None,
        "sub_status": db_attendance.sub_status.value if db_attendance.sub_status else None
    }
    
    db.delete(db_attendance)
    db.commit()
    
    log_audit(db, "manager", "delete", "attendance", attendance_id, original_data, None)
    
    return {"message": "Attendance record deleted successfully"}

@router.get("/daily/{date_str}", response_model=List[AttendanceResponse])
def get_daily_attendance(date_str: str, db: Session = Depends(get_db)):
    try:
        attendance_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    attendance = db.query(Attendance).filter(Attendance.date == attendance_date).all()
    return attendance