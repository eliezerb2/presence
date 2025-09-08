from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from ..models.attendance import AttendanceStatus, SubStatus, ReportedBy, ClosedReason

class AttendanceBase(BaseModel):
    student_id: int
    date: date
    status: AttendanceStatus = AttendanceStatus.NOT_REPORTED
    sub_status: SubStatus = SubStatus.NONE
    reported_by: ReportedBy = ReportedBy.STUDENT
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    closed_reason: ClosedReason = ClosedReason.NA

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    sub_status: Optional[SubStatus] = None
    reported_by: Optional[ReportedBy] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    closed_reason: Optional[ClosedReason] = None
    override_locked: Optional[bool] = None

class AttendanceResponse(AttendanceBase):
    id: int
    override_locked: bool
    override_locked_at: Optional[datetime]
    
    class Config:
        from_attributes = True