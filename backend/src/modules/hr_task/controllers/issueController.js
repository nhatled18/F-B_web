import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class IssueController {
  // POST /api/hr/issues
  async createIssue(req, res) {
    try {
      const { title, description, category, severity, imageBase64 } = req.body;
      const userId = req.user.id;

      if (!title || !description || !category) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (tiêu đề, mô tả, phân loại).' });
      }

      const issue = await prisma.issueLog.create({
        data: {
          userId,
          title,
          description,
          category,
          severity: severity || 'medium',
          imageBase64: imageBase64 || null,
          status: 'open'
        },
        include: {
          user: { select: { fullName: true } }
        }
      });

      res.status(201).json({ message: 'Báo cáo sự cố thành công!', issue });
    } catch (error) {
      console.error('Create issue error:', error);
      res.status(500).json({ message: 'Lỗi khi tạo báo cáo sự cố.' });
    }
  }

  // GET /api/hr/issues - Lấy toàn bộ (admin) hoặc của user hiện tại
  async getIssues(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 20 } = req.query;

      const where = { userId };
      if (status) where.status = status;

      const issues = await prisma.issueLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        include: {
          user: { select: { fullName: true } }
        }
      });

      res.json({ issues });
    } catch (error) {
      console.error('Get issues error:', error);
      res.status(500).json({ message: 'Lỗi khi lấy danh sách sự cố.' });
    }
  }
}

export default new IssueController();
