import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addImageUrlColumn() {
  try {
    console.log('📝 Kiểm tra và thêm trường imageUrl vào bảng Product...');
    
    // Chạy migration SQL trực tiếp
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT NOT NULL DEFAULT '';
    `);
    
    console.log('✅ Trường imageUrl đã được thêm thành công!');
    console.log('📊 Schema đã được cập nhật.');
    
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✅ Trường imageUrl đã tồn tại trong bảng Product');
    } else {
      console.error('❌ Lỗi:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

addImageUrlColumn();
