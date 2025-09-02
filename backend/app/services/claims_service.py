from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract
from datetime import date, datetime
from typing import List, Optional
import json

from ..models import (
    Claim, Student, Attendance, StudentMonthlyOverride, Settings,
    ClaimReason, ClaimStatus
)
from ..schemas import ClaimCreate, ClaimUpdate
from .audit_service import AuditService

class ClaimsService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_service = AuditService(db)
    
    def create_claim(self, claim_data: ClaimCreate) -> Claim:
        """Create a new claim"""
        claim = Claim(**claim_data.dict())
        self.db.add(claim)
        self.db.commit()
        self.db.refresh(claim)
        
        # Log the creation
        self.audit_service.log_action(
            actor="auto",
            action="create_claim",
            entity="claim",
            entity_id=claim.id,
            after=json.dumps(claim_data.dict())
        )
        
        return claim
    
    def get_claim(self, claim_id: int) -> Optional[Claim]:
        """Get a claim by ID"""
        return self.db.query(Claim).filter(Claim.id == claim_id).first()
    
    def get_claims_by_student(self, student_id: int) -> List[Claim]:
        """Get all claims for a specific student"""
        return self.db.query(Claim).filter(Claim.student_id == student_id).all()
    
    def get_open_claims(self) -> List[Claim]:
        """Get all open claims"""
        return self.db.query(Claim).filter(Claim.status == ClaimStatus.OPEN).all()
    
    def get_claims_by_reason(self, reason: ClaimReason) -> List[Claim]:
        """Get claims by reason"""
        return self.db.query(Claim).filter(Claim.reason == reason).all()
    
    def update_claim(self, claim_id: int, update_data: ClaimUpdate) -> Optional[Claim]:
        """Update a claim"""
        claim = self.get_claim(claim_id)
        if not claim:
            return None
        
        # Store before state for audit
        before_state = {
            "reason": claim.reason,
            "notified_to": claim.notified_to,
            "status": claim.status
        }
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(claim, field, value)
        
        self.db.commit()
        self.db.refresh(claim)
        
        # Log the update
        self.audit_service.log_action(
            actor="manager",
            action="update_claim",
            entity="claim",
            entity_id=claim.id,
            before=json.dumps(before_state),
            after=json.dumps(update_data.dict(exclude_unset=True))
        )
        
        return claim
    
    def close_claim(self, claim_id: int) -> Optional[Claim]:
        """Close a claim"""
        return self.update_claim(claim_id, ClaimUpdate(status=ClaimStatus.CLOSED))
    
    def calculate_monthly_statistics(self, year_month: str) -> List[dict]:
        """Calculate monthly statistics for all students"""
        year, month = year_month.split("-")
        
        # Get all active students
        students = self.db.query(Student).filter(Student.activity_status == "פעיל").all()
        
        statistics = []
        for student in students:
            # Count late days
            late_count = self.db.query(Attendance).filter(
                and_(
                    Attendance.student_id == student.id,
                    extract('year', Attendance.date) == int(year),
                    extract('month', Attendance.date) == int(month),
                    Attendance.sub_status == "איחור"
                )
            ).count()
            
            # Count 'yom lo ba li' days
            yom_lo_ba_li_count = self.db.query(Attendance).filter(
                and_(
                    Attendance.student_id == student.id,
                    extract('year', Attendance.date) == int(year),
                    extract('month', Attendance.date) == int(month),
                    Attendance.status == "יום לא בא לי"
                )
            ).count()
            
            # Get thresholds (check for overrides first)
            override = self.db.query(StudentMonthlyOverride).filter(
                and_(
                    StudentMonthlyOverride.student_id == student.id,
                    StudentMonthlyOverride.year_month == year_month
                )
            ).first()
            
            settings = self.db.query(Settings).first()
            
            if override:
                threshold_late = override.lateness_threshold_override or settings.lateness_threshold_per_month_default
                threshold_yom_lo_ba_li = override.max_yom_lo_ba_li_override or settings.max_yom_lo_ba_li_per_month_default
            else:
                threshold_late = settings.lateness_threshold_per_month_default
                threshold_yom_lo_ba_li = settings.max_yom_lo_ba_li_per_month_default
            
            # Check if over threshold
            over_threshold = (late_count > threshold_late) or (yom_lo_ba_li_count >= threshold_yom_lo_ba_li)
            
            statistics.append({
                "year_month": year_month,
                "student_id": student.id,
                "student_name": f"{student.first_name} {student.last_name}",
                "late_count": late_count,
                "yom_lo_ba_li_count": yom_lo_ba_li_count,
                "threshold_late": threshold_late,
                "threshold_yom_lo_ba_li": threshold_yom_lo_ba_li,
                "over_threshold": over_threshold
            })
        
        return statistics
    
    def process_monthly_claims(self, year_month: str) -> List[Claim]:
        """Process monthly claims based on thresholds"""
        statistics = self.calculate_monthly_statistics(year_month)
        created_claims = []
        
        for stat in statistics:
            if not stat["over_threshold"]:
                continue
            
            # Check if claim already exists for this month
            existing_claim = self.db.query(Claim).filter(
                and_(
                    Claim.student_id == stat["student_id"],
                    extract('year', Claim.date_opened) == int(year_month.split("-")[0]),
                    extract('month', Claim.date_opened) == int(year_month.split("-")[1])
                )
            ).first()
            
            if existing_claim:
                continue
            
            # Determine reason
            if stat["late_count"] > stat["threshold_late"]:
                reason = ClaimReason.LATE_THRESHOLD
            elif stat["yom_lo_ba_li_count"] >= stat["threshold_yom_lo_ba_li"]:
                reason = ClaimReason.THIRD_YOM_LO_BA_LI
            else:
                reason = ClaimReason.OTHER
            
            # Create claim
            claim_data = ClaimCreate(
                student_id=stat["student_id"],
                reason=reason,
                notified_to=["manager", "student", "court_chair"]
            )
            
            claim = self.create_claim(claim_data)
            created_claims.append(claim)
        
        return created_claims
    
    def get_claims_summary(self) -> dict:
        """Get summary of claims"""
        total_claims = self.db.query(Claim).count()
        open_claims = self.db.query(Claim).filter(Claim.status == ClaimStatus.OPEN).count()
        closed_claims = self.db.query(Claim).filter(Claim.status == ClaimStatus.CLOSED).count()
        
        claims_by_reason = {}
        for reason in ClaimReason:
            count = self.db.query(Claim).filter(Claim.reason == reason).count()
            claims_by_reason[reason.value] = count
        
        return {
            "total": total_claims,
            "open": open_claims,
            "closed": closed_claims,
            "by_reason": claims_by_reason
        }
    
    def get_claims_for_notification(self) -> List[Claim]:
        """Get claims that need notifications sent"""
        # This would integrate with WhatsApp service
        # For now, return open claims
        return self.get_open_claims()
