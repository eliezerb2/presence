from sqlalchemy.orm import Session
from ..models.audit_log import AuditLog
from typing import Optional, Dict, Any
from datetime import datetime

def log_audit(
    db: Session,
    actor: str,
    action: str,
    entity: str,
    entity_id: int,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None
):
    """Log an audit entry"""
    audit_entry = AuditLog(
        actor=actor,
        action=action,
        entity=entity,
        entity_id=entity_id,
        before=before,
        after=after,
        timestamp=datetime.utcnow()
    )
    db.add(audit_entry)
    db.commit()