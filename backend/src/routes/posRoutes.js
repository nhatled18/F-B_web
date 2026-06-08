import express from 'express';
import * as posController from '../Controller/POSController.js';
import { authMiddleware as verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.post('/checkout', posController.checkoutPOS);

export default router;
