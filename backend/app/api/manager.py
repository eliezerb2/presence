from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Dict, Any
from datetime import date, datetime
from io import StringIO
import csv
from ..models.base import get_db
from ..models.attendance import Attendance, AttendanceStatus, SubStatus
from ..models.student import Student, ActivityStatus
from ..models.claim import Claim
from ..models.settings import Settings
from ..models.student_monthly_override import StudentMonthlyOverride

router = APIRouter()

@router.get("/daily-attendance/{date_str}")
def get_daily_attendance_summary(date_str: str, db: Session = Depends(get_db)):
    """Get daily attendance summary for manager dashboard"""
    try:
        attendance_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get all active students
    active_students = db.query(Student).filter(Student.activity_status == ActivityStatus.ACTIVE).all()
    
    # Get attendance records for the date
    attendance_records = db.query(Attendance).filter(Attendance.date == attendance_date).all()
    attendance_dict = {record.student_id: record for record in attendance_records}
    
    summary = []
    for student in active_students:
        attendance = attendance_dict.get(student.id)
        summary.append({
            "student_id": student.id,
            "student_number": student.student_number,
            "nickname": student.nickname,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "attendance": {
                "id": attendance.id if attendance else None,
                "status": attendance.status.value if attendance else AttendanceStatus.NOT_REPORTED.value,
                "sub_status": attendance.sub_status.value if attendance else SubStatus.NONE.value,
                "reported_by": attendance.reported_by.value if attendance else None,
                "check_in_time": attendance.check_in_time.isoformat() if attendance and attendance.check_in_time else None,
                "check_out_time": attendance.check_out_time.isoformat() if attendance and attendance.check_out_time else None,
                "override_locked": attendance.override_locked if attendance else False
            }
        })
    
    return summary

@router.get("/monthly-stats/{student_id}/{year_month}")
def get_monthly_stats(student_id: int, year_month: str, db: Session = Depends(get_db)):
    """Get monthly statistics for a student"""
    try:
        year, month = map(int, year_month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid year-month format. Use YYYY-MM")
    
    # Get student
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get attendance records for the month
    attendance_records = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        extract('year', Attendance.date) == year,
        extract('month', Attendance.date) == month
    ).all()
    
    # Calculate statistics
    late_count = sum(1 for record in attendance_records if record.sub_status == SubStatus.LATE)
    yom_lo_ba_li_count = sum(1 for record in attendance_records if record.status == AttendanceStatus.DIDNT_FEEL_LIKE_IT)
    
    # Get thresholds
    settings = db.query(Settings).first()
    monthly_override = db.query(StudentMonthlyOverride).filter(
        StudentMonthlyOverride.student_id == student_id,
        StudentMonthlyOverride.year_month == year_month
    ).first()
    
    late_threshold = (monthly_override.lateness_threshold_override 
                     if monthly_override and monthly_override.lateness_threshold_override is not None
                     else settings.lateness_threshold_per_month_default if settings else 5)
    
    yom_lo_ba_li_threshold = (monthly_override.max_yom_lo_ba_li_override
                             if monthly_override and monthly_override.max_yom_lo_ba_li_override is not None
                             else settings.max_yom_lo_ba_li_per_month_default if settings else 2)
    
    return {
        "student_id": student_id,
        "year_month": year_month,
        "late_count": late_count,
        "late_threshold": late_threshold,
        "yom_lo_ba_li_count": yom_lo_ba_li_count,
        "yom_lo_ba_li_threshold": yom_lo_ba_li_threshold,
        "late_exceeded": late_count > late_threshold,
        "yom_lo_ba_li_exceeded": yom_lo_ba_li_count >= yom_lo_ba_li_threshold
    }

@router.get("/export-csv/{date_str}")
def export_daily_csv(date_str: str, db: Session = Depends(get_db)):
    """Export daily attendance as CSV"""
    try:
        attendance_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get attendance data
    query = db.query(Student, Attendance).outerjoin(
        Attendance, 
        (Student.id == Attendance.student_id) & (Attendance.date == attendance_date)
    ).filter(Student.activity_status == ActivityStatus.ACTIVE)
    
    results = query.all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Student Number", "Nickname", "First Name", "Last Name",
        "Status", "Sub Status", "Reported By", "Check In Time", "Check Out Time"
    ])
    
    # Write data
    for student, attendance in results:
        writer.writerow([
            student.student_number,
            student.nickname or "",
            student.first_name,
            student.last_name,
            attendance.status.value if attendance else AttendanceStatus.NOT_REPORTED.value,
            attendance.sub_status.value if attendance else SubStatus.NONE.value,
            attendance.reported_by.value if attendance else "",
            attendance.check_in_time.strftime("%H:%M:%S") if attendance and attendance.check_in_time else "",
            attendance.check_out_time.strftime("%H:%M:%S") if attendance and attendance.check_out_time else ""
        ])
    
    csv_content = output.getvalue()
    output.close()
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_{date_str}.csv"}
    )

@router.get("/claims-summary")
def get_claims_summary(db: Session = Depends(get_db)):
    """Get summary of open claims"""
    open_claims = db.query(Claim).filter(Claim.status == "open").all()
    
    summary = []
    for claim in open_claims:
        student = db.query(Student).filter(Student.id == claim.student_id).first()
        summary.append({
            "claim_id": claim.id,
            "student_id": claim.student_id,
            "student_name": f"{student.first_name} {student.last_name}" if student else "Unknown",
            "student_number": student.student_number if student else "Unknown",
            "date_opened": claim.date_opened.isoformat(),
            "reason": claim.reason.value,
            "notified_to": claim.notified_to
        })
    
    return summary