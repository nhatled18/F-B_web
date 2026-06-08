import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ShiftController {
  // POST /api/pos/shift/open
  async openShift(req, res) {
    try {
      const { startAmount } = req.body;
      const userId = req.user.id;

      // Check if there is an open shift
      const existingShift = await prisma.cashShift.findFirst({
        where: { userId, status: 'open' }
      });

      if (existingShift) {
        return res.status(400).json({ message: "Bạn đang có một ca làm việc mở." });
      }

      const shift = await prisma.cashShift.create({
        data: {
          userId,
          startAmount: Number(startAmount) || 0,
          status: 'open',
          date: new Date()
        }
      });

      res.status(201).json({ message: "Mở ca thành công.", shift });
    } catch (error) {
      console.error("Open shift error:", error);
      res.status(500).json({ message: "Lỗi mở ca." });
    }
  }

  // POST /api/pos/shift/close
  async closeShift(req, res) {
    try {
      const { endAmountReal } = req.body;
      const userId = req.user.id;

      const shift = await prisma.cashShift.findFirst({
        where: { userId, status: 'open' }
      });

      if (!shift) {
        return res.status(404).json({ message: "Không tìm thấy ca làm việc đang mở." });
      }

      const systemCash = shift.startAmount + shift.totalCashSales;
      const differenceAmount = Number(endAmountReal) - systemCash;

      const updatedShift = await prisma.cashShift.update({
        where: { id: shift.id },
        data: {
          endAmountSystem: systemCash,
          endAmountReal: Number(endAmountReal),
          differenceAmount: differenceAmount,
          status: 'closed'
        }
      });

      res.json({ 
        message: "Chốt ca thành công.", 
        shift: updatedShift,
        differenceAlert: differenceAmount !== 0 ? `Lệch két: ${differenceAmount}` : "Két khớp." 
      });
    } catch (error) {
      console.error("Close shift error:", error);
      res.status(500).json({ message: "Lỗi chốt ca." });
    }
  }

  // GET /api/pos/shift/current
  async getCurrentShift(req, res) {
    try {
      const userId = req.user.id;
      const shift = await prisma.cashShift.findFirst({
        where: { userId, status: 'open' }
      });
      res.json({ shift });
    } catch (error) {
      console.error("Get current shift error:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin ca." });
    }
  }
}

export default new ShiftController();
