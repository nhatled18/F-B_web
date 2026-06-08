import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const checkoutPOS = async (req, res) => {
  const { items, totalAmount } = req.body;
  // items: [{ productId, quantity, price }]
  const userId = req.user?.userId; // Lấy từ token

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Giỏ hàng trống' });
  }

  try {
    // 1. Tạo Order
    const orderCode = `ORD-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderCode,
        totalAmount: Number(totalAmount) || 0,
        status: 'completed',
        createdBy: userId,
        items: {
          create: items.map(item => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: Number(item.quantity) * Number(item.price)
          }))
        }
      },
      include: { items: true }
    });

    // 2. Trừ lùi kho dựa trên định mức (BOM)
    // Duyệt qua từng sản phẩm bán ra
    for (const item of items) {
      const soldQty = Number(item.quantity);
      // Tìm định mức của sản phẩm này
      const recipe = await prisma.recipe.findUnique({
        where: { productId: Number(item.productId) },
        include: { items: true }
      });

      if (recipe && recipe.items.length > 0) {
        // Có định mức -> Trừ kho các nguyên liệu
        for (const recipeItem of recipe.items) {
          const totalComponentUsed = recipeItem.quantity * soldQty;

          // Tạo transaction xuất kho cho nguyên liệu
          await prisma.transaction.create({
            data: {
              productId: recipeItem.componentId,
              userId: userId,
              type: 'OUT',
              transactionCode: `SALE-${orderCode}`,
              summary: `Bán POS ${orderCode}`,
              createdBy: req.user?.username || 'system',
              quantity: -totalComponentUsed,
              source: 'system',
              reason: 'sale',
              note: `Trừ lùi tự động từ bán sản phẩm ID ${item.productId}`
            }
          });

          // Cập nhật bảng Inventory
          const inventory = await prisma.inventory.findFirst({
            where: { productId: recipeItem.componentId },
            orderBy: { createdAt: 'desc' }
          });

          if (inventory) {
            await prisma.inventory.update({
              where: { id: inventory.id },
              data: {
                stockOut: inventory.stockOut + totalComponentUsed,
                displayStock: inventory.displayStock - totalComponentUsed,
                endingStock: inventory.endingStock - totalComponentUsed
              }
            });
          }
        }
      } else {
        // Không có định mức -> Trừ thẳng sản phẩm này (trường hợp bán lẻ không cần chế biến)
        await prisma.transaction.create({
          data: {
            productId: Number(item.productId),
            userId: userId,
            type: 'OUT',
            transactionCode: `SALE-${orderCode}`,
            summary: `Bán POS ${orderCode}`,
            createdBy: req.user?.username || 'system',
            quantity: -soldQty,
            source: 'system',
            reason: 'sale',
            note: 'Bán thẳng không qua định mức'
          }
        });

        // Cập nhật Inventory
        const inventory = await prisma.inventory.findFirst({
          where: { productId: Number(item.productId) },
          orderBy: { createdAt: 'desc' }
        });

        if (inventory) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              stockOut: inventory.stockOut + soldQty,
              displayStock: inventory.displayStock - soldQty,
              endingStock: inventory.endingStock - soldQty
            }
          });
        }
      }
    }

    res.json({ message: 'Thanh toán thành công và đã trừ kho', order });
  } catch (error) {
    console.error('POS Checkout error:', error);
    res.status(500).json({ error: 'Lỗi khi thanh toán: ' + error.message });
  }
};
