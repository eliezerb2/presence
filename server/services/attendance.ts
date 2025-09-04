import { storage } from "../storage";
import { format, parse } from "date-fns";
import { he } from "date-fns/locale";

export class AttendanceService {
  // Check-in a student
  async checkIn(studentId: string): Promise<void> {
    const today = format(new Date(), "yyyy-MM-dd");
    const currentTime = format(new Date(), "HH:mm");

    // Check if attendance record exists
    let attendanceRecord = await storage.getStudentAttendance(studentId, today);

    if (attendanceRecord) {
      // Update existing record
      await storage.updateAttendance(attendanceRecord.id, {
        status: "נוכח",
        subStatus: this.isLate() ? "איחור" : "ללא",
        reportedBy: "student",
        checkInTime: currentTime,
      });
    } else {
      // Create new record
      await storage.createAttendance({
        studentId,
        date: today,
        status: "נוכח",
        subStatus: this.isLate() ? "איחור" : "ללא",
        reportedBy: "student",
        checkInTime: currentTime,
      });
    }

    // Log the action
    await storage.createAuditLog({
      actor: "student",
      action: "check_in",
      entity: "attendance",
      entityId: studentId,
      after: JSON.stringify({ checkInTime: currentTime, status: "נוכח" }),
    });
  }

  // Check-out a student
  async checkOut(studentId: string): Promise<void> {
    const today = format(new Date(), "yyyy-MM-dd");
    const currentTime = format(new Date(), "HH:mm");

    let attendanceRecord = await storage.getStudentAttendance(studentId, today);

    if (attendanceRecord) {
      await storage.updateAttendance(attendanceRecord.id, {
        status: "יצא",
        checkOutTime: currentTime,
        reportedBy: "student",
        closedReason: "manual",
      });
    } else {
      // Create record with direct check-out
      await storage.createAttendance({
        studentId,
        date: today,
        status: "יצא",
        subStatus: "ללא",
        reportedBy: "student",
        checkOutTime: currentTime,
        closedReason: "manual",
      });
    }

    // Log the action
    await storage.createAuditLog({
      actor: "student",
      action: "check_out",
      entity: "attendance",
      entityId: studentId,
      after: JSON.stringify({ checkOutTime: currentTime, status: "יצא" }),
    });
  }

  // Override attendance record (manager action)
  async overrideAttendance(
    attendanceId: string,
    updates: {
      status?: string;
      subStatus?: string;
      checkInTime?: string;
      checkOutTime?: string;
      reportedBy?: string;
      closedReason?: string;
      overrideLocked?: boolean;
    }
  ): Promise<void> {
    const attendanceRecord = await storage.getTodayAttendance(format(new Date(), "yyyy-MM-dd"));
    const record = attendanceRecord.find(r => r.id === attendanceId);
    
    if (!record) {
      throw new Error("Attendance record not found");
    }

    const before = JSON.stringify(record);
    
    const updateData: any = { ...updates };
    if (updates.overrideLocked) {
      updateData.overrideLockedAt = new Date();
    }

    await storage.updateAttendance(attendanceId, updateData);
    
    // Log the override
    await storage.createAuditLog({
      actor: "manager",
      action: "override_update",
      entity: "attendance",
      entityId: attendanceId,
      before,
      after: JSON.stringify({ ...record, ...updates }),
    });
  }

  // Check if current time is considered late (after 10:00)
  private isLate(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    return currentHour > 10 || (currentHour === 10 && currentMinutes >= 0);
  }

  // Get Hebrew weekday for permanent absence checking
  getHebrewWeekday(date: Date): string {
    const weekdays = ["ה", "א", "ב", "ג", "ד", "ה", "א"];
    return weekdays[date.getDay()];
  }

  // Check if it's a school day
  async isSchoolDay(date: string): Promise<boolean> {
    const dateObj = parse(date, "yyyy-MM-dd", new Date());
    const dayOfWeek = dateObj.getDay();
    
    // Check if weekend (Friday=5, Saturday=6)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return false;
    }

    // Check if it's a school holiday
    const holiday = await storage.getSchoolHoliday(date);
    if (holiday) {
      return false;
    }

    // Check if it's past school year end
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    
    // High school ends June 20, elementary ends June 30
    if (month > 6 || (month === 6 && day > 30)) {
      return false;
    }

    return true;
  }

  // Create attendance records for permanent absences
  async processPermanentAbsences(date: string): Promise<void> {
    if (!(await this.isSchoolDay(date))) {
      return;
    }

    const dateObj = parse(date, "yyyy-MM-dd", new Date());
    const weekday = this.getHebrewWeekday(dateObj);

    const students = await storage.getStudents();
    
    for (const student of students) {
      if (student.activityStatus !== "פעיל") continue;

      const permanentAbsence = await storage.getStudentPermanentAbsence(student.id, weekday);
      
      if (permanentAbsence) {
        // Check if attendance record already exists
        const existingAttendance = await storage.getStudentAttendance(student.id, date);
        
        if (!existingAttendance) {
          await storage.createAttendance({
            studentId: student.id,
            date,
            status: "אישור היעדרות קבוע",
            subStatus: "ללא",
            reportedBy: "auto",
          });
        } else if (!existingAttendance.overrideLocked) {
          await storage.updateAttendance(existingAttendance.id, {
            status: "אישור היעדרות קבוע",
            subStatus: "ללא",
            reportedBy: "auto",
          });
        }
      }
    }
  }

  // Process automatic late marking (10:00-10:30)
  async processLateMarking(date: string): Promise<void> {
    if (!(await this.isSchoolDay(date))) {
      return;
    }

    const todayAttendance = await storage.getTodayAttendance(date);
    const currentTime = format(new Date(), "HH:mm");

    for (const record of todayAttendance) {
      if (record.status === "לא דיווח" && !record.overrideLocked && record.student.activityStatus === "פעיל") {
        await storage.updateAttendance(record.id, {
          status: "נוכח",
          subStatus: "איחור",
          reportedBy: "auto",
          checkInTime: currentTime,
        });
      }
    }
  }

  // Process automatic "יום לא בא לי" marking (after 10:30)
  async processYomLoBaLi(date: string): Promise<void> {
    if (!(await this.isSchoolDay(date))) {
      return;
    }

    const todayAttendance = await storage.getTodayAttendance(date);

    for (const record of todayAttendance) {
      if (record.status === "לא דיווח" && !record.overrideLocked && record.student.activityStatus === "פעיל") {
        await storage.updateAttendance(record.id, {
          status: "יום לא בא לי",
          subStatus: "ללא",
          reportedBy: "auto",
        });
      }
    }
  }

  // Process automatic day closure (16:00)
  async processDayClosure(date: string): Promise<void> {
    if (!(await this.isSchoolDay(date))) {
      return;
    }

    const todayAttendance = await storage.getTodayAttendance(date);

    for (const record of todayAttendance) {
      if (record.status === "נוכח" && !record.checkOutTime && !record.overrideLocked) {
        await storage.updateAttendance(record.id, {
          status: "יצא",
          subStatus: "נסגר אוטומטית",
          reportedBy: "auto",
          checkOutTime: "16:00",
          closedReason: "auto_16",
        });
      }
    }
  }

  // Export attendance data to CSV format
  async exportAttendanceCSV(date: string): Promise<string> {
    const attendanceData = await storage.getTodayAttendance(date);
    
    const headers = [
      "שם פרטי",
      "שם משפחה", 
      "כינוי",
      "מספר תלמיד",
      "רמת בית ספר",
      "סטטוס",
      "תת-סטטוס",
      "שעת כניסה",
      "שעת יציאה",
      "דיווח על ידי"
    ];

    const rows = attendanceData.map(record => [
      record.student.firstName,
      record.student.lastName,
      record.student.nickname,
      record.student.studentNumber,
      record.student.schoolLevel,
      record.status,
      record.subStatus,
      record.checkInTime || "",
      record.checkOutTime || "",
      record.reportedBy
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    return csvContent;
  }
}

export const attendanceService = new AttendanceService();
