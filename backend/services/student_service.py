from sqlalchemy.orm import Session
from database import models
from backend import schemas
from typing import List, Optional

class StudentService:
    def get_student(self, db: Session, student_id: int):
        return db.query(models.Student).filter(models.Student.id == student_id).first()

    def get_students(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Student).offset(skip).limit(limit).all()

    def create_student(self, db: Session, student: schemas.StudentCreate):
        db_student = models.Student(**student.dict())
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
        return db_student

    def update_student(self, db: Session, student_id: int, student: schemas.StudentUpdate):
        db_student = self.get_student(db, student_id)
        if db_student:
            for key, value in student.dict(exclude_unset=True).items():
                setattr(db_student, key, value)
            db.commit()
            db.refresh(db_student)
        return db_student

    def delete_student(self, db: Session, student_id: int):
        db_student = self.get_student(db, student_id)
        if db_student:
            db.delete(db_student)
            db.commit()
        return db_student

    def search_students(self, db: Session, query: str) -> List[models.Student]:
        return (
            db.query(models.Student)
            .filter(
                (models.Student.student_number.ilike(f"%{query}%")) |
                (models.Student.nickname.ilike(f"%{query}%")) |
                (models.Student.first_name.ilike(f"%{query}%")) |
                (models.Student.last_name.ilike(f"%{query}%"))
            )
            .all()
        )
