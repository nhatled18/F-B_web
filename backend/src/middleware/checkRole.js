import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(403).json({ message: "Không có quyền truy cập." });
      }

      // Lấy role mới nhất từ DB thay vì dùng payload cũ trong JWT
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true }
      });

      if (!user || !user.role) {
        return res.status(403).json({ message: "Không tìm thấy thông tin quyền truy cập." });
      }

      // role is stored as comma-separated string, e.g., "cashier,staff"
      const userRoles = user.role.split(',').map(r => r.trim());
      
      const hasRole = userRoles.some(role => allowedRoles.includes(role));
      
      if (!hasRole) {
        return res.status(403).json({ message: "Không có quyền thực hiện chức năng này." });
      }
      
      next();
    } catch (error) {
      console.error("Lỗi kiểm tra quyền:", error);
      return res.status(500).json({ message: "Lỗi kiểm tra quyền." });
    }
  };
};
