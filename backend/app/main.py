from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .database import SessionLocal, engine, Base
from . import models, schemas, crud

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "detail": str(e)}

# Student Endpoints
@app.post("/students/", response_model=schemas.Student)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    db_student = crud.get_student_by_student_number(db, student_number=student.student_number)
    if db_student:
        raise HTTPException(status_code=400, detail="Student number already registered")
    return crud.create_student(db=db, student=student)

@app.get("/students/", response_model=List[schemas.Student])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    students = crud.get_students(db, skip=skip, limit=limit)
    return students

@app.get("/students/{student_id}", response_model=schemas.Student)
def read_student(student_id: int, db: Session = Depends(get_db)):
    db_student = crud.get_student(db, student_id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student

@app.put("/students/{student_id}", response_model=schemas.Student)
def update_student(student_id: int, student: schemas.StudentUpdate, db: Session = Depends(get_db)):
    db_student = crud.update_student(db, student_id=student_id, student=student)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student

@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db_student = crud.delete_student(db, student_id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

# Attendance Endpoints
@app.post("/attendance/", response_model=schemas.Attendance)
def create_attendance(attendance: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    return crud.create_attendance(db=db, attendance=attendance)

@app.get("/attendance/", response_model=List[schemas.Attendance])
def read_attendance_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    attendance_records = crud.get_attendance_records(db, skip=skip, limit=limit)
    return attendance_records

@app.get("/attendance/{attendance_id}", response_model=schemas.Attendance)
def read_attendance(attendance_id: int, db: Session = Depends(get_db)):
    db_attendance = crud.get_attendance(db, attendance_id=attendance_id)
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return db_attendance

@app.put("/attendance/{attendance_id}", response_model=schemas.Attendance)
def update_attendance(attendance_id: int, attendance: schemas.AttendanceUpdate, db: Session = Depends(get_db)):
    db_attendance = crud.update_attendance(db, attendance_id=attendance_id, attendance=attendance)
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return db_attendance

@app.delete("/attendance/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    db_attendance = crud.delete_attendance(db, attendance_id=attendance_id)
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return {"message": "Attendance record deleted successfully"}

# Permanent Absence Endpoints
@app.post("/permanent_absences/", response_model=schemas.PermanentAbsence)
def create_permanent_absence(permanent_absence: schemas.PermanentAbsenceCreate, db: Session = Depends(get_db)):
    return crud.create_permanent_absence(db=db, permanent_absence=permanent_absence)

@app.get("/permanent_absences/", response_model=List[schemas.PermanentAbsence])
def read_permanent_absences(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    permanent_absences = crud.get_permanent_absences(db, skip=skip, limit=limit)
    return permanent_absences

@app.get("/permanent_absences/{permanent_absence_id}", response_model=schemas.PermanentAbsence)
def read_permanent_absence(permanent_absence_id: int, db: Session = Depends(get_db)):
    db_permanent_absence = crud.get_permanent_absence(db, permanent_absence_id=permanent_absence_id)
    if db_permanent_absence is None:
        raise HTTPException(status_code=404, detail="Permanent absence record not found")
    return db_permanent_absence

@app.put("/permanent_absences/{permanent_absence_id}", response_model=schemas.PermanentAbsence)
def update_permanent_absence(permanent_absence_id: int, permanent_absence: schemas.PermanentAbsenceUpdate, db: Session = Depends(get_db)):
    db_permanent_absence = crud.update_permanent_absence(db, permanent_absence_id=permanent_absence_id, permanent_absence=permanent_absence)
    if db_permanent_absence is None:
        raise HTTPException(status_code=404, detail="Permanent absence record not found")
    return db_permanent_absence

@app.delete("/permanent_absences/{permanent_absence_id}")
def delete_permanent_absence(permanent_absence_id: int, db: Session = Depends(get_db)):
    db_permanent_absence = crud.delete_permanent_absence(db, permanent_absence_id=permanent_absence_id)
    if db_permanent_absence is None:
        raise HTTPException(status_code=404, detail="Permanent absence record not found")
    return {"message": "Permanent absence record deleted successfully"}

# School Holiday Endpoints
@app.post("/school_holidays/", response_model=schemas.SchoolHoliday)
def create_school_holiday(school_holiday: schemas.SchoolHolidayCreate, db: Session = Depends(get_db)):
    return crud.create_school_holiday(db=db, school_holiday=school_holiday)

@app.get("/school_holidays/", response_model=List[schemas.SchoolHoliday])
def read_school_holidays(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    school_holidays = crud.get_school_holidays(db, skip=skip, limit=limit)
    return school_holidays

@app.get("/school_holidays/{school_holiday_id}", response_model=schemas.SchoolHoliday)
def read_school_holiday(school_holiday_id: int, db: Session = Depends(get_db)):
    db_school_holiday = crud.get_school_holiday(db, school_holiday_id=school_holiday_id)
    if db_school_holiday is None:
        raise HTTPException(status_code=404, detail="School holiday record not found")
    return db_school_holiday

@app.put("/school_holidays/{school_holiday_id}", response_model=schemas.SchoolHoliday)
def update_school_holiday(school_holiday_id: int, school_holiday: schemas.SchoolHolidayUpdate, db: Session = Depends(get_db)):
    db_school_holiday = crud.update_school_holiday(db, school_holiday_id=school_holiday_id, school_holiday=school_holiday)
    if db_school_holiday is None:
        raise HTTPException(status_code=404, detail="School holiday record not found")
    return db_school_holiday

@app.delete("/school_holidays/{school_holiday_id}")
def delete_school_holiday(school_holiday_id: int, db: Session = Depends(get_db)):
    db_school_holiday = crud.delete_school_holiday(db, school_holiday_id=school_holiday_id)
    if db_school_holiday is None:
        raise HTTPException(status_code=404, detail="School holiday record not found")
    return {"message": "School holiday record deleted successfully"}

# Setting Endpoints
@app.post("/settings/", response_model=schemas.Setting)
def create_setting(setting: schemas.SettingCreate, db: Session = Depends(get_db)):
    return crud.create_setting(db=db, setting=setting)

@app.get("/settings/", response_model=List[schemas.Setting])
def read_settings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    settings = crud.get_settings(db, skip=skip, limit=limit)
    return settings

@app.get("/settings/{setting_id}", response_model=schemas.Setting)
def read_setting(setting_id: int, db: Session = Depends(get_db)):
    db_setting = crud.get_setting(db, setting_id=setting_id)
    if db_setting is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return db_setting

@app.put("/settings/{setting_id}", response_model=schemas.Setting)
def update_setting(setting_id: int, setting: schemas.SettingUpdate, db: Session = Depends(get_db)):
    db_setting = crud.update_setting(db, setting_id=setting_id, setting=setting)
    if db_setting is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return db_setting

@app.delete("/settings/{setting_id}")
def delete_setting(setting_id: int, db: Session = Depends(get_db)):
    db_setting = crud.delete_setting(db, setting_id=setting_id)
    if db_setting is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"message": "Setting deleted successfully"}

# Student Monthly Override Endpoints
@app.post("/student_monthly_overrides/", response_model=schemas.StudentMonthlyOverride)
def create_student_monthly_override(student_monthly_override: schemas.StudentMonthlyOverrideCreate, db: Session = Depends(get_db)):
    return crud.create_student_monthly_override(db=db, student_monthly_override=student_monthly_override)

@app.get("/student_monthly_overrides/", response_model=List[schemas.StudentMonthlyOverride])
def read_student_monthly_overrides(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    student_monthly_overrides = crud.get_student_monthly_overrides(db, skip=skip, limit=limit)
    return student_monthly_overrides

@app.get("/student_monthly_overrides/{student_monthly_override_id}", response_model=schemas.StudentMonthlyOverride)
def read_student_monthly_override(student_monthly_override_id: int, db: Session = Depends(get_db)):
    db_student_monthly_override = crud.get_student_monthly_override(db, student_monthly_override_id=student_monthly_override_id)
    if db_student_monthly_override is None:
        raise HTTPException(status_code=404, detail="Student monthly override record not found")
    return db_student_monthly_override

@app.put("/student_monthly_overrides/{student_monthly_override_id}", response_model=schemas.StudentMonthlyOverride)
def update_student_monthly_override(student_monthly_override_id: int, student_monthly_override: schemas.StudentMonthlyOverrideUpdate, db: Session = Depends(get_db)):
    db_student_monthly_override = crud.update_student_monthly_override(db, student_monthly_override_id=student_monthly_override_id, student_monthly_override=student_monthly_override)
    if db_student_monthly_override is None:
        raise HTTPException(status_code=404, detail="Student monthly override record not found")
    return db_student_monthly_override

@app.delete("/student_monthly_overrides/{student_monthly_override_id}")
def delete_student_monthly_override(student_monthly_override_id: int, db: Session = Depends(get_db)):
    db_student_monthly_override = crud.delete_student_monthly_override(db, student_monthly_override_id=student_monthly_override_id)
    if db_student_monthly_override is None:
        raise HTTPException(status_code=404, detail="Student monthly override record not found")
    return {"message": "Student monthly override record deleted successfully"}

# Claim Endpoints
@app.post("/claims/", response_model=schemas.Claim)
def create_claim(claim: schemas.ClaimCreate, db: Session = Depends(get_db)):
    return crud.create_claim(db=db, claim=claim)

@app.get("/claims/", response_model=List[schemas.Claim])
def read_claims(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    claims = crud.get_claims(db, skip=skip, limit=limit)
    return claims

@app.get("/claims/{claim_id}", response_model=schemas.Claim)
def read_claim(claim_id: int, db: Session = Depends(get_db)):
    db_claim = crud.get_claim(db, claim_id=claim_id)
    if db_claim is None:
        raise HTTPException(status_code=404, detail="Claim record not found")
    return db_claim

@app.put("/claims/{claim_id}", response_model=schemas.Claim)
def update_claim(claim_id: int, claim: schemas.ClaimUpdate, db: Session = Depends(get_db)):
    db_claim = crud.update_claim(db, claim_id=claim_id, claim=claim)
    if db_claim is None:
        raise HTTPException(status_code=404, detail="Claim record not found")
    return db_claim

@app.delete("/claims/{claim_id}")
def delete_claim(claim_id: int, db: Session = Depends(get_db)):
    db_claim = crud.delete_claim(db, claim_id=claim_id)
    if db_claim is None:
        raise HTTPException(status_code=404, detail="Claim record not found")
    return {"message": "Claim record deleted successfully"}

# Audit Log Endpoints
@app.post("/audit_logs/", response_model=schemas.AuditLog)
def create_audit_log(audit_log: schemas.AuditLogCreate, db: Session = Depends(get_db)):
    return crud.create_audit_log(db=db, audit_log=audit_log)

@app.get("/audit_logs/", response_model=List[schemas.AuditLog])
def read_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    audit_logs = crud.get_audit_logs(db, skip=skip, limit=limit)
    return audit_logs

@app.get("/audit_logs/{audit_log_id}", response_model=schemas.AuditLog)
def read_audit_log(audit_log_id: int, db: Session = Depends(get_db)):
    db_audit_log = crud.get_audit_log(db, audit_log_id=audit_log_id)
    if db_audit_log is None:
        raise HTTPException(status_code=404, detail="Audit log record not found")
    return db_audit_log

@app.put("/audit_logs/{audit_log_id}", response_model=schemas.AuditLog)
def update_audit_log(audit_log_id: int, audit_log: schemas.AuditLogUpdate, db: Session = Depends(get_db)):
    db_audit_log = crud.update_audit_log(db, audit_log_id=audit_log_id, audit_log=audit_log)
    if db_audit_log is None:
        raise HTTPException(status_code=404, detail="Audit log record not found")
    return db_audit_log

@app.delete("/audit_logs/{audit_log_id}")
def delete_audit_log(audit_log_id: int, db: Session = Depends(get_db)):
    db_audit_log = crud.delete_audit_log(db, audit_log_id=audit_log_id)
    if db_audit_log is None:
        raise HTTPException(status_code=404, detail="Audit log record not found")
    return {"message": "Audit log record deleted successfully"}