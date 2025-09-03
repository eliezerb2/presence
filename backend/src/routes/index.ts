import { Router } from 'express';
import { KioskController } from '../controllers/KioskController';
import { ManagerController } from '../controllers/ManagerController';
import { AdminController } from '../controllers/AdminController';

const router = Router();
const kioskController = new KioskController();
const managerController = new ManagerController();
const adminController = new AdminController();

// Kiosk routes (tablet interface)
router.get('/kiosk/search', kioskController.searchStudents.bind(kioskController));
router.post('/kiosk/checkin/:studentId', kioskController.checkIn.bind(kioskController));
router.post('/kiosk/checkout/:studentId', kioskController.checkOut.bind(kioskController));

// Manager routes
router.get('/manager/attendance', managerController.getDailyAttendance.bind(managerController));
router.put('/manager/attendance/:id', managerController.overrideAttendance.bind(managerController));
router.get('/manager/stats', managerController.getMonthlyStats.bind(managerController));
router.get('/manager/export', managerController.exportCSV.bind(managerController));

// Admin routes - Students
router.get('/admin/students', adminController.getStudents.bind(adminController));
router.post('/admin/students', adminController.createStudent.bind(adminController));
router.put('/admin/students/:id', adminController.updateStudent.bind(adminController));
router.delete('/admin/students/:id', adminController.deleteStudent.bind(adminController));

// Admin routes - Permanent Absences
router.get('/admin/permanent-absences', adminController.getPermanentAbsences.bind(adminController));
router.post('/admin/permanent-absences', adminController.createPermanentAbsence.bind(adminController));
router.delete('/admin/permanent-absences/:id', adminController.deletePermanentAbsence.bind(adminController));

// Admin routes - Holidays
router.get('/admin/holidays', adminController.getHolidays.bind(adminController));
router.post('/admin/holidays', adminController.createHoliday.bind(adminController));
router.delete('/admin/holidays/:id', adminController.deleteHoliday.bind(adminController));

// Admin routes - Settings
router.get('/admin/settings', adminController.getSettings.bind(adminController));
router.put('/admin/settings', adminController.updateSettings.bind(adminController));

// Admin routes - Monthly Overrides
router.get('/admin/overrides', adminController.getMonthlyOverrides.bind(adminController));
router.post('/admin/overrides', adminController.createMonthlyOverride.bind(adminController));
router.delete('/admin/overrides/:id', adminController.deleteMonthlyOverride.bind(adminController));

export default router;