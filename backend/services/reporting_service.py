from sqlalchemy.orm import Session
from datetime import date, datetime
from backend import schemas
from backend.services.student_service import StudentService
from backend.services.attendance_service import AttendanceService
from backend.services.setting_service import SettingService
from backend.services.student_monthly_override_service import StudentMonthlyOverrideService
from backend.services.claim_service import ClaimService
from typing import List

class ReportingService:
    def __init__(self):
        self.student_service = StudentService()
        self.attendance_service = AttendanceService()
        self.setting_service = SettingService()
        self.student_monthly_override_service = StudentMonthlyOverrideService()
        self.claim_service = ClaimService()

    def calculate_monthly_summary(self, db: Session, student_id: int, year_month: str):
        # year_month format: YYYY-MM
        start_date = datetime.strptime(year_month, '%Y-%m').date()
        # Calculate end date of the month
        if start_date.month == 12:
            end_date = date(start_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(start_date.year, start_date.month + 1, 1) - timedelta(days=1)

        attendances = db.query(models.Attendance).filter(
            models.Attendance.student_id == student_id,
            models.Attendance.date >= start_date,
            models.Attendance.date <= end_date
        ).all()

        late_count = 0
        yom_lo_ba_li_count = 0

        for att in attendances:
            if att.sub_status == schemas.AttendanceSubStatus.LATE:
                late_count += 1
            if att.status == schemas.AttendanceStatus.NOT_IN_MOOD:
                yom_lo_ba_li_count += 1

        return {"late_count": late_count, "yom_lo_ba_li_count": yom_lo_ba_li_count}

    def run_monthly_reporting(self, db: Session, year_month: str):
        print(f"Running monthly reporting for {year_month}...")
        students = self.student_service.get_students(db)
        global_settings = self.setting_service.get_global_settings(db)

        for student in students:
            summary = self.calculate_monthly_summary(db, student.id, year_month)
            late_count = summary["late_count"]
            yom_lo_ba_li_count = summary["yom_lo_ba_li_count"]

            # Get thresholds
            monthly_override = self.student_monthly_override_service.get_student_monthly_override_by_student_and_month(db, student.id, year_month)
            
            lateness_threshold = monthly_override.lateness_threshold_override if monthly_override and monthly_override.lateness_threshold_override is not None else global_settings.lateness_threshold_per_month_default
            max_yom_lo_ba_li = monthly_override.max_yom_lo_ba_li_override if monthly_override and monthly_override.max_yom_lo_ba_li_override is not None else global_settings.max_yom_lo_ba_li_per_month_default

            # Check for claims
            if late_count > lateness_threshold:
                print(f"Student {student.nickname} ({student.id}) exceeded late threshold. Creating claim...")
                self.claim_service.create_claim(db, schemas.ClaimCreate(
                    student_id=student.id,
                    reason=schemas.ClaimReason.LATE_THRESHOLD,
                    notified_to=["manager", "student", "court_chair"]
                ))
                # Placeholder for WhatsApp notification
                print(f"Sending WhatsApp notification for late threshold claim to {student.nickname}.")

            if yom_lo_ba_li_count >= max_yom_lo_ba_li:
                print(f"Student {student.nickname} ({student.id}) exceeded 'Don't Feel Like It' threshold. Creating claim...")
                self.claim_service.create_claim(db, schemas.ClaimCreate(
                    student_id=student.id,
                    reason=schemas.ClaimReason.THIRD_YOM_LO_BA_LI,
                    notified_to=["manager", "student", "court_chair"]
                ))
                # Placeholder for WhatsApp notification
                print(f"Sending WhatsApp notification for 'Don't Feel Like It' claim to {student.nickname}.")
        print(f"Monthly reporting for {year_month} finished.")
