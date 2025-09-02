from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Optional

from ..database import get_db
from ..services.attendance_service import AttendanceService
from ..services.student_service import StudentService
from ..services.claims_service import ClaimsService
from ..schemas import (
    AttendanceUpdate, DailyAttendanceSummary, MonthlyStatistics,
    MessageResponse
)

router = APIRouter(prefix="/manager", tags=["manager"])

@router.get("/attendance/daily/{date_str}", response_model=List[dict])
def get_daily_attendance(date_str: str, db: Session = Depends(get_db)):
    """Get daily attendance for a specific date"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    attendance_service = AttendanceService(db)
    attendance_records = attendance_service.get_daily_attendance(target_date)
    
    # Format response
    result = []
    for record in attendance_records:
        result.append({
            "id": record.id,
            "student_id": record.student_id,
            "student_name": f"{record.student.first_name} {record.student.last_name}",
            "student_number": record.student.student_number,
            "nickname": record.student.nickname,
            "school_level": record.student.school_level,
            "date": record.date,
            "status": record.status,
            "sub_status": record.sub_status,
            "reported_by": record.reported_by,
            "check_in_time": record.check_in_time,
            "check_out_time": record.check_out_time,
            "closed_reason": record.closed_reason,
            "override_locked": record.override_locked,
            "override_locked_at": record.override_locked_at
        })
    
    return result

@router.get("/attendance/summary/{date_str}", response_model=DailyAttendanceSummary)
def get_daily_summary(date_str: str, db: Session = Depends(get_db)):
    """Get daily attendance summary statistics"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    attendance_service = AttendanceService(db)
    summary = attendance_service.get_daily_summary(target_date)
    
    return DailyAttendanceSummary(**summary)

@router.put("/attendance/{attendance_id}", response_model=dict)
def update_attendance(
    attendance_id: int, 
    update_data: AttendanceUpdate, 
    db: Session = Depends(get_db)
):
    """Update attendance record (manager override)"""
    attendance_service = AttendanceService(db)
    
    updated = attendance_service.update_attendance(attendance_id, update_data, "manager")
    if not updated:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    return {
        "id": updated.id,
        "student_name": f"{updated.student.first_name} {updated.student.last_name}",
        "status": updated.status,
        "sub_status": updated.sub_status,
        "reported_by": updated.reported_by,
        "check_in_time": updated.check_in_time,
        "check_out_time": updated.check_out_time,
        "override_locked": updated.override_locked,
        "message": "Attendance updated successfully"
    }

@router.get("/students", response_model=List[dict])
def get_students(active_only: bool = True, db: Session = Depends(get_db)):
    """Get all students"""
    student_service = StudentService(db)
    students = student_service.get_all_students(active_only)
    
    result = []
    for student in students:
        result.append({
            "id": student.id,
            "student_number": student.student_number,
            "nickname": student.nickname,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "phone_number": student.phone_number,
            "school_level": student.school_level,
            "activity_status": student.activity_status
        })
    
    return result

@router.get("/students/search")
def search_students(query: str, db: Session = Depends(get_db)):
    """Search students"""
    student_service = StudentService(db)
    students = student_service.search_students(query)
    
    result = []
    for student in students:
        result.append({
            "id": student.id,
            "student_number": student.student_number,
            "nickname": student.nickname,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "school_level": student.school_level
        })
    
    return result

@router.get("/statistics/monthly/{year_month}", response_model=List[MonthlyStatistics])
def get_monthly_statistics(year_month: str, db: Session = Depends(get_db)):
    """Get monthly statistics for all students"""
    try:
        # Validate format YYYY-MM
        datetime.strptime(year_month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid year-month format. Use YYYY-MM")
    
    claims_service = ClaimsService(db)
    statistics = claims_service.calculate_monthly_statistics(year_month)
    
    return [MonthlyStatistics(**stat) for stat in statistics]

@router.get("/claims", response_model=List[dict])
def get_claims(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Get claims with optional status filter"""
    claims_service = ClaimsService(db)
    
    if status == "open":
        claims = claims_service.get_open_claims()
    elif status == "closed":
        claims = claims_service.get_open_claims()  # This should be get_closed_claims
    else:
        # Get all claims
        claims = claims_service.get_open_claims()  # This should be get_all_claims
    
    result = []
    for claim in claims:
        result.append({
            "id": claim.id,
            "student_id": claim.student_id,
            "student_name": f"{claim.student.first_name} {claim.student.last_name}",
            "date_opened": claim.date_opened,
            "reason": claim.reason,
            "notified_to": claim.notified_to,
            "status": claim.status
        })
    
    return result

@router.get("/claims/summary", response_model=dict)
def get_claims_summary(db: Session = Depends(get_db)):
    """Get claims summary statistics"""
    claims_service = ClaimsService(db)
    return claims_service.get_claims_summary()

@router.put("/claims/{claim_id}/close", response_model=MessageResponse)
def close_claim(claim_id: int, db: Session = Depends(get_db)):
    """Close a claim"""
    claims_service = ClaimsService(db)
    
    updated = claims_service.close_claim(claim_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    return MessageResponse(message="Claim closed successfully")

@router.get("/dashboard/today")
def get_today_dashboard(db: Session = Depends(get_db)):
    """Get today's dashboard data"""
    today = date.today()
    
    attendance_service = AttendanceService(db)
    student_service = StudentService(db)
    claims_service = ClaimsService(db)
    
    # Get daily summary
    daily_summary = attendance_service.get_daily_summary(today)
    
    # Get student counts
    student_counts = student_service.count_students_by_school_level()
    
    # Get open claims count
    open_claims = len(claims_service.get_open_claims())
    
    return {
        "date": today.isoformat(),
        "attendance_summary": daily_summary,
        "student_counts": student_counts,
        "open_claims": open_claims,
        "is_school_day": attendance_service.is_school_day(today)
    }

@router.post("/attendance/process-automation")
def process_automation(db: Session = Depends(get_db)):
    """Manually trigger automation processes for today"""
    today = date.today()
    attendance_service = AttendanceService(db)
    
    results = {
        "permanent_absences": [],
        "late_attendance": [],
        "yom_lo_ba_li": [],
        "end_of_day": []
    }
    
    # Process permanent absences
    permanent_absences = attendance_service.process_permanent_absences(today)
    results["permanent_absences"] = [pa.student.first_name for pa in permanent_absences]
    
    # Process late attendance
    late_attendance = attendance_service.process_late_attendance(today)
    results["late_attendance"] = [la.student.first_name for la in late_attendance]
    
    # Process yom lo ba li
    yom_lo_ba_li = attendance_service.process_yom_lo_ba_li(today)
    results["yom_lo_ba_li"] = [y.student.first_name for y in yom_lo_ba_li]
    
    # Process end of day
    end_of_day = attendance_service.process_end_of_day(today)
    results["end_of_day"] = [e.student.first_name for e in end_of_day]
    
    return {
        "message": "Automation processes completed",
        "date": today.isoformat(),
        "results": results
    }
