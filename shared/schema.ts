import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  boolean, 
  timestamp, 
  date, 
  pgEnum,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const schoolLevelEnum = pgEnum("school_level", ["יסודי", "תיכון"]);
export const activityStatusEnum = pgEnum("activity_status", ["פעיל", "לא פעיל", "מושעה"]);
export const statusEnum = pgEnum("status", ["לא דיווח", "נוכח", "יצא", "יום לא בא לי", "חיסור מאושר", "אישור היעדרות קבוע"]);
export const subStatusEnum = pgEnum("sub_status", ["ללא", "איחור", "נסגר אוטומטית"]);
export const reportedByEnum = pgEnum("reported_by", ["student", "manager", "auto"]);
export const closedReasonEnum = pgEnum("closed_reason", ["n/a", "manual", "auto_16"]);
export const weekdayEnum = pgEnum("weekday", ["א", "ב", "ג", "ד", "ה"]);
export const claimReasonEnum = pgEnum("claim_reason", ["late_threshold", "third_yom_lo_ba_li", "other"]);
export const claimStatusEnum = pgEnum("claim_status", ["open", "closed"]);
export const auditActorEnum = pgEnum("audit_actor", ["manager", "auto", "student"]);

// Tables
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentNumber: text("student_number").notNull().unique(),
  nickname: text("nickname").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phoneNumber: text("phone_number"),
  schoolLevel: schoolLevelEnum("school_level").notNull(),
  activityStatus: activityStatusEnum("activity_status").notNull().default("פעיל"),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  date: date("date").notNull(),
  status: statusEnum("status").notNull().default("לא דיווח"),
  subStatus: subStatusEnum("sub_status").notNull().default("ללא"),
  reportedBy: reportedByEnum("reported_by").notNull().default("student"),
  checkInTime: text("check_in_time"),
  checkOutTime: text("check_out_time"),
  closedReason: closedReasonEnum("closed_reason").notNull().default("n/a"),
  overrideLocked: boolean("override_locked").notNull().default(false),
  overrideLockedAt: timestamp("override_locked_at"),
}, (table) => ({
  uniqueStudentDate: unique().on(table.studentId, table.date),
}));

export const permanentAbsences = pgTable("permanent_absences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  weekday: weekdayEnum("weekday").notNull(),
  reason: text("reason").notNull(),
}, (table) => ({
  uniqueStudentWeekday: unique().on(table.studentId, table.weekday),
}));

export const schoolHolidays = pgTable("school_holidays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull().unique(),
  description: text("description").notNull(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  latenessThresholdPerMonthDefault: integer("lateness_threshold_per_month_default").notNull().default(3),
  maxYomLoBaLiPerMonthDefault: integer("max_yom_lo_ba_li_per_month_default").notNull().default(2),
  courtChairName: text("court_chair_name"),
  courtChairPhone: text("court_chair_phone"),
});

export const studentMonthlyOverrides = pgTable("student_monthly_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  yearMonth: text("year_month").notNull(), // YYYY-MM format
  latenessThresholdOverride: integer("lateness_threshold_override"),
  maxYomLoBaLiOverride: integer("max_yom_lo_ba_li_override"),
}, (table) => ({
  uniqueStudentYearMonth: unique().on(table.studentId, table.yearMonth),
}));

export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  dateOpened: date("date_opened").notNull(),
  reason: claimReasonEnum("reason").notNull(),
  notifiedTo: text("notified_to").array().notNull().default(sql`ARRAY[]::text[]`),
  status: claimStatusEnum("status").notNull().default("open"),
});

export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actor: auditActorEnum("actor").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: varchar("entity_id"),
  before: text("before"), // JSON string
  after: text("after"), // JSON string
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

// Relations
export const studentsRelations = relations(students, ({ many }) => ({
  attendanceRecords: many(attendance),
  permanentAbsences: many(permanentAbsences),
  claims: many(claims),
  monthlyOverrides: many(studentMonthlyOverrides),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
}));

export const permanentAbsencesRelations = relations(permanentAbsences, ({ one }) => ({
  student: one(students, {
    fields: [permanentAbsences.studentId],
    references: [students.id],
  }),
}));

export const studentMonthlyOverridesRelations = relations(studentMonthlyOverrides, ({ one }) => ({
  student: one(students, {
    fields: [studentMonthlyOverrides.studentId],
    references: [students.id],
  }),
}));

export const claimsRelations = relations(claims, ({ one }) => ({
  student: one(students, {
    fields: [claims.studentId],
    references: [students.id],
  }),
}));

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
});

export const insertPermanentAbsenceSchema = createInsertSchema(permanentAbsences).omit({
  id: true,
});

export const insertSchoolHolidaySchema = createInsertSchema(schoolHolidays).omit({
  id: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export const insertStudentMonthlyOverrideSchema = createInsertSchema(studentMonthlyOverrides).omit({
  id: true,
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type PermanentAbsence = typeof permanentAbsences.$inferSelect;
export type InsertPermanentAbsence = z.infer<typeof insertPermanentAbsenceSchema>;

export type SchoolHoliday = typeof schoolHolidays.$inferSelect;
export type InsertSchoolHoliday = z.infer<typeof insertSchoolHolidaySchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

export type StudentMonthlyOverride = typeof studentMonthlyOverrides.$inferSelect;
export type InsertStudentMonthlyOverride = z.infer<typeof insertStudentMonthlyOverrideSchema>;

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Legacy User schema for compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
