import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const checkAttendanceAndChecklist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Kiểm tra đã chấm công hôm nay chưa
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: userId,
        date: {
          gte: today
        }
      }
    });

    if (!attendance) {
      return res.status(403).json({ message: "Vui lòng Chấm công Wifi trước khi vào màn hình bán hàng!" });
    }

    // 2. Kiểm tra checklist mở ca đã hoàn thành chưa
    // Giả sử checklist ca sáng (morning) là mở ca. 
    // Chúng ta lấy tất cả checklist của ca hiện tại trong ngày, nếu có cái nào chưa hoàn thành thì block.
    const uncompletedChecklists = await prisma.checklist.findFirst({
      where: {
        userId: userId,
        date: {
          gte: today
        },
        isCompleted: false
      }
    });

    if (uncompletedChecklists) {
      return res.status(403).json({ message: "Vui lòng hoàn thành tất cả Checklist ca làm việc trước khi vào màn hình bán hàng!" });
    }

    next();
  } catch (error) {
    console.error("Lỗi kiểm tra HR middleware:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra trạng thái ca làm việc." });
  }
};
