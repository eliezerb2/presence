from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.settings import Settings
from ..schemas.settings import SettingsUpdate, SettingsResponse
from ..services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    if not settings:
        # Create default settings if none exist
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/", response_model=SettingsResponse)
def update_settings(settings_update: SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    if not settings:
        # Create new settings if none exist
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    original_data = {
        "lateness_threshold_per_month_default": settings.lateness_threshold_per_month_default,
        "max_yom_lo_ba_li_per_month_default": settings.max_yom_lo_ba_li_per_month_default,
        "court_chair_name": settings.court_chair_name,
        "court_chair_phone": settings.court_chair_phone
    }
    
    update_data = settings_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    
    log_audit(db, "manager", "update", "settings", settings.id, original_data, update_data)
    
    return settings