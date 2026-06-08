import { Router } from 'express';
const router = Router();

import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import transactionsRoutes from './transactionsRoutes.js';
import historyRoutes from './historyRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import recipeRoutes from './recipeRoutes.js';
import posRoutes from './posRoutes.js';
import wastageRoutes from './wastageRoutes.js';
import stocktakeRoutes from './stocktakeRoutes.js';
import hqRoutes from './hqRoutes.js';

// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/transactions', transactionsRoutes);
// router.use('/imports', transactionsRoutes); 
router.use('/history', historyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/inventory', inventoryRoutes);

// New Routes
router.use('/recipes', recipeRoutes);
router.use('/pos', posRoutes);
router.use('/wastage', wastageRoutes);
router.use('/stocktake', stocktakeRoutes);
router.use('/hq', hqRoutes);

// Health check (optional)
// router.get('/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Product Management API is running', timestamp: new Date().toISOString() });
// });

export default router;
