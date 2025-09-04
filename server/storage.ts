import { 
  students, 
  attendance,
  permanentAbsences,
  schoolHolidays,
  settings,
  studentMonthlyOverrides,
  claims,
  auditLog,
  users,
  type Student, 
  type InsertStudent,
  type Attendance,
  type InsertAttendance,
  type PermanentAbsence,
  type InsertPermanentAbsence,
  type SchoolHoliday,
  type InsertSchoolHoliday,
  type Settings,
  type InsertSettings,
  type StudentMonthlyOverride,
  type InsertStudentMonthlyOverride,
  type Claim,
  type InsertClaim,
  type AuditLog,
  type InsertAuditLog,
  type User,
  type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, asc, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // Legacy user methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Student methods
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByNumber(studentNumber: string): Promise<Student | undefined>;
  searchStudents(query: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;

  // Attendance methods
  getTodayAttendance(date: string): Promise<(Attendance & { student: Student })[]>;
  getStudentAttendance(studentId: string, date: string): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance>;
  getMonthlyAttendanceStats(studentId: string, yearMonth: string): Promise<{ lateCount: number; yomLoBaLiCount: number }>;

  // Permanent absence methods
  getPermanentAbsences(): Promise<(PermanentAbsence & { student: Student })[]>;
  getStudentPermanentAbsence(studentId: string, weekday: string): Promise<PermanentAbsence | undefined>;
  createPermanentAbsence(absence: InsertPermanentAbsence): Promise<PermanentAbsence>;
  updatePermanentAbsence(id: string, absence: Partial<InsertPermanentAbsence>): Promise<PermanentAbsence>;
  deletePermanentAbsence(id: string): Promise<void>;

  // Holiday methods
  getSchoolHolidays(): Promise<SchoolHoliday[]>;
  getSchoolHoliday(date: string): Promise<SchoolHoliday | undefined>;
  createSchoolHoliday(holiday: InsertSchoolHoliday): Promise<SchoolHoliday>;
  updateSchoolHoliday(id: string, holiday: Partial<InsertSchoolHoliday>): Promise<SchoolHoliday>;
  deleteSchoolHoliday(id: string): Promise<void>;

  // Settings methods
  getSettings(): Promise<Settings | undefined>;
  createOrUpdateSettings(settings: InsertSettings): Promise<Settings>;

  // Student monthly override methods
  getStudentMonthlyOverride(studentId: string, yearMonth: string): Promise<StudentMonthlyOverride | undefined>;
  createStudentMonthlyOverride(override: InsertStudentMonthlyOverride): Promise<StudentMonthlyOverride>;
  updateStudentMonthlyOverride(id: string, override: Partial<InsertStudentMonthlyOverride>): Promise<StudentMonthlyOverride>;
  deleteStudentMonthlyOverride(id: string): Promise<void>;

  // Claims methods
  getClaims(): Promise<(Claim & { student: Student })[]>;
  getOpenClaims(): Promise<(Claim & { student: Student })[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: string, claim: Partial<InsertClaim>): Promise<Claim>;

  // Audit log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Legacy user methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(asc(students.firstName), asc(students.lastName));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByNumber(studentNumber: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentNumber, studentNumber));
    return student || undefined;
  }

  async searchStudents(query: string): Promise<Student[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(students)
      .where(
        or(
          like(students.studentNumber, searchPattern),
          like(students.nickname, searchPattern),
          like(students.firstName, searchPattern),
          like(students.lastName, searchPattern)
        )
      )
      .orderBy(asc(students.firstName), asc(students.lastName));
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Attendance methods
  async getTodayAttendance(date: string): Promise<(Attendance & { student: Student })[]> {
    return await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status,
        subStatus: attendance.subStatus,
        reportedBy: attendance.reportedBy,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        closedReason: attendance.closedReason,
        overrideLocked: attendance.overrideLocked,
        overrideLockedAt: attendance.overrideLockedAt,
        student: students,
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .where(eq(attendance.date, date))
      .orderBy(asc(students.firstName), asc(students.lastName));
  }

  async getStudentAttendance(studentId: string, date: string): Promise<Attendance | undefined> {
    const [record] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.studentId, studentId), eq(attendance.date, date)));
    return record || undefined;
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(attendanceData).returning();
    return record;
  }

  async updateAttendance(id: string, attendanceData: Partial<InsertAttendance>): Promise<Attendance> {
    const [record] = await db
      .update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return record;
  }

  async getMonthlyAttendanceStats(studentId: string, yearMonth: string): Promise<{ lateCount: number; yomLoBaLiCount: number }> {
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-31`;

    const [lateCountResult] = await db
      .select({ count: count() })
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate),
          eq(attendance.subStatus, "איחור")
        )
      );

    const [yomLoBaLiCountResult] = await db
      .select({ count: count() })
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate),
          eq(attendance.status, "יום לא בא לי")
        )
      );

    return {
      lateCount: lateCountResult?.count || 0,
      yomLoBaLiCount: yomLoBaLiCountResult?.count || 0,
    };
  }

  // Permanent absence methods
  async getPermanentAbsences(): Promise<(PermanentAbsence & { student: Student })[]> {
    return await db
      .select({
        id: permanentAbsences.id,
        studentId: permanentAbsences.studentId,
        weekday: permanentAbsences.weekday,
        reason: permanentAbsences.reason,
        student: students,
      })
      .from(permanentAbsences)
      .innerJoin(students, eq(permanentAbsences.studentId, students.id))
      .orderBy(asc(students.firstName), asc(students.lastName));
  }

  async getStudentPermanentAbsence(studentId: string, weekday: string): Promise<PermanentAbsence | undefined> {
    const [absence] = await db
      .select()
      .from(permanentAbsences)
      .where(and(eq(permanentAbsences.studentId, studentId), eq(permanentAbsences.weekday, weekday as any)));
    return absence || undefined;
  }

  async createPermanentAbsence(absence: InsertPermanentAbsence): Promise<PermanentAbsence> {
    const [newAbsence] = await db.insert(permanentAbsences).values(absence).returning();
    return newAbsence;
  }

  async updatePermanentAbsence(id: string, absence: Partial<InsertPermanentAbsence>): Promise<PermanentAbsence> {
    const [updatedAbsence] = await db
      .update(permanentAbsences)
      .set(absence)
      .where(eq(permanentAbsences.id, id))
      .returning();
    return updatedAbsence;
  }

  async deletePermanentAbsence(id: string): Promise<void> {
    await db.delete(permanentAbsences).where(eq(permanentAbsences.id, id));
  }

  // Holiday methods
  async getSchoolHolidays(): Promise<SchoolHoliday[]> {
    return await db.select().from(schoolHolidays).orderBy(asc(schoolHolidays.date));
  }

  async getSchoolHoliday(date: string): Promise<SchoolHoliday | undefined> {
    const [holiday] = await db.select().from(schoolHolidays).where(eq(schoolHolidays.date, date));
    return holiday || undefined;
  }

  async createSchoolHoliday(holiday: InsertSchoolHoliday): Promise<SchoolHoliday> {
    const [newHoliday] = await db.insert(schoolHolidays).values(holiday).returning();
    return newHoliday;
  }

  async updateSchoolHoliday(id: string, holiday: Partial<InsertSchoolHoliday>): Promise<SchoolHoliday> {
    const [updatedHoliday] = await db
      .update(schoolHolidays)
      .set(holiday)
      .where(eq(schoolHolidays.id, id))
      .returning();
    return updatedHoliday;
  }

  async deleteSchoolHoliday(id: string): Promise<void> {
    await db.delete(schoolHolidays).where(eq(schoolHolidays.id, id));
  }

  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).limit(1);
    return setting || undefined;
  }

  async createOrUpdateSettings(settingsData: InsertSettings): Promise<Settings> {
    const existingSettings = await this.getSettings();
    
    if (existingSettings) {
      const [updated] = await db
        .update(settings)
        .set(settingsData)
        .where(eq(settings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values(settingsData).returning();
      return created;
    }
  }

  // Student monthly override methods
  async getStudentMonthlyOverride(studentId: string, yearMonth: string): Promise<StudentMonthlyOverride | undefined> {
    const [override] = await db
      .select()
      .from(studentMonthlyOverrides)
      .where(and(eq(studentMonthlyOverrides.studentId, studentId), eq(studentMonthlyOverrides.yearMonth, yearMonth)));
    return override || undefined;
  }

  async createStudentMonthlyOverride(override: InsertStudentMonthlyOverride): Promise<StudentMonthlyOverride> {
    const [newOverride] = await db.insert(studentMonthlyOverrides).values(override).returning();
    return newOverride;
  }

  async updateStudentMonthlyOverride(id: string, override: Partial<InsertStudentMonthlyOverride>): Promise<StudentMonthlyOverride> {
    const [updatedOverride] = await db
      .update(studentMonthlyOverrides)
      .set(override)
      .where(eq(studentMonthlyOverrides.id, id))
      .returning();
    return updatedOverride;
  }

  async deleteStudentMonthlyOverride(id: string): Promise<void> {
    await db.delete(studentMonthlyOverrides).where(eq(studentMonthlyOverrides.id, id));
  }

  // Claims methods
  async getClaims(): Promise<(Claim & { student: Student })[]> {
    return await db
      .select({
        id: claims.id,
        studentId: claims.studentId,
        dateOpened: claims.dateOpened,
        reason: claims.reason,
        notifiedTo: claims.notifiedTo,
        status: claims.status,
        student: students,
      })
      .from(claims)
      .innerJoin(students, eq(claims.studentId, students.id))
      .orderBy(desc(claims.dateOpened));
  }

  async getOpenClaims(): Promise<(Claim & { student: Student })[]> {
    return await db
      .select({
        id: claims.id,
        studentId: claims.studentId,
        dateOpened: claims.dateOpened,
        reason: claims.reason,
        notifiedTo: claims.notifiedTo,
        status: claims.status,
        student: students,
      })
      .from(claims)
      .innerJoin(students, eq(claims.studentId, students.id))
      .where(eq(claims.status, "open"))
      .orderBy(desc(claims.dateOpened));
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [newClaim] = await db.insert(claims).values(claim).returning();
    return newClaim;
  }

  async updateClaim(id: string, claim: Partial<InsertClaim>): Promise<Claim> {
    const [updatedClaim] = await db
      .update(claims)
      .set(claim)
      .where(eq(claims.id, id))
      .returning();
    return updatedClaim;
  }

  // Audit log methods
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLog).values(log).returning();
    return newLog;
  }

  async getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]> {
    if (entityType && entityId) {
      return await db
        .select()
        .from(auditLog)
        .where(and(eq(auditLog.entity, entityType), eq(auditLog.entityId, entityId)))
        .orderBy(desc(auditLog.timestamp));
    } else if (entityType) {
      return await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.entity, entityType))
        .orderBy(desc(auditLog.timestamp));
    } else if (entityId) {
      return await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.entityId, entityId))
        .orderBy(desc(auditLog.timestamp));
    } else {
      return await db
        .select()
        .from(auditLog)
        .orderBy(desc(auditLog.timestamp));
    }
  }
}

export const storage = new DatabaseStorage();
