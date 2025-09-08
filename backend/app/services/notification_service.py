import requests
import os
from typing import Optional
from ..models.student import Student
from ..models.claim import ClaimReason

# WhatsApp API configuration (placeholder - would need actual WhatsApp Business API)
WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "https://api.whatsapp.com/send")
WHATSAPP_API_TOKEN = os.getenv("WHATSAPP_API_TOKEN", "")

def send_whatsapp_reminder(phone_number: Optional[str], student_name: str):
    """Send WhatsApp reminder to student"""
    if not phone_number:
        return False
    
    message = f"שלום {student_name}, אנא דווח על נוכחותך בבית הספר."
    
    # This is a placeholder implementation
    # In a real implementation, you would use WhatsApp Business API
    try:
        # Simulate API call
        print(f"Sending WhatsApp reminder to {phone_number}: {message}")
        return True
    except Exception as e:
        print(f"Failed to send WhatsApp reminder: {e}")
        return False

def send_claim_notification(student: Student, reason: ClaimReason, count: int, threshold: int):
    """Send claim notification to manager, student, and court chair"""
    
    if reason == ClaimReason.LATE_THRESHOLD:
        message = f"התראה: התלמיד {student.first_name} {student.last_name} חרג מסף האיחורים החודשי ({count}/{threshold})"
    elif reason == ClaimReason.THIRD_YOM_LO_BA_LI:
        message = f"התראה: התלמיד {student.first_name} {student.last_name} חרג מסף 'יום לא בא לי' החודשי ({count}/{threshold})"
    else:
        message = f"התראה: נפתחה תביעה נגד התלמיד {student.first_name} {student.last_name}"
    
    # Send to student
    if student.phone_number:
        send_whatsapp_message(student.phone_number, message)
    
    # Send to manager (would need manager contact info from settings)
    # send_whatsapp_message(manager_phone, message)
    
    # Send to court chair (would need court chair contact info from settings)
    # send_whatsapp_message(court_chair_phone, message)
    
    print(f"Claim notification sent: {message}")

def send_whatsapp_message(phone_number: str, message: str):
    """Send WhatsApp message"""
    try:
        # This is a placeholder implementation
        # In a real implementation, you would use WhatsApp Business API
        print(f"Sending WhatsApp to {phone_number}: {message}")
        return True
    except Exception as e:
        print(f"Failed to send WhatsApp message: {e}")
        return False