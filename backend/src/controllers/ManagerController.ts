import { Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Attendance } from '../entities/Attendance';
import { Student } from '../entities/Student';
import { AttendanceService } from '../services/AttendanceService';

export class ManagerController {
  private attendanceRepo = AppDataSource.getRepository(Attendance);
  private studentRepo = AppDataSource.getRepository(Student);
  private attendanceService = new AttendanceService();

  async getDailyAttendance(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      
      const attendances = await this.attendanceRepo.find({
        where: { date: targetDate },
        relations: ['student'],
        order: { student: { last_name: 'ASC' } }
      });

      res.json(attendances);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  }

  async overrideAttendance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const attendance = await this.attendanceService.overrideAttendance(
        parseInt(id), 
        updates, 
        'manager'
      );
      
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: 'Override failed' });
    }
  }

  async getMonthlyStats(req: Request, res: Response) {
    try {
      const { studentId, yearMonth } = req.query;
      
      if (!studentId || !yearMonth) {
        return res.status(400).json({ error: 'Student ID and year-month required' });
      }

      const stats = await this.attendanceService.getMonthlyStats(
        parseInt(studentId as string),
        yearMonth as string
      );
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  async exportCSV(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      const attendances = await this.attendanceRepo
        .createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.student', 'student')
        .where('attendance.date >= :startDate', { startDate })
        .andWhere('attendance.date <= :endDate', { endDate })
        .orderBy('attendance.date', 'ASC')
        .addOrderBy('student.last_name', 'ASC')
        .getMany();

      const csv = this.generateCSV(attendances);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: 'Export failed' });
    }
  }

  private generateCSV(attendances: Attendance[]): string {
    const headers = ['תאריך', 'מספר תלמיד', 'שם', 'סטטוס', 'סטטוס משנה', 'כניסה', 'יציאה'];
    const rows = attendances.map(a => [
      a.date.toISOString().split('T')[0],
      a.student.student_number,
      `${a.student.first_name} ${a.student.last_name}`,
      a.status,
      a.sub_status,
      a.check_in_time || '',
      a.check_out_time || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}