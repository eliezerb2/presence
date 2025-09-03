import { AutomationService } from '../../services/AutomationService';
import { AppDataSource } from '../../database';

jest.mock('../../database');

describe('AutomationService', () => {
  let service: AutomationService;
  let mockAttendanceRepo: any;
  let mockHolidayRepo: any;

  beforeEach(() => {
    mockAttendanceRepo = {
      find: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    };
    mockHolidayRepo = {
      findOne: jest.fn(),
    };
    
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity.name === 'Attendance') return mockAttendanceRepo;
      if (entity.name === 'SchoolHoliday') return mockHolidayRepo;
      return {};
    });
    service = new AutomationService();
  });

  describe('isSchoolDay', () => {
    it('should return false for Friday', async () => {
      const friday = new Date('2024-01-05'); // Friday
      const result = await service.isSchoolDay(friday);
      expect(result).toBe(false);
    });

    it('should return false for Saturday', async () => {
      const saturday = new Date('2024-01-06'); // Saturday
      const result = await service.isSchoolDay(saturday);
      expect(result).toBe(false);
    });

    it('should return false for holidays', async () => {
      const date = new Date('2024-01-02'); // Tuesday
      mockHolidayRepo.findOne.mockResolvedValue({ date });
      
      const result = await service.isSchoolDay(date);
      expect(result).toBe(false);
    });

    it('should return true for regular school days', async () => {
      const monday = new Date('2024-01-08'); // Monday
      mockHolidayRepo.findOne.mockResolvedValue(null);
      
      const result = await service.isSchoolDay(monday);
      expect(result).toBe(true);
    });
  });

  describe('processLateArrivals', () => {
    it('should mark unreported students as late', async () => {
      const unreportedAttendances = [
        { id: 1, status: 'לא דיווח', override_locked: false },
        { id: 2, status: 'לא דיווח', override_locked: false }
      ];
      
      mockAttendanceRepo.find.mockResolvedValue(unreportedAttendances);
      mockHolidayRepo.findOne.mockResolvedValue(null);
      
      // Mock current time to be 10:15 AM on a school day
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(15);
      jest.spyOn(service, 'isSchoolDay').mockResolvedValue(true);

      await service.processLateArrivals();

      expect(mockAttendanceRepo.save).toHaveBeenCalledTimes(2);
      expect(mockAttendanceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'נוכח',
          sub_status: 'איחור',
          reported_by: 'auto'
        })
      );
    });
  });
});