import express from 'express';
import { authMiddleware } from '../../../middleware/auth.js';
import { checkRole } from '../../../middleware/checkRole.js';
import { checkAttendanceAndChecklist } from '../../../middleware/hrMiddleware.js';
import orderController from '../controllers/orderController.js';
import shiftController from '../controllers/shiftController.js';

const router = express.Router();

// Yêu cầu đăng nhập và phân quyền (admin, cashier) cho các tính năng POS
router.use(authMiddleware);
router.use(checkRole(['admin', 'cashier']));

// --- Shift Routes ---
router.post('/shift/open', shiftController.openShift);
router.post('/shift/close', shiftController.closeShift);
router.get('/shift/current', shiftController.getCurrentShift);

// --- Order Routes (Bán hàng) ---
// Phải check thêm điều kiện HR (đã chấm công, đã xong checklist) trước khi vào POS chốt đơn
router.post('/orders', checkAttendanceAndChecklist, orderController.createOrder);

export default router;
