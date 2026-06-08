import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MORNING_TASKS = [
  "Lau quầy",
  "Bật lò nướng",
  "Kiểm két tiền đầu ca"
];

const AFTERNOON_TASKS = [
  "Đổ rác",
  "Kiểm két tiền cuối ca",
  "Tắt thiết bị"
];

class ChecklistController {
  // GET /api/hr/checklist/today
  async getTodayChecklist(req, res) {
    try {
      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Nếu chưa có checklist cho hôm nay thì tạo mặc định (giả sử ca sáng)
      let checklists = await prisma.checklist.findMany({
        where: {
          userId: userId,
          date: {
            gte: today
          }
        }
      });

      if (checklists.length === 0) {
        // Tự động tạo checklist cho ca sáng
        const newChecklistsData = MORNING_TASKS.map(taskName => ({
          userId: userId,
          shiftType: 'morning',
          taskName: taskName,
          date: new Date()
        }));

        await prisma.checklist.createMany({
          data: newChecklistsData
        });

        checklists = await prisma.checklist.findMany({
          where: {
            userId: userId,
            date: {
              gte: today
            }
          }
        });
      }

      res.json({ checklists });
    } catch (error) {
      console.error("Get checklist error:", error);
      res.status(500).json({ message: "Lỗi khi lấy checklist." });
    }
  }

  // POST /api/hr/checklist/:id/complete
  async completeTask(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const checklist = await prisma.checklist.findUnique({
        where: { id: parseInt(id) }
      });

      if (!checklist || checklist.userId !== userId) {
        return res.status(404).json({ message: "Không tìm thấy công việc này." });
      }

      const updatedChecklist = await prisma.checklist.update({
        where: { id: parseInt(id) },
        data: {
          isCompleted: true,
          completedAt: new Date()
        }
      });

      res.json({ message: "Đã hoàn thành công việc.", checklist: updatedChecklist });
    } catch (error) {
      console.error("Complete task error:", error);
      res.status(500).json({ message: "Lỗi khi hoàn thành công việc." });
    }
  }
}

export default new ChecklistController();
