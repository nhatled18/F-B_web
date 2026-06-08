import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllRecipes = async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        product: true,
        items: {
          include: {
            component: true
          }
        }
      }
    });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách định mức: ' + error.message });
  }
};

export const getRecipeByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const recipe = await prisma.recipe.findUnique({
      where: { productId: Number(productId) },
      include: {
        product: true,
        items: {
          include: {
            component: true
          }
        }
      }
    });
    if (!recipe) {
      return res.status(404).json({ message: 'Không tìm thấy định mức cho sản phẩm này' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy định mức: ' + error.message });
  }
};

export const createOrUpdateRecipe = async (req, res) => {
  const { productId, items } = req.body;
  // items là mảng { componentId, quantity }
  try {
    // Tìm xem đã có recipe chưa
    let recipe = await prisma.recipe.findUnique({
      where: { productId: Number(productId) }
    });

    if (recipe) {
      // Update: xóa hết items cũ và tạo items mới
      await prisma.recipeItem.deleteMany({
        where: { recipeId: recipe.id }
      });
      recipe = await prisma.recipe.update({
        where: { id: recipe.id },
        data: {
          items: {
            create: items.map(item => ({
              componentId: Number(item.componentId),
              quantity: Number(item.quantity)
            }))
          }
        },
        include: { items: true }
      });
    } else {
      // Create mới
      recipe = await prisma.recipe.create({
        data: {
          productId: Number(productId),
          items: {
            create: items.map(item => ({
              componentId: Number(item.componentId),
              quantity: Number(item.quantity)
            }))
          }
        },
        include: { items: true }
      });
    }

    res.json({ message: 'Lưu định mức thành công', recipe });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lưu định mức: ' + error.message });
  }
};

export const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.recipe.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Xóa định mức thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa định mức: ' + error.message });
  }
};
