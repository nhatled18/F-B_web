import express from 'express';
import { authMiddleware } from '../../../middleware/auth.js';
import { checkRole } from '../../../middleware/checkRole.js';
import attendanceController from '../controllers/attendanceController.js';
import checklistController from '../controllers/checklistController.js';
import issueController from '../controllers/issueController.js';

const router = express.Router();

// Tất cả các route HR đều yêu cầu đăng nhập
router.use(authMiddleware);
// Chỉ các quyền liên quan đến vận hành mới truy cập được (tất cả các quyền cơ bản trong ZON ZON)
router.use(checkRole(['admin', 'cashier', 'staff']));

// --- Attendance Routes ---
router.post('/check-in', attendanceController.checkIn);
router.get('/attendance/today', attendanceController.getTodayAttendance);

// --- Checklist Routes ---
router.get('/checklist/today', checklistController.getTodayChecklist);
router.post('/checklist/:id/complete', checklistController.completeTask);

// --- Issue Log Routes ---
router.post('/issues', issueController.createIssue);
router.get('/issues', issueController.getIssues);

export default router;
