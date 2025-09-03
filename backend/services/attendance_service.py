from sqlalchemy.orm import Session
from database import models
from backend import schemas
from typing import List, Optional
from datetime import date, datetime
import json
from backend.services.audit_service import AuditService

class AttendanceService:
    def __init__(self):
        self.audit_service = AuditService()

    def get_attendance(self, db: Session, attendance_id: int):
        return db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()

    def get_attendance_by_student_and_date(self, db: Session, student_id: int, attendance_date: date):
        return db.query(models.Attendance).filter(
            models.Attendance.student_id == student_id,
            models.Attendance.date == attendance_date
        ).first()

    def get_daily_attendance(self, db: Session, attendance_date: date, skip: int = 0, limit: int = 100):
        return db.query(models.Attendance).filter(models.Attendance.date == attendance_date).offset(skip).limit(limit).all()

    def create_attendance(self, db: Session, attendance: schemas.AttendanceCreate):
        db_attendance = models.Attendance(**attendance.dict())
        db.add(db_attendance)
        db.commit()
        db.refresh(db_attendance)
        return db_attendance

    def update_attendance(self, db: Session, attendance_id: int, attendance: schemas.AttendanceUpdate):
        db_attendance = self.get_attendance(db, attendance_id)
        if db_attendance:
            # Store the 'before' state for audit logging
            before_state = {c.name: getattr(db_attendance, c.name) for c in db_attendance.__table__.columns}

            # Check if override_locked is true and prevent changes unless explicitly unlocked
            if db_attendance.override_locked and attendance.override_locked is not False:
                raise ValueError("Cannot update a locked attendance record unless explicitly unlocking.")

            # Determine if this is a manager override
            is_manager_override = attendance.reported_by == schemas.ReportedBy.MANAGER

            for key, value in attendance.dict(exclude_unset=True).items():
                setattr(db_attendance, key, value)

            # If override_locked is set to True, set override_locked_at
            if attendance.override_locked is True and db_attendance.override_locked_at is None:
                db_attendance.override_locked_at = datetime.now()
            # If override_locked is set to False, clear override_locked_at
            elif attendance.override_locked is False:
                db_attendance.override_locked_at = None

            db.commit()
            db.refresh(db_attendance)

            # Store the 'after' state for audit logging
            after_state = {c.name: getattr(db_attendance, c.name) for c in db_attendance.__table__.columns}

            # Log the change in audit_log
            action = "override_update" if is_manager_override else "update"
            self.audit_service.create_audit_log_entry(db, schemas.AuditLogCreate(
                actor=attendance.reported_by.value if attendance.reported_by else "unknown",
                action=action,
                entity="Attendance",
                entity_id=db_attendance.id,
                before=json.dumps(before_state, default=str),
                after=json.dumps(after_state, default=str)
            ))
        return db_attendance

    def delete_attendance(self, db: Session, attendance_id: int):
        db_attendance = self.get_attendance(db, attendance_id)
        if db_attendance:
            db.delete(db_attendance)
            db.commit()
        return db_attendance

    def check_in_student(self, db: Session, student_id: int, reported_by: schemas.ReportedBy):
        today = date.today()
        attendance_record = self.get_attendance_by_student_and_date(db, student_id, today)

        if attendance_record:
            if attendance_record.override_locked:
                raise ValueError("Attendance record is locked and cannot be updated.")
            if attendance_record.check_in_time:
                raise ValueError("Student already checked in today.")
            attendance_record.check_in_time = datetime.now()
            attendance_record.status = schemas.AttendanceStatus.PRESENT
            attendance_record.reported_by = reported_by
        else:
            attendance_record = models.Attendance(
                student_id=student_id,
                date=today,
                status=schemas.AttendanceStatus.PRESENT,
                reported_by=reported_by,
                check_in_time=datetime.now()
            )
            db.add(attendance_record)
        db.commit()
        db.refresh(attendance_record)
        return attendance_record

    def check_out_student(self, db: Session, student_id: int, reported_by: schemas.ReportedBy):
        today = date.today()
        attendance_record = self.get_attendance_by_student_and_date(db, student_id, today)

        if not attendance_record:
            raise ValueError("No attendance record found for today.")
        if attendance_record.override_locked:
            raise ValueError("Attendance record is locked and cannot be updated.")
        if attendance_record.check_out_time:
            raise ValueError("Student already checked out today.")

        attendance_record.check_out_time = datetime.now()
        attendance_record.status = schemas.AttendanceStatus.LEFT
        attendance_record.reported_by = reported_by
        db.commit()
        db.refresh(attendance_record)
        return attendance_record

    def auto_mark_late(self, db: Session, student_id: int):
        today = date.today()
        attendance_record = self.get_attendance_by_student_and_date(db, student_id, today)

        if attendance_record and not attendance_record.override_locked and attendance_record.status == schemas.AttendanceStatus.NOT_REPORTED:
            before_state = {c.name: getattr(attendance_record, c.name) for c in attendance_record.__table__.columns}
            attendance_record.status = schemas.AttendanceStatus.PRESENT
            attendance_record.sub_status = schemas.AttendanceSubStatus.LATE
            attendance_record.reported_by = schemas.ReportedBy.AUTO
            attendance_record.check_in_time = datetime.now()
            db.commit()
            db.refresh(attendance_record)
            after_state = {c.name: getattr(attendance_record, c.name) for c in attendance_record.__table__.columns}
            self.audit_service.create_audit_log_entry(db, schemas.AuditLogCreate(
                actor="auto",
                action="auto_mark_late",
                entity="Attendance",
                entity_id=attendance_record.id,
                before=json.dumps(before_state, default=str),
                after=json.dumps(after_state, default=str)
            ))
            return attendance_record
        return None

    def auto_mark_dont_feel_like_it(self, db: Session, student_id: int):
        today = date.today()
        attendance_record = self.get_attendance_by_student_and_date(db, student_id, today)

        if attendance_record and not attendance_record.override_locked and attendance_record.status == schemas.AttendanceStatus.NOT_REPORTED:
            before_state = {c.name: getattr(attendance_record, c.name) for c in attendance_record.__table__.columns}
            attendance_record.status = schemas.AttendanceStatus.NOT_IN_MOOD
            attendance_record.sub_status = schemas.AttendanceSubStatus.NONE
            attendance_record.reported_by = schemas.ReportedBy.AUTO
            db.commit()
            db.refresh(attendance_record)
            after_state = {c.name: getattr(attendance_record, c.name) for c in attendance_record.__table__.columns}
            self.audit_service.create_audit_log_entry(db, schemas.AuditLogCreate(
                actor="auto",
                action="auto_mark_dont_feel_like_it",
                entity="Attendance",
                entity_id=attendance_record.id,
                before=json.dumps(before_state, default=str),
                after=json.dumps(after_state, default=str)
            ))
            return attendance_record
        return None

    def auto_close_day(self, db: Session, student_id: int):
        today = date.today()
        attendance_record = self.get_attendance_by_student_and_date(db, student_id, today)

        if attendance_record and not attendance_record.override_locked and not attendance_record.check_out_time:
            before_state = {c.name: getattr(attendance_record, c.name) for c in attendance_record.__table__.columns}
            attendance_record.check_out_time = datetime(today.year, today.month, today.day, 16, 0, 0) # 16:00
            attendance_record.status = schemas.AttendanceStatus.LEFT
            attendance_record.sub_status = schemas.AttendanceSubStatus.AUTO_CLOSED
            attendance_record.reported_by = schemas.ReportedBy.AUTO
            attendance_record.closed_reason = schemas.ClosedReason.AUTO_16
            db.commit()
            db.refresh(attendance_record)
            after_state = {c.name: getattr(attendance_record, c.name) for c in attendance_record.__table__.columns}
            self.audit_service.create_audit_log_entry(db, schemas.AuditLogCreate(
                actor="auto",
                action="auto_close_day",
                entity="Attendance",
                entity_id=attendance_record.id,
                before=json.dumps(before_state, default=str),
                after=json.dumps(after_state, default=str)
            ))
            return attendance_record
        return None
