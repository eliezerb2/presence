from sqlalchemy.orm import Session
from database import models
from backend import schemas
from typing import List, Optional
from datetime import date, datetime
from backend.services.attendance_service import AttendanceService
from backend.services.audit_service import AuditService
import json

class PermanentAbsenceService:
    def __init__(self):
        self.attendance_service = AttendanceService()
        self.audit_service = AuditService()

    def get_permanent_absence(self, db: Session, permanent_absence_id: int):
        return db.query(models.PermanentAbsence).filter(models.PermanentAbsence.id == permanent_absence_id).first()

    def get_permanent_absences(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.PermanentAbsence).offset(skip).limit(limit).all()

    def get_permanent_absences_by_student(self, db: Session, student_id: int):
        return db.query(models.PermanentAbsence).filter(models.PermanentAbsence.student_id == student_id).all()

    def create_permanent_absence(self, db: Session, permanent_absence: schemas.PermanentAbsenceCreate):
        db_permanent_absence = models.PermanentAbsence(**permanent_absence.dict())
        db.add(db_permanent_absence)
        db.commit()
        db.refresh(db_permanent_absence)
        return db_permanent_absence

    def update_permanent_absence(self, db: Session, permanent_absence_id: int, permanent_absence: schemas.PermanentAbsenceUpdate):
        db_permanent_absence = self.get_permanent_absence(db, permanent_absence_id)
        if db_permanent_absence:
            for key, value in permanent_absence.dict(exclude_unset=True).items():
                setattr(db_permanent_absence, key, value)
            db.commit()
            db.refresh(db_permanent_absence)
        return db_permanent_absence

    def delete_permanent_absence(self, db: Session, permanent_absence_id: int):
        db_permanent_absence = self.get_permanent_absence(db, permanent_absence_id)
        if db_permanent_absence:
            db.delete(db_permanent_absence)
            db.commit()
        return db_permanent_absence

    def process_permanent_absences_for_day(self, db: Session, current_date: date, current_weekday: schemas.Weekday):
        permanent_absences = db.query(models.PermanentAbsence).filter(models.PermanentAbsence.weekday == current_weekday).all()
        processed_students = []

        for pa in permanent_absences:
            attendance_record = self.attendance_service.get_attendance_by_student_and_date(db, pa.student_id, current_date)

            if not attendance_record:
                # Create new attendance record for permanent absence
                new_attendance = schemas.AttendanceCreate(
                    student_id=pa.student_id,
                    date=current_date,
                    status=schemas.AttendanceStatus.PERMANENT_ABSENCE_APPROVAL,
                    sub_status=schemas.AttendanceSubStatus.NONE,
                    reported_by=schemas.ReportedBy.AUTO
                )
                self.attendance_service.create_attendance(db, new_attendance)
                processed_students.append(pa.student_id)
            elif not attendance_record.override_locked and attendance_record.status != schemas.AttendanceStatus.PERMANENT_ABSENCE_APPROVAL:
                # Update existing attendance record if not locked and status is different
                before_state = {c.name: getattr(attendance_record, c.name) for c in attendance_record.__table__.columns}
                attendance_record.status = schemas.AttendanceStatus.PERMANENT_ABSENCE_APPROVAL
                attendance_record.sub_status = schemas.AttendanceSubStatus.NONE
                attendance_record.reported_by = schemas.ReportedBy.AUTO
                db.commit()
                db.refresh(attendance_record)
                after_state = {c.name: getattr(attendance_record, c.name) for c in attendance_record.__table__.columns}
                self.audit_service.create_audit_log_entry(db, schemas.AuditLogCreate(
                    actor="auto",
                    action="auto_permanent_absence_update",
                    entity="Attendance",
                    entity_id=attendance_record.id,
                    before=json.dumps(before_state, default=str),
                    after=json.dumps(after_state, default=str)
                ))
                processed_students.append(pa.student_id)
        return processed_students
