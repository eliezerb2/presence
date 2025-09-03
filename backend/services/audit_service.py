from sqlalchemy.orm import Session
from database import models
from backend import schemas
from typing import List, Optional, Dict, Any
from datetime import datetime

class AuditService:
    def get_audit_log_entry(self, db: Session, entry_id: int):
        return db.query(models.AuditLog).filter(models.AuditLog.id == entry_id).first()

    def get_audit_log_entries(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.AuditLog).offset(skip).limit(limit).all()

    def create_audit_log_entry(self, db: Session, audit_log_entry: schemas.AuditLogCreate):
        db_audit_log_entry = models.AuditLog(**audit_log_entry.dict())
        db.add(db_audit_log_entry)
        db.commit()
        db.refresh(db_audit_log_entry)
        return db_audit_log_entry

    def get_audit_log_by_entity(self, db: Session, entity: str, entity_id: int):
        return db.query(models.AuditLog).filter(models.AuditLog.entity == entity, models.AuditLog.entity_id == entity_id).all()

    def get_audit_log_by_actor(self, db: Session, actor: str):
        return db.query(models.AuditLog).filter(models.AuditLog.actor == actor).all()
