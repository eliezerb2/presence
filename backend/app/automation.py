from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, extract, func
from app.models import *
from app.database import AsyncSessionLocal
from datetime import datetime, date, time
import asyncio
import json

class AttendanceAutomation:
    def __init__(self):
        self.session = None
    
    async def get_session(self):
        if not self.session:
            self.session = AsyncSessionLocal()
        return self.session
    
    async def close_session(self):
        if self.session:
            await self.session.close()
            self.session = None
    
    async def is_school_day(self, target_date: date) -> bool:
        if target_date.weekday() >= 5:  # Saturday=5, Sunday=6
            return False
        
        db = await self.get_session()
        stmt = select(SchoolHoliday).where(SchoolHoliday.date == target_date)
        result = await db.execute(stmt)
        holiday = result.scalar_one_or_none()
        
        return holiday is None
    
    async def process_permanent_absences(self, target_date: date):
        if not await self.is_school_day(target_date):
            return
        
        weekday_map = {0: Weekday.MONDAY, 1: Weekday.TUESDAY, 2: Weekday.WEDNESDAY, 
                      3: Weekday.THURSDAY, 4: Weekday.THURSDAY, 6: Weekday.SUNDAY}
        
        current_weekday = weekday_map.get(target_date.weekday())
        if not current_weekday:
            return
        
        db = await self.get_session()
        stmt = select(PermanentAbsence).where(PermanentAbsence.weekday == current_weekday)
        result = await db.execute(stmt)
        permanent_absences = result.scalars().all()
        
        for absence in permanent_absences:
            attendance_stmt = select(Attendance).where(
                and_(Attendance.student_id == absence.student_id, Attendance.date == target_date)
            )
            attendance_result = await db.execute(attendance_stmt)
            existing = attendance_result.scalar_one_or_none()
            
            if not existing:
                attendance = Attendance(
                    student_id=absence.student_id,
                    date=target_date,
                    status=AttendanceStatus.PERMANENT_ABSENCE,
                    sub_status=SubStatus.NONE,
                    reported_by=ReportedBy.AUTO
                )
                db.add(attendance)
        
        await db.commit()
    
    async def process_late_arrivals(self, target_date: date):
        if not await self.is_school_day(target_date):
            return
        
        current_time = datetime.now().time()
        if current_time < time(10, 0) or current_time > time(10, 30):
            return
        
        db = await self.get_session()
        stmt = select(Attendance).where(
            and_(
                Attendance.date == target_date,
                Attendance.status == AttendanceStatus.NOT_REPORTED,
                Attendance.override_locked == False
            )
        )
        result = await db.execute(stmt)
        attendances = result.scalars().all()
        
        for attendance in attendances:
            attendance.status = AttendanceStatus.PRESENT
            attendance.sub_status = SubStatus.LATE
            attendance.reported_by = ReportedBy.AUTO
            attendance.check_in_time = datetime.now()
        
        await db.commit()
    
    async def process_yom_lo_ba_li(self, target_date: date):
        if not await self.is_school_day(target_date):
            return
        
        current_time = datetime.now().time()
        if current_time < time(10, 30):
            return
        
        db = await self.get_session()
        stmt = select(Attendance).where(
            and_(
                Attendance.date == target_date,
                Attendance.status == AttendanceStatus.NOT_REPORTED,
                Attendance.override_locked == False
            )
        )
        result = await db.execute(stmt)
        attendances = result.scalars().all()
        
        for attendance in attendances:
            attendance.status = AttendanceStatus.YOM_LO_BA_LI
            attendance.sub_status = SubStatus.NONE
            attendance.reported_by = ReportedBy.AUTO
        
        await db.commit()
    
    async def process_auto_checkout(self, target_date: date):
        if not await self.is_school_day(target_date):
            return
        
        current_time = datetime.now().time()
        if current_time < time(16, 0):
            return
        
        db = await self.get_session()
        stmt = select(Attendance).where(
            and_(
                Attendance.date == target_date,
                Attendance.check_out_time.is_(None),
                Attendance.override_locked == False
            )
        )
        result = await db.execute(stmt)
        attendances = result.scalars().all()
        
        for attendance in attendances:
            attendance.status = AttendanceStatus.LEFT
            attendance.sub_status = SubStatus.AUTO_CLOSED
            attendance.reported_by = ReportedBy.AUTO
            attendance.check_out_time = datetime.combine(target_date, time(16, 0))
            attendance.closed_reason = ClosedReason.AUTO_16
        
        await db.commit()
    
    async def check_monthly_violations(self, year: int, month: int):
        db = await self.get_session()
        
        # Get settings
        settings_stmt = select(Settings)
        settings_result = await db.execute(settings_stmt)
        settings = settings_result.scalar_one_or_none()
        if not settings:
            return
        
        # Get all active students
        students_stmt = select(Student).where(Student.activity_status == ActivityStatus.ACTIVE)
        students_result = await db.execute(students_stmt)
        students = students_result.scalars().all()
        
        for student in students:
            # Get monthly stats
            attendances_stmt = select(Attendance).where(
                and_(
                    Attendance.student_id == student.id,
                    extract('year', Attendance.date) == year,
                    extract('month', Attendance.date) == month
                )
            )
            attendances_result = await db.execute(attendances_stmt)
            attendances = attendances_result.scalars().all()
            
            late_count = sum(1 for a in attendances if a.sub_status == SubStatus.LATE)
            yom_lo_ba_li_count = sum(1 for a in attendances if a.status == AttendanceStatus.YOM_LO_BA_LI)
            
            # Check for overrides
            override_stmt = select(StudentMonthlyOverride).where(
                and_(
                    StudentMonthlyOverride.student_id == student.id,
                    StudentMonthlyOverride.year_month == f"{year:04d}-{month:02d}"
                )
            )
            override_result = await db.execute(override_stmt)
            override = override_result.scalar_one_or_none()
            
            late_threshold = override.lateness_threshold_override if override and override.lateness_threshold_override else settings.lateness_threshold_per_month_default
            yom_lo_ba_li_threshold = override.max_yom_lo_ba_li_override if override and override.max_yom_lo_ba_li_override else settings.max_yom_lo_ba_li_per_month_default
            
            # Check violations and create claims
            if late_count > late_threshold:
                await self.create_claim(student.id, ClaimReason.LATE_THRESHOLD)
            
            if yom_lo_ba_li_count >= yom_lo_ba_li_threshold:
                await self.create_claim(student.id, ClaimReason.THIRD_YOM_LO_BA_LI)
    
    async def create_claim(self, student_id: int, reason: ClaimReason):
        db = await self.get_session()
        
        # Check if claim already exists for this month
        today = date.today()
        existing_stmt = select(Claim).where(
            and_(
                Claim.student_id == student_id,
                Claim.reason == reason,
                extract('year', Claim.date_opened) == today.year,
                extract('month', Claim.date_opened) == today.month,
                Claim.status == ClaimStatus.OPEN
            )
        )
        existing_result = await db.execute(existing_stmt)
        existing_claim = existing_result.scalar_one_or_none()
        
        if existing_claim:
            return
        
        claim = Claim(
            student_id=student_id,
            date_opened=today,
            reason=reason,
            notified_to=json.dumps(["manager", "student", "court_chair"]),
            status=ClaimStatus.OPEN
        )
        db.add(claim)
        await db.commit()

async def run_automation():
    automation = AttendanceAutomation()
    try:
        today = date.today()
        
        # Morning processes
        await automation.process_permanent_absences(today)
        
        # Late arrival process (10:00-10:30)
        await automation.process_late_arrivals(today)
        
        # Yom lo ba li process (after 10:30)
        await automation.process_yom_lo_ba_li(today)
        
        # Auto checkout (after 16:00)
        await automation.process_auto_checkout(today)
        
        # Monthly violations check
        await automation.check_monthly_violations(today.year, today.month)
        
    finally:
        await automation.close_session()

if __name__ == "__main__":
    asyncio.run(run_automation())