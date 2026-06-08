import express from 'express';
import * as recipeController from '../Controller/RecipeController.js';
import { authMiddleware as verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken); // Cần đăng nhập

router.get('/', recipeController.getAllRecipes);
router.get('/:productId', recipeController.getRecipeByProductId);
router.post('/', recipeController.createOrUpdateRecipe);
router.delete('/:id', recipeController.deleteRecipe);

export default router;
