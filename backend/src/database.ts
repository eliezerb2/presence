import { DataSource } from 'typeorm';
import { Student } from './entities/Student';
import { Attendance } from './entities/Attendance';
import { PermanentAbsence } from './entities/PermanentAbsence';
import { SchoolHoliday } from './entities/SchoolHoliday';
import { Settings } from './entities/Settings';
import { StudentMonthlyOverride } from './entities/StudentMonthlyOverride';
import { Claim } from './entities/Claim';
import { AuditLog } from './entities/AuditLog';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'presence',
  synchronize: true,
  logging: false,
  entities: [
    Student,
    Attendance,
    PermanentAbsence,
    SchoolHoliday,
    Settings,
    StudentMonthlyOverride,
    Claim,
    AuditLog
  ],
  migrations: [],
  subscribers: [],
});