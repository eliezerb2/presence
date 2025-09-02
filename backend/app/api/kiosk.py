from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List

from ..database import get_db
from ..services.student_service import StudentService
from ..services.attendance_service import AttendanceService
from ..schemas import StudentSearch, StudentSearchResult, AttendanceAction, MessageResponse
from ..models import AttendanceStatus, ReportedBy

router = APIRouter(prefix="/kiosk", tags=["kiosk"])

@router.post("/search", response_model=List[StudentSearchResult])
def search_students(search_data: StudentSearch, db: Session = Depends(get_db)):
    """Search for students by number, nickname, first name, or last name"""
    student_service = StudentService(db)
    students = student_service.search_students(search_data.query)
    
    # Convert to search results
    results = []
    for student in students:
        results.append(StudentSearchResult(
            id=student.id,
            student_number=student.student_number,
            nickname=student.nickname,
            first_name=student.first_name,
            last_name=student.last_name,
            school_level=student.school_level
        ))
    
    return results

@router.post("/check-in", response_model=MessageResponse)
def check_in_student(action: AttendanceAction, db: Session = Depends(get_db)):
    """Student check-in action"""
    if action.action != "check_in":
        raise HTTPException(status_code=400, detail="Invalid action for check-in endpoint")
    
    student_service = StudentService(db)
    attendance_service = AttendanceService(db)
    
    # Verify student exists
    student = student_service.get_student(action.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if student.activity_status != "פעיל":
        raise HTTPException(status_code=400, detail="Student is not active")
    
    today = date.today()
    
    # Check if attendance record already exists
    existing_attendance = attendance_service.get_attendance_by_student_date(
        action.student_id, today
    )
    
    if existing_attendance:
        # Update existing record
        from ..schemas import AttendanceUpdate
        update_data = AttendanceUpdate(
            status=AttendanceStatus.PRESENT,
            sub_status="ללא",
            reported_by=ReportedBy.STUDENT,
            check_in_time=datetime.now()
        )
        
        attendance_service.update_attendance(
            existing_attendance.id, update_data, "student"
        )
        
        return MessageResponse(
            message=f"Check-in recorded for {student.first_name} {student.last_name}"
        )
    else:
        # Create new attendance record
        from ..schemas import AttendanceCreate
        attendance_data = AttendanceCreate(
            student_id=action.student_id,
            date=today,
            status=AttendanceStatus.PRESENT,
            sub_status="ללא",
            reported_by=ReportedBy.STUDENT,
            check_in_time=datetime.now()
        )
        
        attendance_service.create_attendance(attendance_data)
        
        return MessageResponse(
            message=f"Check-in recorded for {student.first_name} {student.last_name}"
        )

@router.post("/check-out", response_model=MessageResponse)
def check_out_student(action: AttendanceAction, db: Session = Depends(get_db)):
    """Student check-out action"""
    if action.action != "check_out":
        raise HTTPException(status_code=400, detail="Invalid action for check-out endpoint")
    
    student_service = StudentService(db)
    attendance_service = AttendanceService(db)
    
    # Verify student exists
    student = student_service.get_student(action.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if student.activity_status != "פעיל":
        raise HTTPException(status_code=400, detail="Student is not active")
    
    today = date.today()
    
    # Check if attendance record exists
    existing_attendance = attendance_service.get_attendance_by_student_date(
        action.student_id, today
    )
    
    if not existing_attendance:
        raise HTTPException(status_code=400, detail="No check-in record found for today")
    
    # Update attendance record
    from ..schemas import AttendanceUpdate
    update_data = AttendanceUpdate(
        status=AttendanceStatus.LEFT,
        sub_status="ללא",
        reported_by=ReportedBy.STUDENT,
        check_out_time=datetime.now()
    )
    
    attendance_service.update_attendance(
        existing_attendance.id, update_data, "student"
    )
    
    return MessageResponse(
        message=f"Check-out recorded for {student.first_name} {student.last_name}"
    )

@router.get("/status/{student_id}")
def get_student_status(student_id: int, db: Session = Depends(get_db)):
    """Get current day attendance status for a student"""
    student_service = StudentService(db)
    attendance_service = AttendanceService(db)
    
    # Verify student exists
    student = student_service.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    today = date.today()
    
    # Get attendance record
    attendance = attendance_service.get_attendance_by_student_date(student_id, today)
    
    if not attendance:
        return {
            "student_name": f"{student.first_name} {student.last_name}",
            "status": "לא דיווח",
            "check_in_time": None,
            "check_out_time": None
        }
    
    return {
        "student_name": f"{student.first_name} {student.last_name}",
        "status": attendance.status,
        "sub_status": attendance.sub_status,
        "check_in_time": attendance.check_in_time,
        "check_out_time": attendance.check_out_time
    }
