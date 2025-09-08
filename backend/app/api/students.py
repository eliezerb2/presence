from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..models.base import get_db
from ..models.student import Student
from ..schemas.student import StudentCreate, StudentUpdate, StudentResponse
from ..services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[StudentResponse])
def get_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    students = db.query(Student).offset(skip).limit(limit).all()
    return students

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    # Check if student_number already exists
    existing = db.query(Student).filter(Student.student_number == student.student_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student number already exists")
    
    # Check if nickname already exists (if provided)
    if student.nickname:
        existing_nickname = db.query(Student).filter(Student.nickname == student.nickname).first()
        if existing_nickname:
            raise HTTPException(status_code=400, detail="Nickname already exists")
    
    db_student = Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    log_audit(db, "manager", "create", "student", db_student.id, None, student.dict())
    
    return db_student

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, student: StudentUpdate, db: Session = Depends(get_db)):
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Store original data for audit
    original_data = {
        "student_number": db_student.student_number,
        "nickname": db_student.nickname,
        "first_name": db_student.first_name,
        "last_name": db_student.last_name,
        "phone_number": db_student.phone_number,
        "school_level": db_student.school_level.value if db_student.school_level else None,
        "activity_status": db_student.activity_status.value if db_student.activity_status else None
    }
    
    # Check for unique constraints
    if student.student_number and student.student_number != db_student.student_number:
        existing = db.query(Student).filter(Student.student_number == student.student_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Student number already exists")
    
    if student.nickname and student.nickname != db_student.nickname:
        existing_nickname = db.query(Student).filter(Student.nickname == student.nickname).first()
        if existing_nickname:
            raise HTTPException(status_code=400, detail="Nickname already exists")
    
    # Update fields
    update_data = student.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_student, field, value)
    
    db.commit()
    db.refresh(db_student)
    
    log_audit(db, "manager", "update", "student", student_id, original_data, update_data)
    
    return db_student

@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    original_data = {
        "student_number": db_student.student_number,
        "nickname": db_student.nickname,
        "first_name": db_student.first_name,
        "last_name": db_student.last_name,
        "phone_number": db_student.phone_number,
        "school_level": db_student.school_level.value if db_student.school_level else None,
        "activity_status": db_student.activity_status.value if db_student.activity_status else None
    }
    
    db.delete(db_student)
    db.commit()
    
    log_audit(db, "manager", "delete", "student", student_id, original_data, None)
    
    return {"message": "Student deleted successfully"}

@router.get("/search/{query}", response_model=List[StudentResponse])
def search_students(query: str, db: Session = Depends(get_db)):
    students = db.query(Student).filter(
        (Student.student_number.ilike(f"%{query}%")) |
        (Student.nickname.ilike(f"%{query}%")) |
        (Student.first_name.ilike(f"%{query}%")) |
        (Student.last_name.ilike(f"%{query}%"))
    ).all()
    return students