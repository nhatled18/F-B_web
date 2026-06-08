import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Giả lập cấu hình BSSID Wifi của quán
const VALID_WIFI_BSSIDS = ['00:14:22:01:23:45', '11:22:33:44:55:66'];

class AttendanceController {
  // POST /api/hr/check-in
  async checkIn(req, res) {
    try {
      const { wifiBssid } = req.body;
      const userId = req.user.id;

      // Validate BSSID
      if (!wifiBssid || !VALID_WIFI_BSSIDS.includes(wifiBssid)) {
        return res.status(403).json({ 
          message: "Bạn phải kết nối đúng mạng Wifi của quán Zon Zon để chấm công" 
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Kiểm tra xem đã chấm công chưa
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          userId: userId,
          date: {
            gte: today
          }
        }
      });

      if (existingAttendance) {
        return res.status(400).json({ message: "Bạn đã chấm công hôm nay rồi." });
      }

      // Tạo chấm công mới
      const attendance = await prisma.attendance.create({
        data: {
          userId: userId,
          checkInTime: new Date(),
          wifiBssid: wifiBssid,
          date: new Date()
        }
      });

      res.status(201).json({
        message: "Chấm công thành công!",
        attendance
      });
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Lỗi hệ thống khi chấm công." });
    }
  }

  // GET /api/hr/attendance/today
  async getTodayAttendance(req, res) {
    try {
      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await prisma.attendance.findFirst({
        where: {
          userId: userId,
          date: {
            gte: today
          }
        }
      });

      res.json({ attendance });
    } catch (error) {
      console.error("Get attendance error:", error);
      res.status(500).json({ message: "Lỗi khi lấy thông tin chấm công." });
    }
  }
}

export default new AttendanceController();
