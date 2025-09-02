from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json

from ..models import Student, Attendance, Claim
from .audit_service import AuditService

class WhatsAppService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_service = AuditService(db)
        # In production, this would be configured with Twilio or similar service
        self.enabled = os.getenv("WHATSAPP_ENABLED", "false").lower() == "true"
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_FROM_NUMBER")
    
    def send_reminder(self, student: Student, date) -> bool:
        """Send WhatsApp reminder to a student"""
        if not self.enabled or not student.phone_number:
            return False
        
        try:
            message = self._format_reminder_message(student, date)
            success = self._send_message(student.phone_number, message)
            
            if success:
                # Log the reminder
                self.audit_service.log_action(
                    actor="auto",
                    action="send_whatsapp_reminder",
                    entity="student",
                    entity_id=student.id,
                    after=json.dumps({
                        "phone_number": student.phone_number,
                        "message": message,
                        "date": date.isoformat()
                    })
                )
            
            return success
        except Exception as e:
            # Log the error
            self.audit_service.log_action(
                actor="auto",
                action="whatsapp_reminder_error",
                entity="student",
                entity_id=student.id,
                after=json.dumps({
                    "error": str(e),
                    "phone_number": student.phone_number,
                    "date": date.isoformat()
                })
            )
            return False
    
    def send_claim_notification(self, claim: Claim, recipients: List[str]) -> bool:
        """Send WhatsApp notification about a claim"""
        if not self.enabled:
            return False
        
        try:
            message = self._format_claim_message(claim)
            success_count = 0
            
            for recipient in recipients:
                if recipient == "student" and claim.student.phone_number:
                    success = self._send_message(claim.student.phone_number, message)
                    if success:
                        success_count += 1
                
                elif recipient == "manager":
                    # Send to all managers (would need manager phone numbers)
                    # For now, just log the attempt
                    self.audit_service.log_action(
                        actor="auto",
                        action="whatsapp_claim_notification",
                        entity="claim",
                        entity_id=claim.id,
                        after=json.dumps({
                            "recipient": "manager",
                            "message": message
                        })
                    )
                    success_count += 1
                
                elif recipient == "court_chair":
                    # Send to court chair (would need court chair phone number)
                    # For now, just log the attempt
                    self.audit_service.log_action(
                        actor="auto",
                        action="whatsapp_claim_notification",
                        entity="claim",
                        entity_id=claim.id,
                        after=json.dumps({
                            "recipient": "court_chair",
                            "message": message
                        })
                    )
                    success_count += 1
            
            return success_count > 0
        except Exception as e:
            # Log the error
            self.audit_service.log_action(
                actor="auto",
                action="whatsapp_claim_notification_error",
                entity="claim",
                entity_id=claim.id,
                after=json.dumps({
                    "error": str(e),
                    "recipients": recipients
                })
            )
            return False
    
    def send_bulk_reminders(self, students: List[Student], date) -> dict:
        """Send reminders to multiple students"""
        if not self.enabled:
            return {"sent": 0, "failed": 0, "total": len(students)}
        
        results = {"sent": 0, "failed": 0, "total": len(students)}
        
        for student in students:
            success = self.send_reminder(student, date)
            if success:
                results["sent"] += 1
            else:
                results["failed"] += 1
        
        return results
    
    def _format_reminder_message(self, student: Student, date) -> str:
        """Format reminder message for WhatsApp"""
        return f"""שלום {student.first_name} {student.last_name},

זה תזכורת לנוכחות בבית הספר לתאריך {date.strftime('%d/%m/%Y')}.

אנא דווח על נוכחותך דרך הטאבלט בכניסה לבית הספר.

תודה,
מערכת הנוכחות"""
    
    def _format_claim_message(self, claim: Claim) -> str:
        """Format claim notification message for WhatsApp"""
        student_name = f"{claim.student.first_name} {claim.student.last_name}"
        
        if claim.reason == "late_threshold":
            reason_text = "חריגה ממספר האיחורים המותר לחודש"
        elif claim.reason == "third_yom_lo_ba_li":
            reason_text = "חריגה ממספר הימים 'לא בא לי' המותר לחודש"
        else:
            reason_text = "סיבה אחרת"
        
        return f"""התראה: תביעה חדשה

תלמיד: {student_name}
סיבה: {reason_text}
תאריך פתיחה: {claim.date_opened.strftime('%d/%m/%Y')}

נדרשת התערבות מנהלית."""
    
    def _send_message(self, phone_number: str, message: str) -> bool:
        """Send WhatsApp message using Twilio"""
        if not self.enabled or not all([self.account_sid, self.auth_token, self.from_number]):
            # In development/testing, just log the message
            print(f"WHATSAPP MESSAGE TO {phone_number}: {message}")
            return True
        
        try:
            # In production, this would use Twilio client
            # from twilio.rest import Client
            # client = Client(self.account_sid, self.auth_token)
            # message = client.messages.create(
            #     body=message,
            #     from_=f"whatsapp:{self.from_number}",
            #     to=f"whatsapp:{phone_number}"
            # )
            # return message.sid is not None
            
            # For now, just simulate success
            return True
        except Exception as e:
            print(f"Error sending WhatsApp message: {e}")
            return False
    
    def get_service_status(self) -> dict:
        """Get WhatsApp service status"""
        return {
            "enabled": self.enabled,
            "configured": bool(all([self.account_sid, self.auth_token, self.from_number])),
            "account_sid": self.account_sid is not None,
            "auth_token": self.auth_token is not None,
            "from_number": self.from_number is not None
        }
