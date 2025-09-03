from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Student, SchoolLevel, ActivityStatus
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class StudentCreate(BaseModel):
    student_number: str
    nickname: Optional[str] = None
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    school_level: SchoolLevel
    activity_status: ActivityStatus = ActivityStatus.ACTIVE

class StudentUpdate(BaseModel):
    nickname: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    school_level: Optional[SchoolLevel] = None
    activity_status: Optional[ActivityStatus] = None

@router.get("/")
async def get_students(db: AsyncSession = Depends(get_db)):
    stmt = select(Student)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/")
async def create_student(student: StudentCreate, db: AsyncSession = Depends(get_db)):
    db_student = Student(**student.dict())
    db.add(db_student)
    await db.commit()
    await db.refresh(db_student)
    return db_student

@router.get("/{student_id}")
async def get_student(student_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Student).where(Student.id == student_id)
    result = await db.execute(stmt)
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{student_id}")
async def update_student(student_id: int, student_update: StudentUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Student).where(Student.id == student_id)
    result = await db.execute(stmt)
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    for field, value in student_update.dict(exclude_unset=True).items():
        setattr(student, field, value)
    
    await db.commit()
    return student

@router.delete("/{student_id}")
async def delete_student(student_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Student).where(Student.id == student_id)
    result = await db.execute(stmt)
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await db.delete(student)
    await db.commit()
    return {"message": "Student deleted"}