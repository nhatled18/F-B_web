import express from 'express';
import * as wastageController from '../Controller/WastageController.js';
import { authMiddleware as verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', wastageController.getAllWastageSlips);
router.post('/', wastageController.createWastageSlip);
router.post('/:id/approve', wastageController.approveWastageSlip);
router.post('/:id/reject', wastageController.rejectWastageSlip);

export default router;
