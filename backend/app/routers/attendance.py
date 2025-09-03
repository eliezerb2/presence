from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, extract
from app.database import get_db
from app.models import Attendance, Student, AttendanceStatus, SubStatus, ReportedBy
from datetime import date, datetime
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    sub_status: Optional[SubStatus] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None

@router.get("/daily")
async def get_daily_attendance(target_date: Optional[date] = None, db: AsyncSession = Depends(get_db)):
    if not target_date:
        target_date = date.today()
    
    stmt = select(Attendance, Student).join(Student).where(Attendance.date == target_date)
    result = await db.execute(stmt)
    
    attendance_data = []
    for attendance, student in result:
        attendance_data.append({
            "id": attendance.id,
            "student": {
                "id": student.id,
                "student_number": student.student_number,
                "nickname": student.nickname,
                "first_name": student.first_name,
                "last_name": student.last_name
            },
            "status": attendance.status,
            "sub_status": attendance.sub_status,
            "reported_by": attendance.reported_by,
            "check_in_time": attendance.check_in_time,
            "check_out_time": attendance.check_out_time,
            "override_locked": attendance.override_locked
        })
    
    return attendance_data

@router.put("/{attendance_id}")
async def update_attendance(attendance_id: int, update: AttendanceUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Attendance).where(Attendance.id == attendance_id)
    result = await db.execute(stmt)
    attendance = result.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    for field, value in update.dict(exclude_unset=True).items():
        setattr(attendance, field, value)
    
    attendance.override_locked = True
    attendance.override_locked_at = datetime.now()
    attendance.reported_by = ReportedBy.MANAGER
    
    await db.commit()
    return attendance

@router.get("/monthly/{student_id}")
async def get_monthly_stats(student_id: int, year: int, month: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Attendance).where(
        and_(
            Attendance.student_id == student_id,
            extract('year', Attendance.date) == year,
            extract('month', Attendance.date) == month
        )
    )
    result = await db.execute(stmt)
    attendances = result.scalars().all()
    
    late_count = sum(1 for a in attendances if a.sub_status == SubStatus.LATE)
    yom_lo_ba_li_count = sum(1 for a in attendances if a.status == AttendanceStatus.YOM_LO_BA_LI)
    
    return {
        "student_id": student_id,
        "year": year,
        "month": month,
        "late_count": late_count,
        "yom_lo_ba_li_count": yom_lo_ba_li_count,
        "total_days": len(attendances)
    }