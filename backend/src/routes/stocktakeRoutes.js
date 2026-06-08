import express from 'express';
import * as stocktakeController from '../Controller/StocktakeController.js';
import { authMiddleware as verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', stocktakeController.getAllStocktakes);
router.post('/', stocktakeController.createStocktake);
router.put('/items/:itemId', stocktakeController.updateStocktakeItem);
router.post('/:id/complete', stocktakeController.completeStocktake);

export default router;
