from sqlalchemy.orm import Session
from database import models
from backend import schemas
from typing import List, Optional
from datetime import date

class SchoolHolidayService:
    def get_school_holiday(self, db: Session, school_holiday_id: int):
        return db.query(models.SchoolHoliday).filter(models.SchoolHoliday.id == school_holiday_id).first()

    def get_school_holidays(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.SchoolHoliday).offset(skip).limit(limit).all()

    def get_school_holiday_by_date(self, db: Session, holiday_date: date):
        return db.query(models.SchoolHoliday).filter(models.SchoolHoliday.date == holiday_date).first()

    def create_school_holiday(self, db: Session, school_holiday: schemas.SchoolHolidayCreate):
        db_school_holiday = models.SchoolHoliday(**school_holiday.dict())
        db.add(db_school_holiday)
        db.commit()
        db.refresh(db_school_holiday)
        return db_school_holiday

    def update_school_holiday(self, db: Session, school_holiday_id: int, school_holiday: schemas.SchoolHolidayUpdate):
        db_school_holiday = self.get_school_holiday(db, school_holiday_id)
        if db_school_holiday:
            for key, value in school_holiday.dict(exclude_unset=True).items():
                setattr(db_school_holiday, key, value)
            db.commit()
            db.refresh(db_school_holiday)
        return db_school_holiday

    def delete_school_holiday(self, db: Session, school_holiday_id: int):
        db_school_holiday = self.get_school_holiday(db, school_holiday_id)
        if db_school_holiday:
            db.delete(db_school_holiday)
            db.commit()
        return db_school_holiday
