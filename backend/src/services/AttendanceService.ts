import { AppDataSource } from '../database';
import { Attendance } from '../entities/Attendance';
import { Student } from '../entities/Student';
import { PermanentAbsence } from '../entities/PermanentAbsence';
import { AuditLog } from '../entities/AuditLog';

export class AttendanceService {
  private attendanceRepo = AppDataSource.getRepository(Attendance);
  private studentRepo = AppDataSource.getRepository(Student);
  private permanentAbsenceRepo = AppDataSource.getRepository(PermanentAbsence);
  private auditRepo = AppDataSource.getRepository(AuditLog);

  async checkIn(studentId: number): Promise<Attendance> {
    const today = new Date().toISOString().split('T')[0];
    
    let attendance = await this.attendanceRepo.findOne({
      where: { student_id: studentId, date: new Date(today) }
    });

    if (!attendance) {
      attendance = this.attendanceRepo.create({
        student_id: studentId,
        date: new Date(today),
        status: 'נוכח',
        sub_status: 'ללא',
        reported_by: 'student',
        check_in_time: new Date().toTimeString().split(' ')[0]
      });
    } else if (!attendance.override_locked) {
      attendance.status = 'נוכח';
      attendance.check_in_time = new Date().toTimeString().split(' ')[0];
      attendance.reported_by = 'student';
    }

    return await this.attendanceRepo.save(attendance);
  }

  async checkOut(studentId: number): Promise<Attendance> {
    const today = new Date().toISOString().split('T')[0];
    
    let attendance = await this.attendanceRepo.findOne({
      where: { student_id: studentId, date: new Date(today) }
    });

    if (!attendance) {
      attendance = this.attendanceRepo.create({
        student_id: studentId,
        date: new Date(today),
        status: 'יצא',
        sub_status: 'ללא',
        reported_by: 'student',
        check_out_time: new Date().toTimeString().split(' ')[0]
      });
    } else if (!attendance.override_locked) {
      attendance.status = 'יצא';
      attendance.check_out_time = new Date().toTimeString().split(' ')[0];
      attendance.reported_by = 'student';
      attendance.closed_reason = 'manual';
    }

    return await this.attendanceRepo.save(attendance);
  }

  async getTodayAttendance(): Promise<Attendance[]> {
    const today = new Date().toISOString().split('T')[0];
    return await this.attendanceRepo.find({
      where: { date: new Date(today) },
      relations: ['student']
    });
  }

  async overrideAttendance(id: number, updates: Partial<Attendance>, actor: string): Promise<Attendance> {
    const attendance = await this.attendanceRepo.findOne({ where: { id } });
    if (!attendance) throw new Error('Attendance record not found');

    const before = { ...attendance };
    
    Object.assign(attendance, updates);
    attendance.override_locked = true;
    attendance.override_locked_at = new Date();

    const saved = await this.attendanceRepo.save(attendance);

    await this.auditRepo.save({
      actor: actor as any,
      action: 'override_update',
      entity: 'attendance',
      entity_id: id,
      before,
      after: saved
    });

    return saved;
  }

  async getMonthlyStats(studentId: number, yearMonth: string) {
    const [year, month] = yearMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const attendances = await this.attendanceRepo.find({
      where: {
        student_id: studentId,
        date: AppDataSource.createQueryBuilder()
          .select()
          .where('date >= :start AND date <= :end', { start: startDate, end: endDate })
          .getQuery() as any
      }
    });

    const lateCount = attendances.filter(a => a.sub_status === 'איחור').length;
    const yomLoBaLiCount = attendances.filter(a => a.status === 'יום לא בא לי').length;

    return { lateCount, yomLoBaLiCount };
  }
}