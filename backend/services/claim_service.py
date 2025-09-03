from sqlalchemy.orm import Session
from database import models
from backend import schemas
from typing import List, Optional
from datetime import datetime

class ClaimService:
    def get_claim(self, db: Session, claim_id: int):
        return db.query(models.Claim).filter(models.Claim.id == claim_id).first()

    def get_claims(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Claim).offset(skip).limit(limit).all()

    def get_claims_by_student(self, db: Session, student_id: int):
        return db.query(models.Claim).filter(models.Claim.student_id == student_id).all()

    def create_claim(self, db: Session, claim: schemas.ClaimCreate):
        db_claim = models.Claim(**claim.dict())
        db.add(db_claim)
        db.commit()
        db.refresh(db_claim)
        return db_claim

    def update_claim(self, db: Session, claim_id: int, claim: schemas.ClaimUpdate):
        db_claim = self.get_claim(db, claim_id)
        if db_claim:
            for key, value in claim.dict(exclude_unset=True).items():
                setattr(db_claim, key, value)
            db.commit()
            db.refresh(db_claim)
        return db_claim

    def delete_claim(self, db: Session, claim_id: int):
        db_claim = self.get_claim(db, claim_id)
        if db_claim:
            db.delete(db_claim)
            db.commit()
        return db_claim
