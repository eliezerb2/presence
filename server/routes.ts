import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { attendanceService } from "./services/attendance";
import { schedulerService } from "./services/scheduler";
import { 
  insertStudentSchema, 
  insertAttendanceSchema, 
  insertPermanentAbsenceSchema,
  insertSchoolHolidaySchema,
  insertSettingsSchema,
  insertStudentMonthlyOverrideSchema,
  insertClaimSchema
} from "@shared/schema";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the scheduler service
  schedulerService.start();

  // Students endpoints
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const students = await storage.searchStudents(query);
      res.json(students);
    } catch (error) {
      console.error("Error searching students:", error);
      res.status(500).json({ message: "Failed to search students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.patch("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const student = await storage.updateStudent(id, updates);
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStudent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Attendance endpoints
  app.get("/api/attendance/today", async (req, res) => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const attendance = await storage.getTodayAttendance(today);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const attendance = await storage.getTodayAttendance(date);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance/check-in", async (req, res) => {
    try {
      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ message: "Student ID is required" });
      }
      await attendanceService.checkIn(studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error checking in student:", error);
      res.status(500).json({ message: "Failed to check in student" });
    }
  });

  app.post("/api/attendance/check-out", async (req, res) => {
    try {
      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ message: "Student ID is required" });
      }
      await attendanceService.checkOut(studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error checking out student:", error);
      res.status(500).json({ message: "Failed to check out student" });
    }
  });

  app.patch("/api/attendance/:id/override", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await attendanceService.overrideAttendance(id, updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error overriding attendance:", error);
      res.status(500).json({ message: "Failed to override attendance" });
    }
  });

  app.get("/api/attendance/export/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const csvData = await attendanceService.exportAttendanceCSV(date);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-${date}.csv"`);
      res.send('\ufeff' + csvData); // Add BOM for Hebrew support
    } catch (error) {
      console.error("Error exporting attendance:", error);
      res.status(500).json({ message: "Failed to export attendance" });
    }
  });

  // Permanent absences endpoints
  app.get("/api/permanent-absences", async (req, res) => {
    try {
      const absences = await storage.getPermanentAbsences();
      res.json(absences);
    } catch (error) {
      console.error("Error fetching permanent absences:", error);
      res.status(500).json({ message: "Failed to fetch permanent absences" });
    }
  });

  app.post("/api/permanent-absences", async (req, res) => {
    try {
      const validatedData = insertPermanentAbsenceSchema.parse(req.body);
      const absence = await storage.createPermanentAbsence(validatedData);
      res.status(201).json(absence);
    } catch (error) {
      console.error("Error creating permanent absence:", error);
      res.status(500).json({ message: "Failed to create permanent absence" });
    }
  });

  app.patch("/api/permanent-absences/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const absence = await storage.updatePermanentAbsence(id, updates);
      res.json(absence);
    } catch (error) {
      console.error("Error updating permanent absence:", error);
      res.status(500).json({ message: "Failed to update permanent absence" });
    }
  });

  app.delete("/api/permanent-absences/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePermanentAbsence(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting permanent absence:", error);
      res.status(500).json({ message: "Failed to delete permanent absence" });
    }
  });

  // School holidays endpoints
  app.get("/api/school-holidays", async (req, res) => {
    try {
      const holidays = await storage.getSchoolHolidays();
      res.json(holidays);
    } catch (error) {
      console.error("Error fetching school holidays:", error);
      res.status(500).json({ message: "Failed to fetch school holidays" });
    }
  });

  app.post("/api/school-holidays", async (req, res) => {
    try {
      const validatedData = insertSchoolHolidaySchema.parse(req.body);
      const holiday = await storage.createSchoolHoliday(validatedData);
      res.status(201).json(holiday);
    } catch (error) {
      console.error("Error creating school holiday:", error);
      res.status(500).json({ message: "Failed to create school holiday" });
    }
  });

  app.patch("/api/school-holidays/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const holiday = await storage.updateSchoolHoliday(id, updates);
      res.json(holiday);
    } catch (error) {
      console.error("Error updating school holiday:", error);
      res.status(500).json({ message: "Failed to update school holiday" });
    }
  });

  app.delete("/api/school-holidays/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSchoolHoliday(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting school holiday:", error);
      res.status(500).json({ message: "Failed to delete school holiday" });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || {
        latenessThresholdPerMonthDefault: 3,
        maxYomLoBaLiPerMonthDefault: 2,
        courtChairName: "",
        courtChairPhone: ""
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.createOrUpdateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Claims endpoints
  app.get("/api/claims", async (req, res) => {
    try {
      const claims = await storage.getClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.get("/api/claims/open", async (req, res) => {
    try {
      const claims = await storage.getOpenClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching open claims:", error);
      res.status(500).json({ message: "Failed to fetch open claims" });
    }
  });

  app.patch("/api/claims/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const claim = await storage.updateClaim(id, updates);
      res.json(claim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ message: "Failed to update claim" });
    }
  });

  // Student monthly overrides endpoints
  app.get("/api/student-monthly-overrides/:studentId/:yearMonth", async (req, res) => {
    try {
      const { studentId, yearMonth } = req.params;
      const override = await storage.getStudentMonthlyOverride(studentId, yearMonth);
      res.json(override);
    } catch (error) {
      console.error("Error fetching student monthly override:", error);
      res.status(500).json({ message: "Failed to fetch override" });
    }
  });

  app.post("/api/student-monthly-overrides", async (req, res) => {
    try {
      const validatedData = insertStudentMonthlyOverrideSchema.parse(req.body);
      const override = await storage.createStudentMonthlyOverride(validatedData);
      res.status(201).json(override);
    } catch (error) {
      console.error("Error creating student monthly override:", error);
      res.status(500).json({ message: "Failed to create override" });
    }
  });

  const httpServer = createServer(app);

  // Cleanup on server shutdown
  process.on('SIGTERM', () => {
    schedulerService.stop();
  });

  process.on('SIGINT', () => {
    schedulerService.stop();
  });

  return httpServer;
}
