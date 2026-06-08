import express from 'express';
import * as hqController from '../Controller/HQController.js';
// Có thể thêm API Key middleware thay vì verifyToken thông thường nếu TCT gọi server-to-server

const router = express.Router();

router.post('/import', hqController.importFromHQ);

export default router;
