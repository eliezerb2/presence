from sqlalchemy.orm import Session

from . import models, schemas

def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_student_by_student_number(db: Session, student_number: str):
    return db.query(models.Student).filter(models.Student.student_number == student_number).first()

def get_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Student).offset(skip).limit(limit).all()

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student: schemas.StudentUpdate):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if db_student:
        for key, value in student.dict(exclude_unset=True).items():
            setattr(db_student, key, value)
        db.commit()
        db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if db_student:
        db.delete(db_student)
        db.commit()
    return db_student

def get_attendance(db: Session, attendance_id: int):
    return db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()

def get_attendance_records(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Attendance).offset(skip).limit(limit).all()

def create_attendance(db: Session, attendance: schemas.AttendanceCreate):
    db_attendance = models.Attendance(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def update_attendance(db: Session, attendance_id: int, attendance: schemas.AttendanceUpdate):
    db_attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if db_attendance:
        for key, value in attendance.dict(exclude_unset=True).items():
            setattr(db_attendance, key, value)
        db.commit()
        db.refresh(db_attendance)
    return db_attendance

def delete_attendance(db: Session, attendance_id: int):
    db_attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if db_attendance:
        db.delete(db_attendance)
        db.commit()
    return db_attendance

def get_permanent_absence(db: Session, permanent_absence_id: int):
    return db.query(models.PermanentAbsence).filter(models.PermanentAbsence.id == permanent_absence_id).first()

def get_permanent_absences(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.PermanentAbsence).offset(skip).limit(limit).all()

def create_permanent_absence(db: Session, permanent_absence: schemas.PermanentAbsenceCreate):
    db_permanent_absence = models.PermanentAbsence(**permanent_absence.dict())
    db.add(db_permanent_absence)
    db.commit()
    db.refresh(db_permanent_absence)
    return db_permanent_absence

def update_permanent_absence(db: Session, permanent_absence_id: int, permanent_absence: schemas.PermanentAbsenceUpdate):
    db_permanent_absence = db.query(models.PermanentAbsence).filter(models.PermanentAbsence.id == permanent_absence_id).first()
    if db_permanent_absence:
        for key, value in permanent_absence.dict(exclude_unset=True).items():
            setattr(db_permanent_absence, key, value)
        db.commit()
        db.refresh(db_permanent_absence)
    return db_permanent_absence

def delete_permanent_absence(db: Session, permanent_absence_id: int):
    db_permanent_absence = db.query(models.PermanentAbsence).filter(models.PermanentAbsence.id == permanent_absence_id).first()
    if db_permanent_absence:
        db.delete(db_permanent_absence)
        db.commit()
    return db_permanent_absence

def get_school_holiday(db: Session, school_holiday_id: int):
    return db.query(models.SchoolHoliday).filter(models.SchoolHoliday.id == school_holiday_id).first()

def get_school_holidays(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.SchoolHoliday).offset(skip).limit(limit).all()

def create_school_holiday(db: Session, school_holiday: schemas.SchoolHolidayCreate):
    db_school_holiday = models.SchoolHoliday(**school_holiday.dict())
    db.add(db_school_holiday)
    db.commit()
    db.refresh(db_school_holiday)
    return db_school_holiday

def update_school_holiday(db: Session, school_holiday_id: int, school_holiday: schemas.SchoolHolidayUpdate):
    db_school_holiday = db.query(models.SchoolHoliday).filter(models.SchoolHoliday.id == school_holiday_id).first()
    if db_school_holiday:
        for key, value in school_holiday.dict(exclude_unset=True).items():
            setattr(db_school_holiday, key, value)
        db.commit()
        db.refresh(db_school_holiday)
    return db_school_holiday

def delete_school_holiday(db: Session, school_holiday_id: int):
    db_school_holiday = db.query(models.SchoolHoliday).filter(models.SchoolHoliday.id == school_holiday_id).first()
    if db_school_holiday:
        db.delete(db_school_holiday)
        db.commit()
    return db_school_holiday

def get_setting(db: Session, setting_id: int):
    return db.query(models.Setting).filter(models.Setting.id == setting_id).first()

def get_settings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Setting).offset(skip).limit(limit).all()

def create_setting(db: Session, setting: schemas.SettingCreate):
    db_setting = models.Setting(**setting.dict())
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

def update_setting(db: Session, setting_id: int, setting: schemas.SettingUpdate):
    db_setting = db.query(models.Setting).filter(models.Setting.id == setting_id).first()
    if db_setting:
        for key, value in setting.dict(exclude_unset=True).items():
            setattr(db_setting, key, value)
        db.commit()
        db.refresh(db_setting)
    return db_setting

def delete_setting(db: Session, setting_id: int):
    db_setting = db.query(models.Setting).filter(models.Setting.id == setting_id).first()
    if db_setting:
        db.delete(db_setting)
        db.commit()
    return db_setting

def get_student_monthly_override(db: Session, student_monthly_override_id: int):
    return db.query(models.StudentMonthlyOverride).filter(models.StudentMonthlyOverride.id == student_monthly_override_id).first()

def get_student_monthly_overrides(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StudentMonthlyOverride).offset(skip).limit(limit).all()

def create_student_monthly_override(db: Session, student_monthly_override: schemas.StudentMonthlyOverrideCreate):
    db_student_monthly_override = models.StudentMonthlyOverride(**student_monthly_override.dict())
    db.add(db_student_monthly_override)
    db.commit()
    db.refresh(db_student_monthly_override)
    return db_student_monthly_override

def update_student_monthly_override(db: Session, student_monthly_override_id: int, student_monthly_override: schemas.StudentMonthlyOverrideUpdate):
    db_student_monthly_override = db.query(models.StudentMonthlyOverride).filter(models.StudentMonthlyOverride.id == student_monthly_override_id).first()
    if db_student_monthly_override:
        for key, value in student_monthly_override.dict(exclude_unset=True).items():
            setattr(db_student_monthly_override, key, value)
        db.commit()
        db.refresh(db_student_monthly_override)
    return db_student_monthly_override

def delete_student_monthly_override(db: Session, student_monthly_override_id: int):
    db_student_monthly_override = db.query(models.StudentMonthlyOverride).filter(models.StudentMonthlyOverride.id == student_monthly_override_id).first()
    if db_student_monthly_override:
        db.delete(db_student_monthly_override)
        db.commit()
    return db_student_monthly_override

def get_claim(db: Session, claim_id: int):
    return db.query(models.Claim).filter(models.Claim.id == claim_id).first()

def get_claims(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Claim).offset(skip).limit(limit).all()

def create_claim(db: Session, claim: schemas.ClaimCreate):
    db_claim = models.Claim(**claim.dict())
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)
    return db_claim

def update_claim(db: Session, claim_id: int, claim: schemas.ClaimUpdate):
    db_claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if db_claim:
        for key, value in claim.dict(exclude_unset=True).items():
            setattr(db_claim, key, value)
        db.commit()
        db.refresh(db_claim)
    return db_claim

def delete_claim(db: Session, claim_id: int):
    db_claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if db_claim:
        db.delete(db_claim)
        db.commit()
    return db_claim

def get_audit_log(db: Session, audit_log_id: int):
    return db.query(models.AuditLog).filter(models.AuditLog.id == audit_log_id).first()

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.AuditLog).offset(skip).limit(limit).all()

def create_audit_log(db: Session, audit_log: schemas.AuditLogCreate):
    db_audit_log = models.AuditLog(**audit_log.dict())
    db.add(db_audit_log)
    db.commit()
    db.refresh(db_audit_log)
    return db_audit_log

def update_audit_log(db: Session, audit_log_id: int, audit_log: schemas.AuditLogUpdate):
    db_audit_log = db.query(models.AuditLog).filter(models.AuditLog.id == audit_log_id).first()
    if db_audit_log:
        for key, value in audit_log.dict(exclude_unset=True).items():
            setattr(db_audit_log, key, value)
        db.commit()
        db.refresh(db_audit_log)
    return db_audit_log

def delete_audit_log(db: Session, audit_log_id: int):
    db_audit_log = db.query(models.AuditLog).filter(models.AuditLog.id == audit_log_id).first()
    if db_audit_log:
        db.delete(db_audit_log)
        db.commit()
    return db_audit_log