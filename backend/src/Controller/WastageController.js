import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllWastageSlips = async (req, res) => {
  try {
    const slips = await prisma.wastageSlip.findMany({
      include: {
        reporter: { select: { fullName: true, username: true } },
        approver: { select: { fullName: true, username: true } },
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(slips);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phiếu xuất hủy: ' + error.message });
  }
};

export const createWastageSlip = async (req, res) => {
  const { reason, items } = req.body;
  const userId = req.user?.userId;

  try {
    const slipCode = `WH-${Date.now()}`;
    const slip = await prisma.wastageSlip.create({
      data: {
        slipCode,
        reason: reason || '',
        reportedBy: userId,
        status: 'pending',
        items: {
          create: items.map(item => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            reason: item.reason || ''
          }))
        }
      },
      include: { items: true }
    });
    res.json({ message: 'Tạo phiếu xuất hủy thành công, chờ duyệt', slip });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo phiếu xuất hủy: ' + error.message });
  }
};

export const approveWastageSlip = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  try {
    const slip = await prisma.wastageSlip.findUnique({
      where: { id: Number(id) },
      include: { items: true }
    });

    if (!slip) return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (slip.status !== 'pending') return res.status(400).json({ message: 'Phiếu này đã được xử lý' });

    // Cập nhật trạng thái phiếu
    await prisma.wastageSlip.update({
      where: { id: slip.id },
      data: {
        status: 'approved',
        approvedBy: userId
      }
    });

    // Trừ kho
    for (const item of slip.items) {
      await prisma.transaction.create({
        data: {
          productId: item.productId,
          userId: userId,
          type: 'OUT',
          transactionCode: `WH-${slip.slipCode}`,
          summary: `Xuất hủy phiếu ${slip.slipCode}`,
          createdBy: req.user?.username || 'system',
          quantity: -item.quantity,
          source: 'manual',
          reason: 'wastage',
          note: item.reason || slip.reason
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
            damaged: inventory.damaged + item.quantity,
            displayStock: inventory.displayStock - item.quantity,
            endingStock: inventory.endingStock - item.quantity
          }
        });
      }
    }

    res.json({ message: 'Duyệt phiếu xuất hủy thành công, đã trừ kho' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi duyệt phiếu: ' + error.message });
  }
};

export const rejectWastageSlip = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  try {
    const slip = await prisma.wastageSlip.update({
      where: { id: Number(id) },
      data: {
        status: 'rejected',
        approvedBy: userId
      }
    });
    res.json({ message: 'Đã từ chối phiếu xuất hủy', slip });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi từ chối phiếu: ' + error.message });
  }
};
