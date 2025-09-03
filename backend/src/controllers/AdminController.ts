import { Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Student } from '../entities/Student';
import { PermanentAbsence } from '../entities/PermanentAbsence';
import { SchoolHoliday } from '../entities/SchoolHoliday';
import { Settings } from '../entities/Settings';
import { StudentMonthlyOverride } from '../entities/StudentMonthlyOverride';

export class AdminController {
  private studentRepo = AppDataSource.getRepository(Student);
  private permanentAbsenceRepo = AppDataSource.getRepository(PermanentAbsence);
  private holidayRepo = AppDataSource.getRepository(SchoolHoliday);
  private settingsRepo = AppDataSource.getRepository(Settings);
  private overrideRepo = AppDataSource.getRepository(StudentMonthlyOverride);

  // Students CRUD
  async getStudents(req: Request, res: Response) {
    try {
      const students = await this.studentRepo.find({ order: { last_name: 'ASC' } });
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  }

  async createStudent(req: Request, res: Response) {
    try {
      const student = this.studentRepo.create(req.body);
      const saved = await this.studentRepo.save(student);
      res.status(201).json(saved);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create student' });
    }
  }

  async updateStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.studentRepo.update(id, req.body);
      const updated = await this.studentRepo.findOne({ where: { id: parseInt(id) } });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update student' });
    }
  }

  async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.studentRepo.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete student' });
    }
  }

  // Permanent Absences CRUD
  async getPermanentAbsences(req: Request, res: Response) {
    try {
      const absences = await this.permanentAbsenceRepo.find({ relations: ['student'] });
      res.json(absences);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch permanent absences' });
    }
  }

  async createPermanentAbsence(req: Request, res: Response) {
    try {
      const absence = this.permanentAbsenceRepo.create(req.body);
      const saved = await this.permanentAbsenceRepo.save(absence);
      res.status(201).json(saved);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create permanent absence' });
    }
  }

  async deletePermanentAbsence(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.permanentAbsenceRepo.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete permanent absence' });
    }
  }

  // School Holidays CRUD
  async getHolidays(req: Request, res: Response) {
    try {
      const holidays = await this.holidayRepo.find({ order: { date: 'ASC' } });
      res.json(holidays);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch holidays' });
    }
  }

  async createHoliday(req: Request, res: Response) {
    try {
      const holiday = this.holidayRepo.create(req.body);
      const saved = await this.holidayRepo.save(holiday);
      res.status(201).json(saved);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create holiday' });
    }
  }

  async deleteHoliday(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.holidayRepo.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete holiday' });
    }
  }

  // Settings
  async getSettings(req: Request, res: Response) {
    try {
      let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
      if (!settings) {
        settings = this.settingsRepo.create({
          lateness_threshold_per_month_default: 3,
          max_yom_lo_ba_li_per_month_default: 2,
          court_chair_name: '',
          court_chair_phone: ''
        });
        settings = await this.settingsRepo.save(settings);
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      await this.settingsRepo.update(1, req.body);
      const updated = await this.settingsRepo.findOne({ where: { id: 1 } });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  // Monthly Overrides CRUD
  async getMonthlyOverrides(req: Request, res: Response) {
    try {
      const overrides = await this.overrideRepo.find({ relations: ['student'] });
      res.json(overrides);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch overrides' });
    }
  }

  async createMonthlyOverride(req: Request, res: Response) {
    try {
      const override = this.overrideRepo.create(req.body);
      const saved = await this.overrideRepo.save(override);
      res.status(201).json(saved);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create override' });
    }
  }

  async deleteMonthlyOverride(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.overrideRepo.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete override' });
    }
  }
}