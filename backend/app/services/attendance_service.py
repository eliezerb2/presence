from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import date, datetime, time
from typing import List, Optional
import json

from ..models import (
    Attendance, Student, AttendanceStatus, SubStatus, ReportedBy, 
    ClosedReason, PermanentAbsence, SchoolHoliday, Settings
)
from ..schemas import AttendanceCreate, AttendanceUpdate
from .audit_service import AuditService

class AttendanceService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_service = AuditService(db)
    
    def create_attendance(self, attendance_data: AttendanceCreate) -> Attendance:
        """Create a new attendance record"""
        attendance = Attendance(**attendance_data.dict())
        self.db.add(attendance)
        self.db.commit()
        self.db.refresh(attendance)
        
        # Log the creation
        self.audit_service.log_action(
            actor="student",
            action="create_attendance",
            entity="attendance",
            entity_id=attendance.id,
            after=json.dumps(attendance_data.dict())
        )
        
        return attendance
    
    def get_attendance_by_student_date(self, student_id: int, date: date) -> Optional[Attendance]:
        """Get attendance record for a specific student and date"""
        return self.db.query(Attendance).filter(
            and_(Attendance.student_id == student_id, Attendance.date == date)
        ).first()
    
    def update_attendance(self, attendance_id: int, update_data: AttendanceUpdate, actor: str = "manager") -> Optional[Attendance]:
        """Update attendance record with override capability"""
        attendance = self.db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not attendance:
            return None
        
        # Store before state for audit
        before_state = {
            "status": attendance.status,
            "sub_status": attendance.sub_status,
            "reported_by": attendance.reported_by,
            "check_in_time": attendance.check_in_time.isoformat() if attendance.check_in_time else None,
            "check_out_time": attendance.check_out_time.isoformat() if attendance.check_out_time else None,
            "closed_reason": attendance.closed_reason,
            "override_locked": attendance.override_locked
        }
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(attendance, field, value)
        
        # Set override lock if manager is updating
        if actor == "manager":
            attendance.override_locked = True
            attendance.override_locked_at = datetime.now()
        
        self.db.commit()
        self.db.refresh(attendance)
        
        # Log the update
        self.audit_service.log_action(
            actor=actor,
            action="update_attendance",
            entity="attendance",
            entity_id=attendance.id,
            before=json.dumps(before_state),
            after=json.dumps(update_data.dict(exclude_unset=True))
        )
        
        return attendance
    
    def get_daily_attendance(self, date: date) -> List[Attendance]:
        """Get all attendance records for a specific date"""
        return self.db.query(Attendance).filter(Attendance.date == date).all()
    
    def get_daily_summary(self, date: date) -> dict:
        """Get daily attendance summary statistics"""
        attendance_records = self.get_daily_attendance(date)
        
        summary = {
            "date": date,
            "total_students": len(attendance_records),
            "present": 0,
            "absent": 0,
            "late": 0,
            "left": 0,
            "yom_lo_ba_li": 0,
            "not_reported": 0
        }
        
        for record in attendance_records:
            if record.status == AttendanceStatus.PRESENT:
                summary["present"] += 1
                if record.sub_status == SubStatus.LATE:
                    summary["late"] += 1
            elif record.status == AttendanceStatus.LEFT:
                summary["left"] += 1
            elif record.status == AttendanceStatus.YOM_LO_BA_LI:
                summary["yom_lo_ba_li"] += 1
            elif record.status == AttendanceStatus.NOT_REPORTED:
                summary["not_reported"] += 1
            else:
                summary["absent"] += 1
        
        return summary
    
    def process_permanent_absences(self, date: date) -> List[Attendance]:
        """Process permanent absences for a specific date"""
        weekday = date.strftime("%A")[:3]  # Get weekday abbreviation
        
        # Map weekday to Hebrew
        weekday_map = {
            "Sun": "א", "Mon": "ב", "Tue": "ג", "Wed": "ד", "Thu": "ה"
        }
        hebrew_weekday = weekday_map.get(weekday)
        
        if not hebrew_weekday:
            return []  # Not a school day
        
        # Get students with permanent absences for this weekday
        permanent_absences = self.db.query(PermanentAbsence).filter(
            PermanentAbsence.weekday == hebrew_weekday
        ).all()
        
        created_records = []
        for pa in permanent_absences:
            # Check if attendance record already exists
            existing = self.get_attendance_by_student_date(pa.student_id, date)
            if existing:
                continue
            
            # Create attendance record for permanent absence
            attendance_data = AttendanceCreate(
                student_id=pa.student_id,
                date=date,
                status=AttendanceStatus.PERMANENT_ABSENCE_APPROVED,
                sub_status=SubStatus.NONE,
                reported_by=ReportedBy.AUTO
            )
            
            attendance = self.create_attendance(attendance_data)
            created_records.append(attendance)
        
        return created_records
    
    def process_late_attendance(self, date: date) -> List[Attendance]:
        """Process late attendance for students who haven't reported by 10:00"""
        # Get students who haven't reported and don't have permanent absences
        not_reported = self.db.query(Attendance).filter(
            and_(
                Attendance.date == date,
                Attendance.status == AttendanceStatus.NOT_REPORTED,
                Attendance.override_locked == False
            )
        ).all()
        
        updated_records = []
        current_time = datetime.now().time()
        late_threshold = time(10, 0)  # 10:00 AM
        
        if current_time >= late_threshold:
            for record in not_reported:
                # Check if student has permanent absence
                permanent_absence = self.db.query(PermanentAbsence).filter(
                    and_(
                        PermanentAbsence.student_id == record.student_id,
                        PermanentAbsence.weekday == date.strftime("%A")[:3]
                    )
                ).first()
                
                if not permanent_absence:
                    # Mark as late
                    update_data = AttendanceUpdate(
                        status=AttendanceStatus.PRESENT,
                        sub_status=SubStatus.LATE,
                        reported_by=ReportedBy.AUTO,
                        check_in_time=datetime.now()
                    )
                    
                    updated = self.update_attendance(record.id, update_data, "auto")
                    if updated:
                        updated_records.append(updated)
        
        return updated_records
    
    def process_yom_lo_ba_li(self, date: date) -> List[Attendance]:
        """Process 'yom lo ba li' for students who haven't reported by 10:30"""
        # Get students who haven't reported and don't have permanent absences
        not_reported = self.db.query(Attendance).filter(
            and_(
                Attendance.date == date,
                Attendance.status == AttendanceStatus.NOT_REPORTED,
                Attendance.override_locked == False
            )
        ).all()
        
        updated_records = []
        current_time = datetime.now().time()
        yom_threshold = time(10, 30)  # 10:30 AM
        
        if current_time >= yom_threshold:
            for record in not_reported:
                # Check if student has permanent absence
                permanent_absence = self.db.query(PermanentAbsence).filter(
                    and_(
                        PermanentAbsence.student_id == record.student_id,
                        PermanentAbsence.weekday == date.strftime("%A")[:3]
                    )
                ).first()
                
                if not permanent_absence:
                    # Mark as 'yom lo ba li'
                    update_data = AttendanceUpdate(
                        status=AttendanceStatus.YOM_LO_BA_LI,
                        sub_status=SubStatus.NONE,
                        reported_by=ReportedBy.AUTO
                    )
                    
                    updated = self.update_attendance(record.id, update_data, "auto")
                    if updated:
                        updated_records.append(updated)
        
        return updated_records
    
    def process_end_of_day(self, date: date) -> List[Attendance]:
        """Process end of day closure at 16:00"""
        # Get students who haven't checked out
        not_checked_out = self.db.query(Attendance).filter(
            and_(
                Attendance.date == date,
                Attendance.check_out_time.is_(None),
                Attendance.override_locked == False
            )
        ).all()
        
        updated_records = []
        current_time = datetime.now().time()
        end_threshold = time(16, 0)  # 4:00 PM
        
        if current_time >= end_threshold:
            for record in not_checked_out:
                # Mark as left with auto-close
                update_data = AttendanceUpdate(
                    status=AttendanceStatus.LEFT,
                    sub_status=SubStatus.AUTO_CLOSED,
                    reported_by=ReportedBy.AUTO,
                    check_out_time=datetime.combine(date, time(16, 0)),
                    closed_reason=ClosedReason.AUTO_16
                )
                
                updated = self.update_attendance(record.id, update_data, "auto")
                if updated:
                    updated_records.append(updated)
        
        return updated_records
    
    def is_school_day(self, date: date) -> bool:
        """Check if a date is a school day"""
        # Check if it's weekend
        if date.weekday() >= 5:  # Saturday = 5, Sunday = 6
            return False
        
        # Check if it's a holiday
        holiday = self.db.query(SchoolHoliday).filter(SchoolHoliday.date == date).first()
        if holiday:
            return False
        
        # Check if it's after school year end
        settings = self.db.query(Settings).first()
        if not settings:
            return True
        
        # For now, assume school is always in session
        # In production, this would check against academic calendar
        return True
    
    def get_students_for_reminder(self, date: date) -> List[Student]:
        """Get students who should receive WhatsApp reminders at 09:30"""
        if not self.is_school_day(date):
            return []
        
        # Get active students who haven't reported and don't have permanent absences
        subquery = self.db.query(Attendance.student_id).filter(
            and_(
                Attendance.date == date,
                Attendance.status == AttendanceStatus.NOT_REPORTED
            )
        )
        
        students = self.db.query(Student).filter(
            and_(
                Student.activity_status == "פעיל",
                ~Student.id.in_(subquery)
            )
        ).all()
        
        # Filter out students with permanent absences
        weekday = date.strftime("%A")[:3]
        weekday_map = {"Sun": "א", "Mon": "ב", "Tue": "ג", "Wed": "ד", "Thu": "ה"}
        hebrew_weekday = weekday_map.get(weekday)
        
        if hebrew_weekday:
            permanent_absence_students = self.db.query(PermanentAbsence.student_id).filter(
                PermanentAbsence.weekday == hebrew_weekday
            ).all()
            
            students = [s for s in students if s.id not in [pa.student_id for pa in permanent_absence_students]]
        
        return students
