import { attendanceService } from "./attendance";
import { storage } from "../storage";
import { format } from "date-fns";

export class SchedulerService {
  private intervalIds: NodeJS.Timeout[] = [];

  start() {
    console.log("Starting attendance scheduler...");
    
    // Process permanent absences at 6:00 AM
    this.scheduleDaily("06:00", () => this.processPermanentAbsences());
    
    // Process late marking between 10:00-10:30
    this.scheduleDaily("10:15", () => this.processLateMarking());
    
    // Process "יום לא בא לי" at 10:30
    this.scheduleDaily("10:30", () => this.processYomLoBaLi());
    
    // Process day closure at 16:00
    this.scheduleDaily("16:00", () => this.processDayClosure());
    
    // Check monthly thresholds daily at 17:00
    this.scheduleDaily("17:00", () => this.checkMonthlyThresholds());
  }

  stop() {
    this.intervalIds.forEach(clearInterval);
    this.intervalIds = [];
  }

  private scheduleDaily(time: string, callback: () => void) {
    const [hours, minutes] = time.split(":").map(Number);
    
    const schedule = () => {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // If the time has passed today, schedule for tomorrow
      if (now >= scheduledTime) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const delay = scheduledTime.getTime() - now.getTime();
      
      setTimeout(() => {
        callback();
        // Schedule for next day
        this.intervalIds.push(setInterval(callback, 24 * 60 * 60 * 1000));
      }, delay);
    };

    schedule();
  }

  private async processPermanentAbsences() {
    const today = format(new Date(), "yyyy-MM-dd");
    console.log(`Processing permanent absences for ${today}`);
    await attendanceService.processPermanentAbsences(today);
  }

  private async processLateMarking() {
    const today = format(new Date(), "yyyy-MM-dd");
    console.log(`Processing late marking for ${today}`);
    await attendanceService.processLateMarking(today);
  }

  private async processYomLoBaLi() {
    const today = format(new Date(), "yyyy-MM-dd");
    console.log(`Processing 'יום לא בא לי' marking for ${today}`);
    await attendanceService.processYomLoBaLi(today);
  }

  private async processDayClosure() {
    const today = format(new Date(), "yyyy-MM-dd");
    console.log(`Processing day closure for ${today}`);
    await attendanceService.processDayClosure(today);
  }

  private async checkMonthlyThresholds() {
    const today = new Date();
    const yearMonth = format(today, "yyyy-MM");
    
    console.log(`Checking monthly thresholds for ${yearMonth}`);
    
    const students = await storage.getStudents();
    const settings = await storage.getSettings();
    
    if (!settings) {
      console.warn("No settings found, skipping threshold check");
      return;
    }

    for (const student of students) {
      if (student.activityStatus !== "פעיל") continue;

      const stats = await storage.getMonthlyAttendanceStats(student.id, yearMonth);
      const override = await storage.getStudentMonthlyOverride(student.id, yearMonth);
      
      const latenessThreshold = override?.latenessThresholdOverride ?? settings.latenessThresholdPerMonthDefault;
      const yomLoBaLiThreshold = override?.maxYomLoBaLiOverride ?? settings.maxYomLoBaLiPerMonthDefault;

      // Check for late threshold breach
      if (stats.lateCount > latenessThreshold) {
        await this.createClaimIfNotExists(student.id, "late_threshold");
      }

      // Check for "יום לא בא לי" threshold breach
      if (stats.yomLoBaLiCount >= yomLoBaLiThreshold) {
        await this.createClaimIfNotExists(student.id, "third_yom_lo_ba_li");
      }
    }
  }

  private async createClaimIfNotExists(studentId: string, reason: "late_threshold" | "third_yom_lo_ba_li") {
    const today = format(new Date(), "yyyy-MM-dd");
    const existingClaims = await storage.getClaims();
    
    // Check if there's already an open claim for this student and reason this month
    const thisMonth = format(new Date(), "yyyy-MM");
    const existingClaim = existingClaims.find(
      claim => 
        claim.studentId === studentId && 
        claim.reason === reason && 
        claim.status === "open" &&
        claim.dateOpened?.startsWith(thisMonth)
    );

    if (!existingClaim) {
      await storage.createClaim({
        studentId,
        dateOpened: today,
        reason,
        notifiedTo: ["manager", "student", "court_chair"],
        status: "open",
      });

      console.log(`Created claim for student ${studentId}: ${reason}`);
    }
  }
}

export const schedulerService = new SchedulerService();
