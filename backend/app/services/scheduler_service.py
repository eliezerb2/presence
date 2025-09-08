from celery import Celery
from celery.schedules import crontab
from datetime import date
from .automation_service import (
    process_permanent_absences,
    send_morning_reminders,
    process_automatic_late_marking,
    process_automatic_absent_marking,
    process_automatic_day_closure,
    process_monthly_claims
)
from ..models.base import SessionLocal

# Create Celery app
celery_app = Celery(
    "presence_scheduler",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Jerusalem",
    enable_utc=True,
    beat_schedule={
        # Morning permanent absence processing - 8:00 AM
        "process-permanent-absences": {
            "task": "app.services.scheduler_service.process_permanent_absences_task",
            "schedule": crontab(hour=8, minute=0),
        },
        # Morning reminders - 9:30 AM
        "send-morning-reminders": {
            "task": "app.services.scheduler_service.send_morning_reminders_task",
            "schedule": crontab(hour=9, minute=30),
        },
        # Automatic late marking - 10:00 AM
        "process-automatic-late": {
            "task": "app.services.scheduler_service.process_automatic_late_task",
            "schedule": crontab(hour=10, minute=0),
        },
        # Automatic absent marking - 10:30 AM
        "process-automatic-absent": {
            "task": "app.services.scheduler_service.process_automatic_absent_task",
            "schedule": crontab(hour=10, minute=30),
        },
        # Automatic day closure - 4:00 PM
        "process-day-closure": {
            "task": "app.services.scheduler_service.process_day_closure_task",
            "schedule": crontab(hour=16, minute=0),
        },
        # Monthly claims processing - Daily at 6:00 PM
        "process-monthly-claims": {
            "task": "app.services.scheduler_service.process_monthly_claims_task",
            "schedule": crontab(hour=18, minute=0),
        },
    },
)

@celery_app.task
def process_permanent_absences_task():
    """Celery task for processing permanent absences"""
    db = SessionLocal()
    try:
        process_permanent_absences(db)
        return "Permanent absences processed successfully"
    except Exception as e:
        return f"Error processing permanent absences: {str(e)}"
    finally:
        db.close()

@celery_app.task
def send_morning_reminders_task():
    """Celery task for sending morning reminders"""
    db = SessionLocal()
    try:
        send_morning_reminders(db)
        return "Morning reminders sent successfully"
    except Exception as e:
        return f"Error sending morning reminders: {str(e)}"
    finally:
        db.close()

@celery_app.task
def process_automatic_late_task():
    """Celery task for automatic late marking"""
    db = SessionLocal()
    try:
        process_automatic_late_marking(db)
        return "Automatic late marking processed successfully"
    except Exception as e:
        return f"Error processing automatic late marking: {str(e)}"
    finally:
        db.close()

@celery_app.task
def process_automatic_absent_task():
    """Celery task for automatic absent marking"""
    db = SessionLocal()
    try:
        process_automatic_absent_marking(db)
        return "Automatic absent marking processed successfully"
    except Exception as e:
        return f"Error processing automatic absent marking: {str(e)}"
    finally:
        db.close()

@celery_app.task
def process_day_closure_task():
    """Celery task for automatic day closure"""
    db = SessionLocal()
    try:
        process_automatic_day_closure(db)
        return "Day closure processed successfully"
    except Exception as e:
        return f"Error processing day closure: {str(e)}"
    finally:
        db.close()

@celery_app.task
def process_monthly_claims_task():
    """Celery task for monthly claims processing"""
    db = SessionLocal()
    try:
        process_monthly_claims(db)
        return "Monthly claims processed successfully"
    except Exception as e:
        return f"Error processing monthly claims: {str(e)}"
    finally:
        db.close()

# Manual task triggers for testing
@celery_app.task
def run_manual_automation(task_name: str, target_date: str = None):
    """Manually trigger automation tasks"""
    db = SessionLocal()
    try:
        if target_date:
            target_date = date.fromisoformat(target_date)
        else:
            target_date = date.today()
        
        if task_name == "permanent_absences":
            process_permanent_absences(db, target_date)
        elif task_name == "morning_reminders":
            send_morning_reminders(db, target_date)
        elif task_name == "automatic_late":
            process_automatic_late_marking(db, target_date)
        elif task_name == "automatic_absent":
            process_automatic_absent_marking(db, target_date)
        elif task_name == "day_closure":
            process_automatic_day_closure(db, target_date)
        elif task_name == "monthly_claims":
            year_month = f"{target_date.year}-{target_date.month:02d}"
            process_monthly_claims(db, year_month)
        else:
            return f"Unknown task: {task_name}"
        
        return f"Manual {task_name} completed successfully for {target_date}"
    except Exception as e:
        return f"Error running manual {task_name}: {str(e)}"
    finally:
        db.close()