from sqlalchemy.orm import Session
from ..models import AuditLog
import json

class AuditService:
    def __init__(self, db: Session):
        self.db = db
    
    def log_action(self, actor: str, action: str, entity: str, entity_id: int, 
                   before: str = None, after: str = None):
        """Log an action in the audit log"""
        audit_entry = AuditLog(
            actor=actor,
            action=action,
            entity=entity,
            entity_id=entity_id,
            before=before,
            after=after
        )
        
        self.db.add(audit_entry)
        self.db.commit()
    
    def get_audit_logs(self, entity: str = None, entity_id: int = None, 
                       actor: str = None, limit: int = 100):
        """Get audit logs with optional filtering"""
        query = self.db.query(AuditLog)
        
        if entity:
            query = query.filter(AuditLog.entity == entity)
        
        if entity_id:
            query = query.filter(AuditLog.entity_id == entity_id)
        
        if actor:
            query = query.filter(AuditLog.actor == actor)
        
        return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    def get_audit_logs_for_student(self, student_id: int, limit: int = 100):
        """Get audit logs for a specific student"""
        return self.get_audit_logs(entity="student", entity_id=student_id, limit=limit)
    
    def get_audit_logs_for_attendance(self, attendance_id: int, limit: int = 100):
        """Get audit logs for a specific attendance record"""
        return self.get_audit_logs(entity="attendance", entity_id=attendance_id, limit=limit)
