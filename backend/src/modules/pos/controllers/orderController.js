import { PrismaClient } from '@prisma/client';
import misaService from '../services/misaService.js';

const prisma = new PrismaClient();

export const createOrder = async (req, res) => {
  const { items, totalAmount, source, paymentMethod } = req.body;
  // items: [{ productId, quantity, price, options: [{option_id, quantity}] }]
  const userId = req.user?.id;

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
        source: source || 'at_store',
        paymentMethod: paymentMethod || 'cash',
        status: 'completed',
        misaSynced: false,
        createdBy: userId,
        items: {
          create: items.map(item => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: Number(item.quantity) * Number(item.price),
            options: item.options ? JSON.stringify(item.options) : ""
          }))
        }
      },
      include: { items: true }
    });

    // 2. Cập nhật Doanh thu Ca hiện tại
    const shift = await prisma.cashShift.findFirst({
      where: { userId, status: 'open' }
    });
    
    if (shift) {
      if (paymentMethod === 'cash') {
        await prisma.cashShift.update({
          where: { id: shift.id },
          data: { totalCashSales: shift.totalCashSales + Number(totalAmount) }
        });
      } else {
        await prisma.cashShift.update({
          where: { id: shift.id },
          data: { totalBankingSales: shift.totalBankingSales + Number(totalAmount) }
        });
      }
    }

    // 3. Trừ lùi kho dựa trên định mức (BOM)
    for (const item of items) {
      const soldQty = Number(item.quantity);
      
      const recipe = await prisma.recipe.findUnique({
        where: { productId: Number(item.productId) },
        include: { items: true }
      });

      // Tạo object lưu tổng lượng nguyên liệu cần trừ (gồm BOM + Options)
      const componentDeductions = {};

      // Phân tích BOM
      if (recipe && recipe.items.length > 0) {
        for (const recipeItem of recipe.items) {
          componentDeductions[recipeItem.componentId] = (componentDeductions[recipeItem.componentId] || 0) + (recipeItem.quantity * soldQty);
        }
      } else {
        // Bán thẳng không qua định mức
        componentDeductions[Number(item.productId)] = (componentDeductions[Number(item.productId)] || 0) + soldQty;
      }

      // Phân tích Ghi chú ảnh hưởng kho (Options)
      // Giả sử option_id là SKU của nguyên liệu (ví dụ: 'PATE', 'THIT')
      if (item.options && item.options.length > 0) {
        for (const opt of item.options) {
          const optionProduct = await prisma.product.findUnique({
            where: { sku: opt.option_id }
          });
          if (optionProduct) {
            // Giả sử mỗi option thêm 1 đơn vị định mức (hoặc cấu hình tùy ý)
            // Ở đây tạm trừ 1 quantity của product tương ứng
            const extraQty = Number(opt.quantity) || 1;
            componentDeductions[optionProduct.id] = (componentDeductions[optionProduct.id] || 0) + extraQty;
          }
        }
      }

      // Thực hiện trừ kho thực tế
      for (const [componentIdStr, deductionQty] of Object.entries(componentDeductions)) {
        const componentId = Number(componentIdStr);
        
        await prisma.transaction.create({
          data: {
            productId: componentId,
            userId: userId,
            type: 'OUT',
            transactionCode: `SALE-${orderCode}`,
            summary: `Bán POS ${orderCode}`,
            createdBy: req.user?.username || 'system',
            quantity: -deductionQty,
            source: 'system',
            reason: 'sale',
            note: `Trừ lùi BOM + Options từ bán sản phẩm ID ${item.productId}`
          }
        });

        const inventory = await prisma.inventory.findFirst({
          where: { productId: componentId },
          orderBy: { createdAt: 'desc' }
        });

        if (inventory) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              stockOut: inventory.stockOut + deductionQty,
              displayStock: inventory.displayStock - deductionQty,
              endingStock: inventory.endingStock - deductionQty
            }
          });
        }
      }
    }

    // 4. Gọi MISA Service bất đồng bộ
    misaService.syncBill(order)
      .then(async () => {
        // Update status in DB if success
        await prisma.order.update({
          where: { id: order.id },
          data: { misaSynced: true }
        });
      })
      .catch((err) => {
        console.error("MISA Sync failed, queue for retry", err.message);
      });

    res.json({ message: 'Thanh toán thành công', order });
  } catch (error) {
    console.error('POS Checkout error:', error);
    res.status(500).json({ error: 'Lỗi khi thanh toán: ' + error.message });
  }
};

export default { createOrder };
