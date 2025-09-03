from sqlalchemy.orm import Session
from database import models
from backend import schemas
from typing import List, Optional
from backend.services.audit_service import AuditService
import json

class SettingService:
    def __init__(self):
        self.audit_service = AuditService()

    def get_setting(self, db: Session, setting_id: int):
        return db.query(models.Setting).filter(models.Setting.id == setting_id).first()

    def get_global_settings(self, db: Session):
        settings = db.query(models.Setting).first()
        if not settings:
            # Create default settings if none exist
            default_settings = schemas.SettingCreate(
                lateness_threshold_per_month_default=3,
                max_yom_lo_ba_li_per_month_default=2,
                court_chair_name="Default Court Chair",
                court_chair_phone="123-456-7890"
            )
            settings = self.create_setting(db, default_settings)
        return settings

    def create_setting(self, db: Session, setting: schemas.SettingCreate):
        db_setting = models.Setting(**setting.dict())
        db.add(db_setting)
        db.commit()
        db.refresh(db_setting)
        return db_setting

    def update_setting(self, db: Session, setting_id: int, setting: schemas.SettingUpdate):
        db_setting = self.get_setting(db, setting_id)
        if db_setting:
            before_state = {c.name: getattr(db_setting, c.name) for c in db_setting.__table__.columns}
            for key, value in setting.dict(exclude_unset=True).items():
                setattr(db_setting, key, value)
            db.commit()
            db.refresh(db_setting)
            after_state = {c.name: getattr(db_setting, c.name) for c in db_setting.__table__.columns}
            self.audit_service.create_audit_log_entry(db, schemas.AuditLogCreate(
                actor="manager", # Assuming manager updates settings
                action="update_settings",
                entity="Setting",
                entity_id=db_setting.id,
                before=json.dumps(before_state, default=str),
                after=json.dumps(after_state, default=str)
            ))
        return db_setting

    def delete_setting(self, db: Session, setting_id: int):
        db_setting = self.get_setting(db, setting_id)
        if db_setting:
            db.delete(db_setting)
            db.commit()
        return db_setting
