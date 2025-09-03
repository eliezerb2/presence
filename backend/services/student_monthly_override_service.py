from sqlalchemy.orm import Session
from database import models
from backend import schemas
from typing import List, Optional

class StudentMonthlyOverrideService:
    def get_student_monthly_override(self, db: Session, override_id: int):
        return db.query(models.StudentMonthlyOverride).filter(models.StudentMonthlyOverride.id == override_id).first()

    def get_student_monthly_overrides(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.StudentMonthlyOverride).offset(skip).limit(limit).all()

    def get_student_monthly_override_by_student_and_month(self, db: Session, student_id: int, year_month: str):
        return db.query(models.StudentMonthlyOverride).filter(
            models.StudentMonthlyOverride.student_id == student_id,
            models.StudentMonthlyOverride.year_month == year_month
        ).first()

    def create_student_monthly_override(self, db: Session, override: schemas.StudentMonthlyOverrideCreate):
        db_override = models.StudentMonthlyOverride(**override.dict())
        db.add(db_override)
        db.commit()
        db.refresh(db_override)
        return db_override

    def update_student_monthly_override(self, db: Session, override_id: int, override: schemas.StudentMonthlyOverrideUpdate):
        db_override = self.get_student_monthly_override(db, override_id)
        if db_override:
            for key, value in override.dict(exclude_unset=True).items():
                setattr(db_override, key, value)
            db.commit()
            db.refresh(db_override)
        return db_override

    def delete_student_monthly_override(self, db: Session, override_id: int):
        db_override = self.get_student_monthly_override(db, override_id)
        if db_override:
            db.delete(db_override)
            db.commit()
        return db_override
