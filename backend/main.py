from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime

from backend import schemas
from backend.database import SessionLocal, engine, create_db_and_tables, get_db
from backend.services import StudentService, AttendanceService, PermanentAbsenceService, SchoolHolidayService, SettingService, StudentMonthlyOverrideService, ClaimService, AuditService, AutomationService, ReportingService

app = FastAPI()

# Dependency to get DB session
student_service = StudentService()
attendance_service = AttendanceService()
permanent_absence_service = PermanentAbsenceService()
school_holiday_service = SchoolHolidayService()
setting_service = SettingService()
student_monthly_override_service = StudentMonthlyOverrideService()
claim_service = ClaimService()
audit_service = AuditService()
automation_service = AutomationService()
reporting_service = ReportingService()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Student Endpoints
@app.get("/students/search/", response_model=List[schemas.Student])
def search_students(query: str, db: Session = Depends(get_db)):
    students = student_service.search_students(db, query)
    return students

@app.post("/students/", response_model=schemas.Student, status_code=status.HTTP_201_CREATED)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    db_student = student_service.create_student(db, student)
    return db_student

@app.get("/students/", response_model=List[schemas.Student])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    students = student_service.get_students(db, skip=skip, limit=limit)
    return students

@app.get("/students/{student_id}", response_model=schemas.Student)
def read_student(student_id: int, db: Session = Depends(get_db)):
    db_student = student_service.get_student(db, student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student

@app.put("/students/{student_id}", response_model=schemas.Student)
def update_student(student_id: int, student: schemas.StudentUpdate, db: Session = Depends(get_db)):
    db_student = student_service.update_student(db, student_id, student)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student

@app.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db_student = student_service.delete_student(db, student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"ok": True}

# Attendance Endpoints
@app.post("/attendance/check-in/{student_id}", response_model=schemas.Attendance)
def check_in_student(student_id: int, reported_by: schemas.ReportedBy, db: Session = Depends(get_db)):
    try:
        attendance_record = attendance_service.check_in_student(db, student_id, reported_by)
        return attendance_record
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/attendance/check-out/{student_id}", response_model=schemas.Attendance)
def check_out_student(student_id: int, reported_by: schemas.ReportedBy, db: Session = Depends(get_db)):
    try:
        attendance_record = attendance_service.check_out_student(db, student_id, reported_by)
        return attendance_record
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/attendance/daily/{attendance_date}", response_model=List[schemas.Attendance])
def get_daily_attendance(attendance_date: str, db: Session = Depends(get_db)):
    try:
        parsed_date = datetime.strptime(attendance_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    attendance_records = attendance_service.get_daily_attendance(db, parsed_date)
    return attendance_records

@app.get("/attendance/{attendance_id}", response_model=schemas.Attendance)
def get_attendance(attendance_id: int, db: Session = Depends(get_db)):
    db_attendance = attendance_service.get_attendance(db, attendance_id)
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return db_attendance

@app.put("/attendance/{attendance_id}", response_model=schemas.Attendance)
def update_attendance(attendance_id: int, attendance: schemas.AttendanceUpdate, db: Session = Depends(get_db)):
    try:
        db_attendance = attendance_service.update_attendance(db, attendance_id, attendance)
        if db_attendance is None:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        return db_attendance
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/attendance/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    db_attendance = attendance_service.delete_attendance(db, attendance_id)
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return {"ok": True}

# Permanent Absence Endpoints
@app.post("/permanent-absences/", response_model=schemas.PermanentAbsence, status_code=status.HTTP_201_CREATED)
def create_permanent_absence(permanent_absence: schemas.PermanentAbsenceCreate, db: Session = Depends(get_db)):
    db_permanent_absence = permanent_absence_service.create_permanent_absence(db, permanent_absence)
    return db_permanent_absence

@app.get("/permanent-absences/", response_model=List[schemas.PermanentAbsence])
def read_permanent_absences(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    permanent_absences = permanent_absence_service.get_permanent_absences(db, skip=skip, limit=limit)
    return permanent_absences

@app.get("/permanent-absences/{permanent_absence_id}", response_model=schemas.PermanentAbsence)
def read_permanent_absence(permanent_absence_id: int, db: Session = Depends(get_db)):
    db_permanent_absence = permanent_absence_service.get_permanent_absence(db, permanent_absence_id)
    if db_permanent_absence is None:
        raise HTTPException(status_code=404, detail="Permanent absence record not found")
    return db_permanent_absence

@app.get("/permanent-absences/student/{student_id}", response_model=List[schemas.PermanentAbsence])
def read_permanent_absences_by_student(student_id: int, db: Session = Depends(get_db)):
    permanent_absences = permanent_absence_service.get_permanent_absences_by_student(db, student_id)
    return permanent_absences

@app.put("/permanent-absences/{permanent_absence_id}", response_model=schemas.PermanentAbsence)
def update_permanent_absence(permanent_absence_id: int, permanent_absence: schemas.PermanentAbsenceUpdate, db: Session = Depends(get_db)):
    db_permanent_absence = permanent_absence_service.update_permanent_absence(db, permanent_absence_id, permanent_absence)
    if db_permanent_absence is None:
        raise HTTPException(status_code=404, detail="Permanent absence record not found")
    return db_permanent_absence

@app.delete("/permanent-absences/{permanent_absence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_permanent_absence(permanent_absence_id: int, db: Session = Depends(get_db)):
    db_permanent_absence = permanent_absence_service.delete_permanent_absence(db, permanent_absence_id)
    if db_permanent_absence is None:
        raise HTTPException(status_code=404, detail="Permanent absence record not found")
    return {"ok": True}

# School Holiday Endpoints
@app.post("/school-holidays/", response_model=schemas.SchoolHoliday, status_code=status.HTTP_201_CREATED)
def create_school_holiday(school_holiday: schemas.SchoolHolidayCreate, db: Session = Depends(get_db)):
    db_school_holiday = school_holiday_service.create_school_holiday(db, school_holiday)
    return db_school_holiday

@app.get("/school-holidays/", response_model=List[schemas.SchoolHoliday])
def read_school_holidays(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    school_holidays = school_holiday_service.get_school_holidays(db, skip=skip, limit=limit)
    return school_holidays

@app.get("/school-holidays/{school_holiday_id}", response_model=schemas.SchoolHoliday)
def read_school_holiday(school_holiday_id: int, db: Session = Depends(get_db)):
    db_school_holiday = school_holiday_service.get_school_holiday(db, school_holiday_id)
    if db_school_holiday is None:
        raise HTTPException(status_code=404, detail="School holiday not found")
    return db_school_holiday

@app.get("/school-holidays/date/{holiday_date}", response_model=schemas.SchoolHoliday)
def read_school_holiday_by_date(holiday_date: str, db: Session = Depends(get_db)):
    try:
        parsed_date = datetime.strptime(holiday_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    db_school_holiday = school_holiday_service.get_school_holiday_by_date(db, parsed_date)
    if db_school_holiday is None:
        raise HTTPException(status_code=404, detail="School holiday not found for this date")
    return db_school_holiday

@app.put("/school-holidays/{school_holiday_id}", response_model=schemas.SchoolHoliday)
def update_school_holiday(school_holiday_id: int, school_holiday: schemas.SchoolHolidayUpdate, db: Session = Depends(get_db)):
    db_school_holiday = school_holiday_service.update_school_holiday(db, school_holiday_id, school_holiday)
    if db_school_holiday is None:
        raise HTTPException(status_code=404, detail="School holiday not found")
    return db_school_holiday

@app.delete("/school-holidays/{school_holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_school_holiday(school_holiday_id: int, db: Session = Depends(get_db)):
    db_school_holiday = school_holiday_service.delete_school_holiday(db, school_holiday_id)
    if db_school_holiday is None:
        raise HTTPException(status_code=404, detail="School holiday not found")
    return {"ok": True}

# Student Monthly Override Endpoints
@app.post("/student-monthly-overrides/", response_model=schemas.StudentMonthlyOverride, status_code=status.HTTP_201_CREATED)
def create_student_monthly_override(override: schemas.StudentMonthlyOverrideCreate, db: Session = Depends(get_db)):
    db_override = student_monthly_override_service.create_student_monthly_override(db, override)
    return db_override

@app.get("/student-monthly-overrides/", response_model=List[schemas.StudentMonthlyOverride])
def read_student_monthly_overrides(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    overrides = student_monthly_override_service.get_student_monthly_overrides(db, skip=skip, limit=limit)
    return overrides

@app.get("/student-monthly-overrides/{override_id}", response_model=schemas.StudentMonthlyOverride)
def read_student_monthly_override(override_id: int, db: Session = Depends(get_db)):
    db_override = student_monthly_override_service.get_student_monthly_override(db, override_id)
    if db_override is None:
        raise HTTPException(status_code=404, detail="Student monthly override not found")
    return db_override

@app.get("/student-monthly-overrides/student/{student_id}/month/{year_month}", response_model=schemas.StudentMonthlyOverride)
def read_student_monthly_override_by_student_and_month(student_id: int, year_month: str, db: Session = Depends(get_db)):
    db_override = student_monthly_override_service.get_student_monthly_override_by_student_and_month(db, student_id, year_month)
    if db_override is None:
        raise HTTPException(status_code=404, detail="Student monthly override not found for this student and month")
    return db_override

@app.put("/student-monthly-overrides/{override_id}", response_model=schemas.StudentMonthlyOverride)
def update_student_monthly_override(override_id: int, override: schemas.StudentMonthlyOverrideUpdate, db: Session = Depends(get_db)):
    db_override = student_monthly_override_service.update_student_monthly_override(db, override_id, override)
    if db_override is None:
        raise HTTPException(status_code=404, detail="Student monthly override not found")
    return db_override

@app.delete("/student-monthly-overrides/{override_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student_monthly_override(override_id: int, db: Session = Depends(get_db)):
    db_override = student_monthly_override_service.delete_student_monthly_override(db, override_id)
    if db_override is None:
        raise HTTPException(status_code=404, detail="Student monthly override not found")
    return {"ok": True}

# Claim Endpoints
@app.post("/claims/", response_model=schemas.Claim, status_code=status.HTTP_201_CREATED)
def create_claim(claim: schemas.ClaimCreate, db: Session = Depends(get_db)):
    db_claim = claim_service.create_claim(db, claim)
    return db_claim

@app.get("/claims/", response_model=List[schemas.Claim])
def read_claims(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    claims = claim_service.get_claims(db, skip=skip, limit=limit)
    return claims

@app.get("/claims/{claim_id}", response_model=schemas.Claim)
def read_claim(claim_id: int, db: Session = Depends(get_db)):
    db_claim = claim_service.get_claim(db, claim_id)
    if db_claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")
    return db_claim

@app.get("/claims/student/{student_id}", response_model=List[schemas.Claim])
def read_claims_by_student(student_id: int, db: Session = Depends(get_db)):
    claims = claim_service.get_claims_by_student(db, student_id)
    return claims

@app.put("/claims/{claim_id}", response_model=schemas.Claim)
def update_claim(claim_id: int, claim: schemas.ClaimUpdate, db: Session = Depends(get_db)):
    db_claim = claim_service.update_claim(db, claim_id, claim)
    if db_claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")
    return db_claim

@app.delete("/claims/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_claim(claim_id: int, db: Session = Depends(get_db)):
    db_claim = claim_service.delete_claim(db, claim_id)
    if db_claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")
    return {"ok": True}

# Audit Log Endpoints (Read-only)
@app.get("/audit-logs/", response_model=List[schemas.AuditLog])
def read_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    audit_logs = audit_service.get_audit_log_entries(db, skip=skip, limit=limit)
    return audit_logs

@app.get("/audit-logs/{entry_id}", response_model=schemas.AuditLog)
def read_audit_log_entry(entry_id: int, db: Session = Depends(get_db)):
    db_entry = audit_service.get_audit_log_entry(db, entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Audit log entry not found")
    return db_entry

@app.get("/audit-logs/entity/{entity}/{entity_id}", response_model=List[schemas.AuditLog])
def read_audit_logs_by_entity(entity: str, entity_id: int, db: Session = Depends(get_db)):
    audit_logs = audit_service.get_audit_log_by_entity(db, entity, entity_id)
    return audit_logs

@app.get("/audit-logs/actor/{actor}", response_model=List[schemas.AuditLog])
def read_audit_logs_by_actor(actor: str, db: Session = Depends(get_db)):
    audit_logs = audit_service.get_audit_log_by_actor(db, actor)
    return audit_logs

# Automation Trigger Endpoint
@app.post("/automations/run-daily/", status_code=status.HTTP_200_OK)
def run_daily_automations(current_date: str = date.today().isoformat(), db: Session = Depends(get_db)):
    try:
        parsed_date = datetime.strptime(current_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    automation_service.run_daily_automations(db, parsed_date)
    return {"message": f"Daily automations triggered for {parsed_date}"}

# Reporting Trigger Endpoint
@app.post("/reporting/run-monthly/", status_code=status.HTTP_200_OK)
def run_monthly_reporting(year_month: str = date.today().strftime("%Y-%m"), db: Session = Depends(get_db)):
    try:
        # Validate year_month format
        datetime.strptime(year_month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid year_month format. Use YYYY-MM.")
    reporting_service.run_monthly_reporting(db, year_month)
    return {"message": f"Monthly reporting triggered for {year_month}"}
