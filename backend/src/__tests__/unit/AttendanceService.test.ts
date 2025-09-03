import { AttendanceService } from '../../services/AttendanceService';
import { AppDataSource } from '../../database';

jest.mock('../../database');

describe('AttendanceService', () => {
  let service: AttendanceService;
  let mockRepo: any;

  beforeEach(() => {
    service = new AttendanceService();
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
  });

  describe('checkIn', () => {
    it('should create new attendance record for check-in', async () => {
      const studentId = 1;
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ student_id: studentId });
      mockRepo.save.mockResolvedValue({ id: 1, student_id: studentId });

      const result = await service.checkIn(studentId);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: studentId,
          status: 'נוכח',
          reported_by: 'student'
        })
      );
      expect(result.student_id).toBe(studentId);
    });

    it('should update existing attendance record for check-in', async () => {
      const studentId = 1;
      const existingAttendance = {
        id: 1,
        student_id: studentId,
        status: 'לא דיווח',
        override_locked: false
      };
      
      mockRepo.findOne.mockResolvedValue(existingAttendance);
      mockRepo.save.mockResolvedValue({ ...existingAttendance, status: 'נוכח' });

      const result = await service.checkIn(studentId);

      expect(result.status).toBe('נוכח');
    });
  });

  describe('checkOut', () => {
    it('should create new attendance record for check-out', async () => {
      const studentId = 1;
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ student_id: studentId });
      mockRepo.save.mockResolvedValue({ id: 1, student_id: studentId });

      const result = await service.checkOut(studentId);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: studentId,
          status: 'יצא',
          reported_by: 'student'
        })
      );
    });
  });
});