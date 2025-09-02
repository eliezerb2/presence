from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
import json

from ..models import Student, Attendance, PermanentAbsence
from ..schemas import StudentCreate, StudentUpdate
from .audit_service import AuditService

class StudentService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_service = AuditService(db)
    
    def create_student(self, student_data: StudentCreate) -> Student:
        """Create a new student"""
        student = Student(**student_data.dict())
        self.db.add(student)
        self.db.commit()
        self.db.refresh(student)
        
        # Log the creation
        self.audit_service.log_action(
            actor="manager",
            action="create_student",
            entity="student",
            entity_id=student.id,
            after=json.dumps(student_data.dict())
        )
        
        return student
    
    def get_student(self, student_id: int) -> Optional[Student]:
        """Get a student by ID"""
        return self.db.query(Student).filter(Student.id == student_id).first()
    
    def get_student_by_number(self, student_number: str) -> Optional[Student]:
        """Get a student by student number"""
        return self.db.query(Student).filter(Student.student_number == student_number).first()
    
    def get_student_by_nickname(self, nickname: str) -> Optional[Student]:
        """Get a student by nickname"""
        return self.db.query(Student).filter(Student.nickname == nickname).first()
    
    def search_students(self, query: str) -> List[Student]:
        """Search students by number, nickname, first name, or last name"""
        return self.db.query(Student).filter(
            or_(
                Student.student_number.contains(query),
                Student.nickname.contains(query),
                Student.first_name.contains(query),
                Student.last_name.contains(query)
            )
        ).filter(Student.activity_status == "פעיל").all()
    
    def get_all_students(self, active_only: bool = True) -> List[Student]:
        """Get all students, optionally filtered by activity status"""
        query = self.db.query(Student)
        if active_only:
            query = query.filter(Student.activity_status == "פעיל")
        return query.all()
    
    def update_student(self, student_id: int, update_data: StudentUpdate) -> Optional[Student]:
        """Update a student"""
        student = self.get_student(student_id)
        if not student:
            return None
        
        # Store before state for audit
        before_state = {
            "nickname": student.nickname,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "phone_number": student.phone_number,
            "school_level": student.school_level,
            "activity_status": student.activity_status
        }
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(student, field, value)
        
        self.db.commit()
        self.db.refresh(student)
        
        # Log the update
        self.audit_service.log_action(
            actor="manager",
            action="update_student",
            entity="student",
            entity_id=student.id,
            before=json.dumps(before_state),
            after=json.dumps(update_data.dict(exclude_unset=True))
        )
        
        return student
    
    def delete_student(self, student_id: int) -> bool:
        """Delete a student (soft delete by setting status to inactive)"""
        student = self.get_student(student_id)
        if not student:
            return False
        
        # Store before state for audit
        before_state = {
            "activity_status": student.activity_status
        }
        
        # Soft delete
        student.activity_status = "לא פעיל"
        self.db.commit()
        
        # Log the deletion
        self.audit_service.log_action(
            actor="manager",
            action="delete_student",
            entity="student",
            entity_id=student.id,
            before=json.dumps(before_state),
            after=json.dumps({"activity_status": "לא פעיל"})
        )
        
        return True
    
    def get_student_attendance_history(self, student_id: int, start_date=None, end_date=None) -> List[Attendance]:
        """Get attendance history for a student"""
        query = self.db.query(Attendance).filter(Attendance.student_id == student_id)
        
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        
        return query.order_by(Attendance.date.desc()).all()
    
    def get_student_permanent_absences(self, student_id: int) -> List[PermanentAbsence]:
        """Get permanent absences for a student"""
        return self.db.query(PermanentAbsence).filter(
            PermanentAbsence.student_id == student_id
        ).all()
    
    def get_students_by_school_level(self, school_level: str) -> List[Student]:
        """Get students by school level"""
        return self.db.query(Student).filter(
            and_(
                Student.school_level == school_level,
                Student.activity_status == "פעיל"
            )
        ).all()
    
    def get_students_by_activity_status(self, activity_status: str) -> List[Student]:
        """Get students by activity status"""
        return self.db.query(Student).filter(Student.activity_status == activity_status).all()
    
    def count_students_by_school_level(self) -> dict:
        """Get count of students by school level"""
        elementary = self.db.query(Student).filter(
            and_(
                Student.school_level == "יסודי",
                Student.activity_status == "פעיל"
            )
        ).count()
        
        high_school = self.db.query(Student).filter(
            and_(
                Student.school_level == "תיכון",
                Student.activity_status == "פעיל"
            )
        ).count()
        
        return {
            "elementary": elementary,
            "high_school": high_school,
            "total": elementary + high_school
        }
