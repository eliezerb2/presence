import { Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Student } from '../entities/Student';
import { AttendanceService } from '../services/AttendanceService';

export class KioskController {
  private studentRepo = AppDataSource.getRepository(Student);
  private attendanceService = new AttendanceService();

  async searchStudents(req: Request, res: Response) {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
      }

      const students = await this.studentRepo
        .createQueryBuilder('student')
        .where('student.activity_status = :status', { status: 'פעיל' })
        .andWhere(
          '(student.student_number ILIKE :query OR ' +
          'student.nickname ILIKE :query OR ' +
          'student.first_name ILIKE :query OR ' +
          'student.last_name ILIKE :query)',
          { query: `%${query}%` }
        )
        .limit(10)
        .getMany();

      res.json(students);
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  }

  async checkIn(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const attendance = await this.attendanceService.checkIn(parseInt(studentId));
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: 'Check-in failed' });
    }
  }

  async checkOut(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const attendance = await this.attendanceService.checkOut(parseInt(studentId));
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: 'Check-out failed' });
    }
  }
}