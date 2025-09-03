from sqlalchemy.orm import Session
from datetime import date, datetime
from backend import schemas
from backend.services.attendance_service import AttendanceService
from backend.services.permanent_absence_service import PermanentAbsenceService
from backend.services.school_holiday_service import SchoolHolidayService
from backend.services.setting_service import SettingService
from backend.services.student_service import StudentService

class AutomationService:
    def __init__(self):
        self.attendance_service = AttendanceService()
        self.permanent_absence_service = PermanentAbsenceService()
        self.school_holiday_service = SchoolHolidayService()
        self.setting_service = SettingService()
        self.student_service = StudentService()

    def _is_school_day(self, db: Session, current_date: date) -> bool:
        # Check if it's a weekend (Friday/Saturday)
        # Python's weekday() returns 0 for Monday, 6 for Sunday
        # In Hebrew calendar, Sunday is the first day (א), Thursday is the last (ה)
        # So, Friday (4) and Saturday (5) are weekends
        if current_date.weekday() == 4 or current_date.weekday() == 5:
            return False

        # Check for school holidays
        if self.school_holiday_service.get_school_holiday_by_date(db, current_date):
            return False

        # Check school year end dates
        # Assuming current_date is within the school year for simplicity, 
        # more complex logic would be needed for exact school year boundaries.
        # For now, we'll assume the automations run only during active school days.

        return True

    def run_daily_automations(self, db: Session, current_date: date):
        if not self._is_school_day(db, current_date):
            print(f"Skipping automations for {current_date} as it's not a school day.")
            return

        print(f"Running daily automations for {current_date}...")

        # 1. Permanent Absence Automation
        # Convert Python weekday to Hebrew weekday enum
        hebrew_weekday_map = {
            0: schemas.Weekday.MONDAY, # Monday
            1: schemas.Weekday.TUESDAY, # Tuesday
            2: schemas.Weekday.WEDNESDAY, # Wednesday
            3: schemas.Weekday.THURSDAY, # Thursday
            6: schemas.Weekday.SUNDAY # Sunday
        }
        current_weekday_hebrew = hebrew_weekday_map.get(current_date.weekday())

        if current_weekday_hebrew:
            self.permanent_absence_service.process_permanent_absences_for_day(db, current_date, current_weekday_hebrew)
            print("Permanent absence automation completed.")

        # Get all active students
        active_students = self.student_service.get_students(db) # Assuming get_students can filter by activity_status

        # Filter out students with permanent absence for today (already handled by process_permanent_absences_for_day)
        # This requires a way to get students who were marked with permanent absence today
        # For simplicity, we'll assume process_permanent_absences_for_day handles creating the attendance record
        # and subsequent steps will check the attendance record status.

        # 2. 09:30 - WhatsApp Reminder (Placeholder)
        # This would typically involve an external messaging service
        # For now, we'll just print a message for students who are 'לא דיווח'
        for student in active_students:
            attendance_record = self.attendance_service.get_attendance_by_student_and_date(db, student.id, current_date)
            if not attendance_record or (attendance_record.status == schemas.AttendanceStatus.NOT_REPORTED and not attendance_record.override_locked):
                # Check if student has permanent absence for today - already handled by process_permanent_absences_for_day
                # If an attendance record exists with PERMANENT_ABSENCE_APPROVAL, they won't get a reminder
                if not attendance_record or attendance_record.status != schemas.AttendanceStatus.PERMANENT_ABSENCE_APPROVAL:
                    print(f"Sending WhatsApp reminder to student {student.nickname} ({student.id})...")

        # 3. 10:00-10:30 - Auto Late
        # This would be triggered by a scheduler at 10:00 or 10:30
        for student in active_students:
            self.attendance_service.auto_mark_late(db, student.id)
        print("Auto-mark late completed.")

        # 4. After 10:30 - "Don't Feel Like It Day" Auto
        # This would be triggered by a scheduler after 10:30
        for student in active_students:
            self.attendance_service.auto_mark_dont_feel_like_it(db, student.id)
        print("Auto-mark 'Don't Feel Like It' completed.")

        # 5. 16:00 - Auto Day Close
        # This would be triggered by a scheduler at 16:00
        for student in active_students:
            self.attendance_service.auto_close_day(db, student.id)
        print("Auto day close completed.")

        print(f"Daily automations for {current_date} finished.")
