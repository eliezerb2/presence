from sqlalchemy.orm import Session
from datetime import date, datetime, time, timedelta
from typing import List
from ..models.student import Student, ActivityStatus, SchoolLevel
from ..models.attendance import Attendance, AttendanceStatus, SubStatus, ReportedBy, ClosedReason
from ..models.permanent_absence import PermanentAbsence, Weekday
from ..models.school_holiday import SchoolHoliday
from ..models.settings import Settings
from ..models.student_monthly_override import StudentMonthlyOverride
from ..models.claim import Claim, ClaimReason, ClaimStatus
from .audit_service import log_audit
from .notification_service import send_whatsapp_reminder, send_claim_notification

def get_hebrew_weekday(date_obj: date) -> Weekday:
    """Convert Python weekday to Hebrew weekday enum"""
    weekday_map = {
        6: Weekday.SUNDAY,    # Sunday
        0: Weekday.MONDAY,    # Monday
        1: Weekday.TUESDAY,   # Tuesday
        2: Weekday.WEDNESDAY, # Wednesday
        3: Weekday.THURSDAY,  # Thursday
    }
    return weekday_map.get(date_obj.weekday())

def is_school_day(db: Session, check_date: date) -> bool:
    """Check if a given date is a school day"""
    # Check if it's a weekend (Friday/Saturday)
    if check_date.weekday() in [4, 5]:  # Friday, Saturday
        return False
    
    # Check if it's a school holiday
    holiday = db.query(SchoolHoliday).filter(SchoolHoliday.date == check_date).first()
    if holiday:
        return False
    
    # Check if it's after school year end dates
    if check_date.month == 6:
        if check_date.day > 20:  # After June 20 for high school
            return False
        if check_date.day > 30:  # After June 30 for elementary
            return False
    elif check_date.month > 6:
        return False
    
    return True

def process_permanent_absences(db: Session, target_date: date = None):
    """Process permanent absences for the given date (default: today)"""
    if target_date is None:
        target_date = date.today()
    
    if not is_school_day(db, target_date):
        return
    
    hebrew_weekday = get_hebrew_weekday(target_date)
    if not hebrew_weekday:
        return
    
    # Get all permanent absences for this weekday
    permanent_absences = db.query(PermanentAbsence).filter(
        PermanentAbsence.weekday == hebrew_weekday
    ).all()
    
    for absence in permanent_absences:
        # Check if attendance record already exists
        existing_attendance = db.query(Attendance).filter(
            Attendance.student_id == absence.student_id,
            Attendance.date == target_date
        ).first()
        
        if existing_attendance:
            # Update existing record if not locked
            if not existing_attendance.override_locked:
                original_data = {
                    "status": existing_attendance.status.value,
                    "sub_status": existing_attendance.sub_status.value,
                    "reported_by": existing_attendance.reported_by.value
                }
                
                existing_attendance.status = AttendanceStatus.PERMANENT_ABSENCE_APPROVAL
                existing_attendance.sub_status = SubStatus.NONE
                existing_attendance.reported_by = ReportedBy.AUTO
                
                new_data = {
                    "status": existing_attendance.status.value,
                    "sub_status": existing_attendance.sub_status.value,
                    "reported_by": existing_attendance.reported_by.value
                }
                
                log_audit(db, "auto", "permanent_absence_update", "attendance", 
                         existing_attendance.id, original_data, new_data)
        else:
            # Create new attendance record
            new_attendance = Attendance(
                student_id=absence.student_id,
                date=target_date,
                status=AttendanceStatus.PERMANENT_ABSENCE_APPROVAL,
                sub_status=SubStatus.NONE,
                reported_by=ReportedBy.AUTO
            )
            db.add(new_attendance)
            
            log_audit(db, "auto", "permanent_absence_create", "attendance", 
                     absence.student_id, None, {
                         "status": AttendanceStatus.PERMANENT_ABSENCE_APPROVAL.value,
                         "date": target_date.isoformat()
                     })
    
    db.commit()

def send_morning_reminders(db: Session, target_date: date = None):
    """Send WhatsApp reminders at 09:30 to students who haven't reported"""
    if target_date is None:
        target_date = date.today()
    
    if not is_school_day(db, target_date):
        return
    
    # Get active students who haven't reported and don't have permanent absence
    hebrew_weekday = get_hebrew_weekday(target_date)
    
    # Get students with permanent absence for today
    permanent_absence_student_ids = []
    if hebrew_weekday:
        permanent_absences = db.query(PermanentAbsence).filter(
            PermanentAbsence.weekday == hebrew_weekday
        ).all()
        permanent_absence_student_ids = [pa.student_id for pa in permanent_absences]
    
    # Get students who need reminders
    students_to_remind = db.query(Student).filter(
        Student.activity_status == ActivityStatus.ACTIVE,
        ~Student.id.in_(permanent_absence_student_ids)
    ).all()
    
    for student in students_to_remind:
        # Check if student has already reported
        attendance = db.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.date == target_date
        ).first()
        
        if not attendance or attendance.status == AttendanceStatus.NOT_REPORTED:
            # Send reminder
            send_whatsapp_reminder(student.phone_number, student.first_name)

def process_automatic_late_marking(db: Session, target_date: date = None):
    """Mark students as late automatically between 10:00-10:30"""
    if target_date is None:
        target_date = date.today()
    
    if not is_school_day(db, target_date):
        return
    
    # Get all students who still haven't reported
    not_reported_attendance = db.query(Attendance).filter(
        Attendance.date == target_date,
        Attendance.status == AttendanceStatus.NOT_REPORTED,
        Attendance.override_locked == False
    ).all()
    
    for attendance in not_reported_attendance:
        original_data = {
            "status": attendance.status.value,
            "sub_status": attendance.sub_status.value,
            "reported_by": attendance.reported_by.value
        }
        
        attendance.status = AttendanceStatus.PRESENT
        attendance.sub_status = SubStatus.LATE
        attendance.reported_by = ReportedBy.AUTO
        attendance.check_in_time = datetime.now()
        
        new_data = {
            "status": attendance.status.value,
            "sub_status": attendance.sub_status.value,
            "reported_by": attendance.reported_by.value,
            "check_in_time": attendance.check_in_time.isoformat()
        }
        
        log_audit(db, "auto", "auto_late_marking", "attendance", 
                 attendance.id, original_data, new_data)
    
    db.commit()

def process_automatic_absent_marking(db: Session, target_date: date = None):
    """Mark students as 'didn't feel like it' automatically after 10:30"""
    if target_date is None:
        target_date = date.today()
    
    if not is_school_day(db, target_date):
        return
    
    # Get all students who still haven't reported
    not_reported_attendance = db.query(Attendance).filter(
        Attendance.date == target_date,
        Attendance.status == AttendanceStatus.NOT_REPORTED,
        Attendance.override_locked == False
    ).all()
    
    for attendance in not_reported_attendance:
        original_data = {
            "status": attendance.status.value,
            "sub_status": attendance.sub_status.value,
            "reported_by": attendance.reported_by.value
        }
        
        attendance.status = AttendanceStatus.DIDNT_FEEL_LIKE_IT
        attendance.sub_status = SubStatus.NONE
        attendance.reported_by = ReportedBy.AUTO
        
        new_data = {
            "status": attendance.status.value,
            "sub_status": attendance.sub_status.value,
            "reported_by": attendance.reported_by.value
        }
        
        log_audit(db, "auto", "auto_absent_marking", "attendance", 
                 attendance.id, original_data, new_data)
    
    db.commit()

def process_automatic_day_closure(db: Session, target_date: date = None):
    """Automatically close the day at 16:00 for students who haven't checked out"""
    if target_date is None:
        target_date = date.today()
    
    if not is_school_day(db, target_date):
        return
    
    # Get attendance records that need to be closed
    attendance_to_close = db.query(Attendance).filter(
        Attendance.date == target_date,
        Attendance.status == AttendanceStatus.PRESENT,
        Attendance.check_out_time.is_(None),
        Attendance.override_locked == False
    ).all()
    
    for attendance in attendance_to_close:
        original_data = {
            "status": attendance.status.value,
            "check_out_time": None,
            "closed_reason": attendance.closed_reason.value
        }
        
        attendance.status = AttendanceStatus.LEFT
        attendance.sub_status = SubStatus.AUTO_CLOSED
        attendance.reported_by = ReportedBy.AUTO
        attendance.check_out_time = datetime.combine(target_date, time(16, 0))
        attendance.closed_reason = ClosedReason.AUTO_16
        
        new_data = {
            "status": attendance.status.value,
            "check_out_time": attendance.check_out_time.isoformat(),
            "closed_reason": attendance.closed_reason.value
        }
        
        log_audit(db, "auto", "auto_day_closure", "attendance", 
                 attendance.id, original_data, new_data)
    
    db.commit()

def process_monthly_claims(db: Session, year_month: str = None):
    """Process monthly claims for threshold violations"""
    if year_month is None:
        today = date.today()
        year_month = f"{today.year}-{today.month:02d}"
    
    year, month = map(int, year_month.split("-"))
    
    # Get all active students
    active_students = db.query(Student).filter(
        Student.activity_status == ActivityStatus.ACTIVE
    ).all()
    
    settings = db.query(Settings).first()
    if not settings:
        return
    
    for student in active_students:
        # Get monthly statistics
        attendance_records = db.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.date >= date(year, month, 1),
            Attendance.date < date(year + (1 if month == 12 else 0), (month % 12) + 1, 1)
        ).all()
        
        late_count = sum(1 for record in attendance_records if record.sub_status == SubStatus.LATE)
        yom_lo_ba_li_count = sum(1 for record in attendance_records 
                                if record.status == AttendanceStatus.DIDNT_FEEL_LIKE_IT)
        
        # Get thresholds
        monthly_override = db.query(StudentMonthlyOverride).filter(
            StudentMonthlyOverride.student_id == student.id,
            StudentMonthlyOverride.year_month == year_month
        ).first()
        
        late_threshold = (monthly_override.lateness_threshold_override 
                         if monthly_override and monthly_override.lateness_threshold_override is not None
                         else settings.lateness_threshold_per_month_default)
        
        yom_lo_ba_li_threshold = (monthly_override.max_yom_lo_ba_li_override
                                 if monthly_override and monthly_override.max_yom_lo_ba_li_override is not None
                                 else settings.max_yom_lo_ba_li_per_month_default)
        
        # Check for threshold violations and create claims
        if late_count > late_threshold:
            # Check if claim already exists
            existing_claim = db.query(Claim).filter(
                Claim.student_id == student.id,
                Claim.reason == ClaimReason.LATE_THRESHOLD,
                Claim.status == ClaimStatus.OPEN
            ).first()
            
            if not existing_claim:
                claim = Claim(
                    student_id=student.id,
                    date_opened=date.today(),
                    reason=ClaimReason.LATE_THRESHOLD,
                    notified_to=["manager", "student", "court_chair"],
                    status=ClaimStatus.OPEN
                )
                db.add(claim)
                
                # Send notifications
                send_claim_notification(student, ClaimReason.LATE_THRESHOLD, late_count, late_threshold)
                
                log_audit(db, "auto", "create_claim", "claim", student.id, None, {
                    "reason": ClaimReason.LATE_THRESHOLD.value,
                    "late_count": late_count,
                    "threshold": late_threshold
                })
        
        if yom_lo_ba_li_count >= yom_lo_ba_li_threshold:
            # Check if claim already exists
            existing_claim = db.query(Claim).filter(
                Claim.student_id == student.id,
                Claim.reason == ClaimReason.THIRD_YOM_LO_BA_LI,
                Claim.status == ClaimStatus.OPEN
            ).first()
            
            if not existing_claim:
                claim = Claim(
                    student_id=student.id,
                    date_opened=date.today(),
                    reason=ClaimReason.THIRD_YOM_LO_BA_LI,
                    notified_to=["manager", "student", "court_chair"],
                    status=ClaimStatus.OPEN
                )
                db.add(claim)
                
                # Send notifications
                send_claim_notification(student, ClaimReason.THIRD_YOM_LO_BA_LI, yom_lo_ba_li_count, yom_lo_ba_li_threshold)
                
                log_audit(db, "auto", "create_claim", "claim", student.id, None, {
                    "reason": ClaimReason.THIRD_YOM_LO_BA_LI.value,
                    "yom_lo_ba_li_count": yom_lo_ba_li_count,
                    "threshold": yom_lo_ba_li_threshold
                })
    
    db.commit()