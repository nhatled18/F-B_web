import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const importFromHQ = async (req, res) => {
  const { items, refCode } = req.body;
  // items: [{ sku: string, quantity: number, cost?: number }]

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Danh sách hàng hóa trống' });
  }

  try {
    const importCode = refCode || `HQ-${Date.now()}`;
    const results = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { sku: item.sku }
      });

      if (!product) {
        results.push({ sku: item.sku, status: 'failed', reason: 'Không tìm thấy SKU' });
        continue;
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        results.push({ sku: item.sku, status: 'failed', reason: 'Số lượng không hợp lệ' });
        continue;
      }

      // 1. Tạo Transaction IN
      await prisma.transaction.create({
        data: {
          productId: product.id,
          type: 'IN',
          transactionCode: importCode,
          summary: `Nhập kho từ TCT - ${importCode}`,
          createdBy: 'HQ_SYSTEM',
          quantity: qty,
          unitPrice: Number(item.cost) || product.cost,
          source: 'headquarters',
          reason: 'import_hq',
          note: `Đồng bộ tự động từ hệ thống TCT`
        }
      });

      // 2. Cập nhật Inventory
      let inventory = await prisma.inventory.findFirst({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' }
      });

      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            stockIn: inventory.stockIn + qty,
            displayStock: inventory.displayStock + qty,
            endingStock: inventory.endingStock + qty
          }
        });
      } else {
        // Tạo inventory mới nếu chưa có (dù thường là đã có)
        await prisma.inventory.create({
          data: {
            productId: product.id,
            stockIn: qty,
            displayStock: qty,
            endingStock: qty,
            cost: Number(item.cost) || product.cost
          }
        });
      }

      results.push({ sku: item.sku, status: 'success', quantity: qty });
    }

    res.json({ message: 'Xử lý đồng bộ từ TCT hoàn tất', importCode, results });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi đồng bộ từ TCT: ' + error.message });
  }
};
