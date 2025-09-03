from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models import Student, Attendance, AttendanceStatus, SubStatus, ReportedBy
from datetime import datetime, date
from typing import List

router = APIRouter()

@router.get("/search/{query}")
async def search_students(query: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Student).where(
        or_(
            Student.student_number.ilike(f"%{query}%"),
            Student.nickname.ilike(f"%{query}%"),
            Student.first_name.ilike(f"%{query}%"),
            Student.last_name.ilike(f"%{query}%")
        )
    ).limit(10)
    
    result = await db.execute(stmt)
    students = result.scalars().all()
    
    return [{"id": s.id, "student_number": s.student_number, "nickname": s.nickname, 
             "first_name": s.first_name, "last_name": s.last_name} for s in students]

@router.post("/checkin/{student_id}")
async def check_in(student_id: int, db: AsyncSession = Depends(get_db)):
    today = date.today()
    
    stmt = select(Attendance).where(
        Attendance.student_id == student_id,
        Attendance.date == today
    )
    result = await db.execute(stmt)
    attendance = result.scalar_one_or_none()
    
    if not attendance:
        attendance = Attendance(
            student_id=student_id,
            date=today,
            status=AttendanceStatus.PRESENT,
            sub_status=SubStatus.NONE,
            reported_by=ReportedBy.STUDENT,
            check_in_time=datetime.now()
        )
        db.add(attendance)
    else:
        if not attendance.override_locked:
            attendance.status = AttendanceStatus.PRESENT
            attendance.reported_by = ReportedBy.STUDENT
            attendance.check_in_time = datetime.now()
    
    await db.commit()
    return {"message": "נרשמת בהצלחה"}

@router.post("/checkout/{student_id}")
async def check_out(student_id: int, db: AsyncSession = Depends(get_db)):
    today = date.today()
    
    stmt = select(Attendance).where(
        Attendance.student_id == student_id,
        Attendance.date == today
    )
    result = await db.execute(stmt)
    attendance = result.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="לא נמצא רישום נוכחות להיום")
    
    if not attendance.override_locked:
        attendance.status = AttendanceStatus.LEFT
        attendance.check_out_time = datetime.now()
        attendance.reported_by = ReportedBy.STUDENT
    
    await db.commit()
    return {"message": "יציאה נרשמה בהצלחה"}