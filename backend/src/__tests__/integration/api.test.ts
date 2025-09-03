import request from 'supertest';
import express from 'express';
import routes from '../../routes';
import { AppDataSource } from '../../database';

const app = express();
app.use(express.json());
app.use('/api', routes);

jest.mock('../../database');

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Mock database initialization
    (AppDataSource.initialize as jest.Mock).mockResolvedValue(true);
  });

  describe('Kiosk API', () => {
    it('should search students', async () => {
      const mockRepo = {
        createQueryBuilder: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([
            { id: 1, first_name: 'יוסי', last_name: 'כהן', nickname: 'יוסי123' }
          ])
        }))
      };
      
      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const response = await request(app)
        .get('/api/kiosk/search?query=יוסי')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].first_name).toBe('יוסי');
    });

    it('should handle check-in', async () => {
      const mockAttendanceRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue({ student_id: 1 }),
        save: jest.fn().mockResolvedValue({ id: 1, student_id: 1, status: 'נוכח' })
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockAttendanceRepo);

      const response = await request(app)
        .post('/api/kiosk/checkin/1')
        .expect(200);

      expect(response.body.status).toBe('נוכח');
    });
  });

  describe('Manager API', () => {
    it('should get daily attendance', async () => {
      const mockRepo = {
        find: jest.fn().mockResolvedValue([
          { id: 1, student_id: 1, status: 'נוכח', student: { first_name: 'יוסי' } }
        ])
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const response = await request(app)
        .get('/api/manager/attendance')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('נוכח');
    });

    it('should override attendance', async () => {
      const mockAttendanceRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 1, status: 'לא דיווח' }),
        save: jest.fn().mockResolvedValue({ id: 1, status: 'נוכח', override_locked: true })
      };
      
      const mockAuditRepo = {
        save: jest.fn()
      };

      (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity.name === 'Attendance') return mockAttendanceRepo;
        if (entity.name === 'AuditLog') return mockAuditRepo;
        return {};
      });

      const response = await request(app)
        .put('/api/manager/attendance/1')
        .send({ status: 'נוכח' })
        .expect(200);

      expect(response.body.status).toBe('נוכח');
      expect(response.body.override_locked).toBe(true);
    });
  });
});