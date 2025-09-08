from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.base import get_db
from ..models.claim import Claim
from ..models.student import Student
from ..schemas.claim import ClaimCreate, ClaimUpdate, ClaimResponse
from ..services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[ClaimResponse])
def get_claims(
    student_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Claim)
    
    if student_id:
        query = query.filter(Claim.student_id == student_id)
    if status_filter:
        query = query.filter(Claim.status == status_filter)
    
    claims = query.offset(skip).limit(limit).all()
    return claims

@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim

@router.post("/", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def create_claim(claim: ClaimCreate, db: Session = Depends(get_db)):
    # Check if student exists
    student = db.query(Student).filter(Student.id == claim.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db_claim = Claim(**claim.dict())
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)
    
    log_audit(db, "auto", "create", "claim", db_claim.id, None, claim.dict())
    
    return db_claim

@router.put("/{claim_id}", response_model=ClaimResponse)
def update_claim(claim_id: int, claim: ClaimUpdate, db: Session = Depends(get_db)):
    db_claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not db_claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    original_data = {
        "reason": db_claim.reason.value if db_claim.reason else None,
        "notified_to": db_claim.notified_to,
        "status": db_claim.status.value if db_claim.status else None
    }
    
    update_data = claim.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_claim, field, value)
    
    db.commit()
    db.refresh(db_claim)
    
    log_audit(db, "manager", "update", "claim", claim_id, original_data, update_data)
    
    return db_claim

@router.delete("/{claim_id}")
def delete_claim(claim_id: int, db: Session = Depends(get_db)):
    db_claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not db_claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    original_data = {
        "student_id": db_claim.student_id,
        "date_opened": db_claim.date_opened.isoformat(),
        "reason": db_claim.reason.value if db_claim.reason else None,
        "status": db_claim.status.value if db_claim.status else None
    }
    
    db.delete(db_claim)
    db.commit()
    
    log_audit(db, "manager", "delete", "claim", claim_id, original_data, None)
    
    return {"message": "Claim deleted successfully"}