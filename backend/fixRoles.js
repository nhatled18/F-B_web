import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRoles() {
  try {
    const result = await prisma.user.updateMany({
      where: { role: 'user' },
      data: { role: 'admin' } // Nâng cấp các tài khoản cũ lên admin để dễ test
    });
    console.log(`Đã cập nhật ${result.count} tài khoản từ 'user' sang 'admin'`);
  } catch (error) {
    console.error("Lỗi cập nhật role:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoles();
