import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Đang thêm dữ liệu ZONZON Menu vào hệ thống...");

  // Xóa trắng bảng cũ để tránh trùng lặp khi chạy lại
  await prisma.recipeItem.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();

  // 1. Nhập Nguyên Liệu
  const ingredients = [
    { sku: 'NL-XAXIU', productName: 'Thịt Xá Xíu Zonzon', group: 'Thịt', unit: 'g', cost: 380, retailPrice: 0 },
    { sku: 'NL-CHALUA', productName: 'Chả Lụa Zonzon', group: 'Thịt', unit: 'g', cost: 260, retailPrice: 0 },
    { sku: 'NL-JAMBON', productName: 'Jambon Zonzon', group: 'Thịt', unit: 'g', cost: 260, retailPrice: 0 },
    { sku: 'NL-DABAODO', productName: 'Da Bao Đỏ', group: 'Thịt', unit: 'g', cost: 260, retailPrice: 0 },
    { sku: 'NL-CHAQUE', productName: 'Chả Quế', group: 'Thịt', unit: 'g', cost: 260, retailPrice: 0 },
    { sku: 'NL-CHATHU', productName: 'Chả Thủ', group: 'Thịt', unit: 'g', cost: 260, retailPrice: 0 },
    { sku: 'NL-PATE', productName: 'Pate Đặc Biệt', group: 'Topping', unit: 'g', cost: 260, retailPrice: 0 },
    { sku: 'NL-BO', productName: 'Bơ Zonzon', group: 'Topping', unit: 'g', cost: 260, retailPrice: 0 },
    { sku: 'NL-CHABONG', productName: 'Chà Bông', group: 'Topping', unit: 'g', cost: 500, retailPrice: 0 },
    { sku: 'NL-BANHMI', productName: 'Vỏ Bánh Mì', group: 'Khác', unit: 'Cái', cost: 3000, retailPrice: 0 },
    { sku: 'NL-XOI', productName: 'Xôi Trắng', group: 'Khác', unit: 'Phần', cost: 5000, retailPrice: 0 },
    { sku: 'NL-RAUDUA', productName: 'Rau Dưa & Đồ Chua', group: 'Khác', unit: 'Phần', cost: 2000, retailPrice: 0 },
    { sku: 'NL-SOT', productName: 'Nước Sốt Bánh Mì', group: 'Topping', unit: 'Phần', cost: 1000, retailPrice: 0 },
  ];

  const ingredientMap = {};
  for (const item of ingredients) {
    const p = await prisma.product.create({ data: item });
    ingredientMap[item.sku] = p.id;
    
    // Khởi tạo tồn kho mặc định là 10kg cho mỗi loại thịt/topping
    await prisma.inventory.create({
      data: {
        productId: p.id,
        initialStock: 10000,
        displayStock: 10000,
        cost: item.cost
      }
    });
  }

  // 2. Nhập Thành Phẩm (Menu)
  const products = [
    { sku: 'SP-BMSPEC', productName: 'Bánh Mì Đặc Biệt (Lớn)', group: 'Bánh Mì', unit: 'Ổ', cost: 0, retailPrice: 69000 },
    { sku: 'SP-BMSMALL', productName: 'Bánh Mì Zonzon (Nhỏ)', group: 'Bánh Mì', unit: 'Ổ', cost: 0, retailPrice: 50000 },
    { sku: 'SP-BMXAXIU', productName: 'Bánh Mì Xá Xíu', group: 'Bánh Mì', unit: 'Ổ', cost: 0, retailPrice: 60000 },
    { sku: 'SP-BMCHALUA', productName: 'Bánh Mì Chả Lụa', group: 'Bánh Mì', unit: 'Ổ', cost: 0, retailPrice: 60000 },
    { sku: 'SP-XOIMAN', productName: 'Xôi Mặn Zonzon', group: 'Xôi', unit: 'Phần', cost: 0, retailPrice: 40000 },
  ];

  const productMap = {};
  for (const item of products) {
    const p = await prisma.product.create({ data: item });
    productMap[item.sku] = p.id;
    
    await prisma.inventory.create({
      data: {
        productId: p.id,
        initialStock: 0, // Thành phẩm không có sẵn tồn kho
        displayStock: 0,
        retailPrice: item.retailPrice
      }
    });
  }

  // 3. Tạo Định Mức (Recipe/BOM)
  // Bánh Mì Đặc Biệt
  await prisma.recipe.create({
    data: {
      productId: productMap['SP-BMSPEC'],
      items: {
        create: [
          { componentId: ingredientMap['NL-BANHMI'], quantity: 1, unit: 'Cái' },
          { componentId: ingredientMap['NL-PATE'], quantity: 30, unit: 'g' },
          { componentId: ingredientMap['NL-BO'], quantity: 20, unit: 'g' },
          { componentId: ingredientMap['NL-XAXIU'], quantity: 30, unit: 'g' },
          { componentId: ingredientMap['NL-CHALUA'], quantity: 30, unit: 'g' },
          { componentId: ingredientMap['NL-JAMBON'], quantity: 20, unit: 'g' },
          { componentId: ingredientMap['NL-DABAODO'], quantity: 20, unit: 'g' },
          { componentId: ingredientMap['NL-CHABONG'], quantity: 15, unit: 'g' },
          { componentId: ingredientMap['NL-RAUDUA'], quantity: 1, unit: 'Phần' },
          { componentId: ingredientMap['NL-SOT'], quantity: 1, unit: 'Phần' },
        ]
      }
    }
  });

  // Bánh mì Xá Xíu
  await prisma.recipe.create({
    data: {
      productId: productMap['SP-BMXAXIU'],
      items: {
        create: [
          { componentId: ingredientMap['NL-BANHMI'], quantity: 1, unit: 'Cái' },
          { componentId: ingredientMap['NL-PATE'], quantity: 20, unit: 'g' },
          { componentId: ingredientMap['NL-BO'], quantity: 15, unit: 'g' },
          { componentId: ingredientMap['NL-XAXIU'], quantity: 70, unit: 'g' },
          { componentId: ingredientMap['NL-RAUDUA'], quantity: 1, unit: 'Phần' },
          { componentId: ingredientMap['NL-SOT'], quantity: 1, unit: 'Phần' },
        ]
      }
    }
  });

  // Xôi Mặn
  await prisma.recipe.create({
    data: {
      productId: productMap['SP-XOIMAN'],
      items: {
        create: [
          { componentId: ingredientMap['NL-XOI'], quantity: 1, unit: 'Phần' },
          { componentId: ingredientMap['NL-PATE'], quantity: 20, unit: 'g' },
          { componentId: ingredientMap['NL-XAXIU'], quantity: 35, unit: 'g' },
          { componentId: ingredientMap['NL-CHALUA'], quantity: 35, unit: 'g' },
          { componentId: ingredientMap['NL-CHABONG'], quantity: 10, unit: 'g' },
        ]
      }
    }
  });

  console.log("Seeding Hoàn Tất! Đã thêm toàn bộ menu Zonzon.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
