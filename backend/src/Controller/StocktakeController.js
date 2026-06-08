import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllStocktakes = async (req, res) => {
  try {
    const stocktakes = await prisma.stocktake.findMany({
      include: {
        creator: { select: { fullName: true, username: true } },
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(stocktakes);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phiếu kiểm kê: ' + error.message });
  }
};

export const createStocktake = async (req, res) => {
  const { note } = req.body;
  const userId = req.user?.userId;

  try {
    // Lấy tồn kho hiện tại của tất cả sản phẩm
    const products = await prisma.product.findMany({
      include: {
        inventories: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const itemsToCreate = products.map(product => {
      const currentInv = product.inventories[0];
      const systemQty = currentInv ? currentInv.endingStock : 0;
      return {
        productId: product.id,
        systemQuantity: systemQty
      };
    });

    const code = `KK-${Date.now()}`;
    const stocktake = await prisma.stocktake.create({
      data: {
        code,
        note: note || '',
        createdBy: userId,
        status: 'pending',
        items: {
          create: itemsToCreate
        }
      },
      include: { items: true }
    });

    res.json({ message: 'Tạo phiếu kiểm kê thành công', stocktake });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo phiếu kiểm kê: ' + error.message });
  }
};

export const updateStocktakeItem = async (req, res) => {
  const { itemId } = req.params;
  const { actualQuantity, note } = req.body;

  try {
    const item = await prisma.stocktakeItem.findUnique({ where: { id: Number(itemId) } });
    if (!item) return res.status(404).json({ message: 'Không tìm thấy dòng kiểm kê' });

    const difference = Number(actualQuantity) - item.systemQuantity;

    const updatedItem = await prisma.stocktakeItem.update({
      where: { id: Number(itemId) },
      data: {
        actualQuantity: Number(actualQuantity),
        difference,
        note: note || item.note
      }
    });

    res.json({ message: 'Cập nhật số đếm thành công', updatedItem });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật số đếm: ' + error.message });
  }
};

export const completeStocktake = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  try {
    const stocktake = await prisma.stocktake.findUnique({
      where: { id: Number(id) },
      include: { items: true }
    });

    if (!stocktake) return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm kê' });
    if (stocktake.status === 'completed') return res.status(400).json({ message: 'Phiếu kiểm kê này đã chốt' });

    // Đánh dấu hoàn thành
    await prisma.stocktake.update({
      where: { id: stocktake.id },
      data: { status: 'completed' }
    });

    // Tạo các giao dịch điều chỉnh (ADJUST) cho các sản phẩm có độ lệch
    for (const item of stocktake.items) {
      if (item.actualQuantity !== null && item.difference !== 0) {
        await prisma.transaction.create({
          data: {
            productId: item.productId,
            userId: userId,
            type: 'ADJUST',
            transactionCode: `ADJ-${stocktake.code}`,
            summary: `Điều chỉnh kiểm kê ${stocktake.code}`,
            createdBy: req.user?.username || 'system',
            quantity: item.difference, // Có thể + hoặc -
            source: 'system',
            reason: 'adjust',
            note: item.note
          }
        });

        // Cập nhật Inventory
        const inventory = await prisma.inventory.findFirst({
          where: { productId: item.productId },
          orderBy: { createdAt: 'desc' }
        });

        if (inventory) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              displayStock: inventory.displayStock + item.difference,
              endingStock: inventory.endingStock + item.difference
            }
          });
        }
      }
    }

    res.json({ message: 'Chốt kho kiểm kê thành công, đã cập nhật tồn kho' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi chốt kho: ' + error.message });
  }
};
