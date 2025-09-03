import { AppDataSource } from '../database';
import { Attendance } from '../entities/Attendance';
import { Student } from '../entities/Student';
import { PermanentAbsence } from '../entities/PermanentAbsence';
import { SchoolHoliday } from '../entities/SchoolHoliday';
import { Settings } from '../entities/Settings';
import { StudentMonthlyOverride } from '../entities/StudentMonthlyOverride';
import { Claim } from '../entities/Claim';

export class AutomationService {
  private attendanceRepo = AppDataSource.getRepository(Attendance);
  private studentRepo = AppDataSource.getRepository(Student);
  private permanentAbsenceRepo = AppDataSource.getRepository(PermanentAbsence);
  private holidayRepo = AppDataSource.getRepository(SchoolHoliday);
  private settingsRepo = AppDataSource.getRepository(Settings);
  private overrideRepo = AppDataSource.getRepository(StudentMonthlyOverride);
  private claimRepo = AppDataSource.getRepository(Claim);

  async isSchoolDay(date: Date): Promise<boolean> {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) return false; // Friday/Saturday

    const holiday = await this.holidayRepo.findOne({ where: { date } });
    if (holiday) return false;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Elementary ends 30/06, High school ends 20/06
    if (month > 6 || (month === 6 && day > 30)) return false;

    return true;
  }

  async processPermanentAbsences(): Promise<void> {
    const today = new Date();
    if (!(await this.isSchoolDay(today))) return;

    const weekdays = ['א', 'ב', 'ג', 'ד', 'ה'];
    const todayWeekday = weekdays[today.getDay() - 1];

    const permanentAbsences = await this.permanentAbsenceRepo.find({
      where: { weekday: todayWeekday as any },
      relations: ['student']
    });

    for (const absence of permanentAbsences) {
      const existing = await this.attendanceRepo.findOne({
        where: { student_id: absence.student_id, date: today }
      });

      if (!existing) {
        await this.attendanceRepo.save({
          student_id: absence.student_id,
          date: today,
          status: 'אישור היעדרות קבוע',
          sub_status: 'ללא',
          reported_by: 'auto'
        });
      }
    }
  }

  async processLateArrivals(): Promise<void> {
    const today = new Date();
    if (!(await this.isSchoolDay(today))) return;

    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    if (currentHour === 10 && currentMinute >= 0 && currentMinute <= 30) {
      const unreportedAttendances = await this.attendanceRepo.find({
        where: { date: today, status: 'לא דיווח', override_locked: false }
      });

      for (const attendance of unreportedAttendances) {
        attendance.status = 'נוכח';
        attendance.sub_status = 'איחור';
        attendance.reported_by = 'auto';
        attendance.check_in_time = new Date().toTimeString().split(' ')[0];
        await this.attendanceRepo.save(attendance);
      }
    }
  }

  async processYomLoBaLi(): Promise<void> {
    const today = new Date();
    if (!(await this.isSchoolDay(today))) return;

    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    if (currentHour === 10 && currentMinute === 30) {
      const unreportedAttendances = await this.attendanceRepo.find({
        where: { date: today, status: 'לא דיווח', override_locked: false }
      });

      for (const attendance of unreportedAttendances) {
        attendance.status = 'יום לא בא לי';
        attendance.sub_status = 'ללא';
        attendance.reported_by = 'auto';
        await this.attendanceRepo.save(attendance);
      }
    }
  }

  async processEndOfDay(): Promise<void> {
    const today = new Date();
    if (!(await this.isSchoolDay(today))) return;

    const currentHour = today.getHours();
    if (currentHour === 16) {
      const openAttendances = await this.attendanceRepo
        .createQueryBuilder('attendance')
        .where('attendance.date = :date', { date: today })
        .andWhere('attendance.status = :status', { status: 'נוכח' })
        .andWhere('attendance.check_out_time IS NULL')
        .andWhere('attendance.override_locked = :locked', { locked: false })
        .getMany();

      for (const attendance of openAttendances) {
        attendance.status = 'יצא';
        attendance.sub_status = 'נסגר אוטומטית';
        attendance.reported_by = 'auto';
        attendance.check_out_time = '16:00:00';
        attendance.closed_reason = 'auto_16';
        await this.attendanceRepo.save(attendance);
      }
    }
  }

  async processMonthlyChecks(): Promise<void> {
    const today = new Date();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings) return;

    const students = await this.studentRepo.find({ where: { activity_status: 'פעיל' } });

    for (const student of students) {
      const override = await this.overrideRepo.findOne({
        where: { student_id: student.id, year_month: yearMonth }
      });

      const lateThreshold = override?.lateness_threshold_override ?? settings.lateness_threshold_per_month_default;
      const yomLoBaLiThreshold = override?.max_yom_lo_ba_li_override ?? settings.max_yom_lo_ba_li_per_month_default;

      const stats = await this.getMonthlyStats(student.id, yearMonth);

      if (stats.lateCount > lateThreshold) {
        await this.createClaim(student.id, 'late_threshold');
      }

      if (stats.yomLoBaLiCount >= yomLoBaLiThreshold) {
        await this.createClaim(student.id, 'third_yom_lo_ba_li');
      }
    }
  }

  private async getMonthlyStats(studentId: number, yearMonth: string) {
    const [year, month] = yearMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const attendances = await this.attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.student_id = :studentId', { studentId })
      .andWhere('attendance.date >= :startDate', { startDate })
      .andWhere('attendance.date <= :endDate', { endDate })
      .getMany();

    const lateCount = attendances.filter(a => a.sub_status === 'איחור').length;
    const yomLoBaLiCount = attendances.filter(a => a.status === 'יום לא בא לי').length;

    return { lateCount, yomLoBaLiCount };
  }

  private async createClaim(studentId: number, reason: 'late_threshold' | 'third_yom_lo_ba_li'): Promise<void> {
    const existingClaim = await this.claimRepo.findOne({
      where: { student_id: studentId, reason, status: 'open' }
    });

    if (!existingClaim) {
      await this.claimRepo.save({
        student_id: studentId,
        date_opened: new Date(),
        reason,
        notified_to: ['manager', 'student', 'court_chair'],
        status: 'open'
      });
    }
  }
}