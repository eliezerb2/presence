from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
from ..models.base import get_db
from ..models.student import Student, ActivityStatus
from ..models.attendance import Attendance, AttendanceStatus, SubStatus, ReportedBy
from ..schemas.student import StudentResponse
from ..services.audit_service import log_audit

router = APIRouter()

@router.get("/search/{query}", response_model=List[StudentResponse])
def search_students_kiosk(query: str, db: Session = Depends(get_db)):
    """Search students for kiosk interface"""
    students = db.query(Student).filter(
        Student.activity_status == ActivityStatus.ACTIVE
    ).filter(
        (Student.student_number.ilike(f"%{query}%")) |
        (Student.nickname.ilike(f"%{query}%")) |
        (Student.first_name.ilike(f"%{query}%")) |
        (Student.last_name.ilike(f"%{query}%"))
    ).limit(10).all()
    return students

@router.post("/checkin/{student_id}")
def check_in_student(student_id: int, db: Session = Depends(get_db)):
    """Check in a student"""
    # Verify student exists and is active
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.activity_status == ActivityStatus.ACTIVE
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or inactive")
    
    today = date.today()
    
    # Check if attendance record exists
    attendance = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.date == today
    ).first()
    
    if attendance:
        # Update existing record if not locked
        if attendance.override_locked:
            raise HTTPException(status_code=400, detail="Attendance record is locked by manager")
        
        original_data = {
            "status": attendance.status.value,
            "check_in_time": attendance.check_in_time.isoformat() if attendance.check_in_time else None
        }
        
        attendance.status = AttendanceStatus.PRESENT
        attendance.sub_status = SubStatus.NONE
        attendance.reported_by = ReportedBy.STUDENT
        attendance.check_in_time = datetime.now()
        
        new_data = {
            "status": attendance.status.value,
            "check_in_time": attendance.check_in_time.isoformat()
        }
        
        log_audit(db, "student", "checkin", "attendance", attendance.id, original_data, new_data)
    else:
        # Create new attendance record
        attendance = Attendance(
            student_id=student_id,
            date=today,
            status=AttendanceStatus.PRESENT,
            sub_status=SubStatus.NONE,
            reported_by=ReportedBy.STUDENT,
            check_in_time=datetime.now()
        )
        db.add(attendance)
        
        log_audit(db, "student", "checkin", "attendance", student_id, None, {
            "status": AttendanceStatus.PRESENT.value,
            "check_in_time": datetime.now().isoformat()
        })
    
    db.commit()
    return {"message": f"Student {student.first_name} {student.last_name} checked in successfully"}

@router.post("/checkout/{student_id}")
def check_out_student(student_id: int, db: Session = Depends(get_db)):
    """Check out a student"""
    # Verify student exists and is active
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.activity_status == ActivityStatus.ACTIVE
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or inactive")
    
    today = date.today()
    
    # Find attendance record
    attendance = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.date == today
    ).first()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="No check-in record found for today")
    
    if attendance.override_locked:
        raise HTTPException(status_code=400, detail="Attendance record is locked by manager")
    
    if attendance.status == AttendanceStatus.LEFT:
        raise HTTPException(status_code=400, detail="Student already checked out")
    
    original_data = {
        "status": attendance.status.value,
        "check_out_time": attendance.check_out_time.isoformat() if attendance.check_out_time else None
    }
    
    attendance.status = AttendanceStatus.LEFT
    attendance.reported_by = ReportedBy.STUDENT
    attendance.check_out_time = datetime.now()
    
    new_data = {
        "status": attendance.status.value,
        "check_out_time": attendance.check_out_time.isoformat()
    }
    
    db.commit()
    
    log_audit(db, "student", "checkout", "attendance", attendance.id, original_data, new_data)
    
    return {"message": f"Student {student.first_name} {student.last_name} checked out successfully"}