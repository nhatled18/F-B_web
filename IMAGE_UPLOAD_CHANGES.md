# 🖼️ Cập nhật: Hệ thống quản lý hình ảnh sản phẩm

## 📝 Tóm tắt thay đổi

Hệ thống F&B Inventory đã được cập nhật với tính năng quản lý hình ảnh sản phẩm hoàn chỉnh.

### ✨ Tính năng mới

1. **✂️ Cắt hình từ ảnh menu**
   - Sử dụng công cụ cắt hình tích hợp
   - Vẽ vùng cắt trên ảnh menu
   - Tải lên tự động

2. **📸 Upload hình ảnh sản phẩm**
   - Upload khi tạo sản phẩm mới
   - Upload cho sản phẩm đã có
   - Hỗ trợ các định dạng: JPG, PNG, GIF, WEBP

3. **🖼️ Hiển thị hình ảnh**
   - Xem hình ảnh trong danh sách sản phẩm
   - Preview khi chỉnh sửa
   - Tối ưu hóa hiệu suất

## 🔧 Những file được thay đổi/thêm mới

### Backend (Node.js/Express)

| File | Thay đổi |
|------|---------|
| `backend/prisma/schema.prisma` | ✅ Thêm trường `imageUrl` vào model `Product` |
| `backend/src/Controller/productController.js` | ✅ Thêm method `uploadImage()` |
| `backend/src/routes/productRoutes.js` | ✅ Thêm route `POST /:id/image` |
| `backend/prisma/migrations/add_image_url/` | ✅ Migration file (tạo mới) |

### Frontend (React)

| File | Thay đổi |
|------|---------|
| `frontend/src/Services/ProductImageService.js` | ✅ Service mới để quản lý upload |
| `frontend/src/Components/ProductForm.jsx` | ✅ Thêm input file upload + preview |
| `frontend/src/Components/ProductTable.jsx` | ✅ Thêm cột hình ảnh + nút upload/cắt |
| `frontend/src/Components/ProductImageCropper.jsx` | ✅ Component mới để cắt hình (canvas-based) |

### Tài liệu

| File | Nội dung |
|------|---------|
| `HUONG_DAN_THEM_HINH_ANH.md` | Hướng dẫn sử dụng chi tiết |
| `IMAGE_UPLOAD_CHANGES.md` | Tài liệu này |

## 📦 Phụ thuộc

Không thêm package mới. Chỉ sử dụng:
- React (có sẵn)
- Node.js/Express (có sẵn)
- Prisma (có sẵn)
- Canvas API (native browser API)

## 🚀 Cách setup

### 1️⃣ Cập nhật Database

#### Nếu CLI Prisma hoạt động:
```bash
cd backend
npx prisma migrate dev --name add_image_url
```

#### Nếu lỗi, chạy thủ động:
```bash
cd backend
npx prisma migrate resolve --applied add_image_url
npx prisma generate
```

#### Nếu vẫn lỗi, chạy SQL thủ động:
```sql
-- Chạy trực tiếp trên SQLite database
ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT NOT NULL DEFAULT '';
```

### 2️⃣ Khởi động ứng dụng

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

## 💾 API Endpoints

### Upload hình ảnh
```
POST /api/products/:id/image
Content-Type: application/json

{
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": 1,
    "productName": "Special Banh Mi",
    "imageUrl": "data:image/jpeg;base64/...",
    ...
  }
}
```

## 🎨 Cấu trúc dữ liệu

### Product Model (Prisma)
```prisma
model Product {
  ...
  imageUrl    String   @default("")  // Base64 hoặc URL
  ...
}
```

## 📱 Giao diện người dùng

### Danh sách sản phẩm
- Thêm cột "Hình ảnh"
- Hiển thị thumbnail (80x80px)
- Nút 📸 để upload/cắt ảnh

### Form tạo sản phẩm
- Thêm input file upload
- Hiển thị preview trước lưu

### Modal cắt hình
- Canvas đơn giản với vẽ hình chữ nhật
- 2 lựa chọn: Cắt & Tải lên, hoặc Sử dụng ảnh gốc

## 🐛 Troubleshooting

### Lỗi: "Cannot find module 'E:\prisma\build\index.js'"
**Giải pháp:**
```bash
cd backend
npm install
npm ls prisma  # Kiểm tra cài đặt
```

### Hình ảnh không hiển thị
1. Kiểm tra database có trường `imageUrl` không
2. Kiểm tra dữ liệu trong `product.imageUrl` có base64 không
3. Xem browser console có lỗi gì không

### Upload không thành công
1. Kiểm tra kích thước file (< 5MB)
2. Kiểm tra định dạng (JPG, PNG, GIF, WEBP)
3. Kiểm tra backend API endpoint `/api/products/:id/image` hoạt động không

## 🔄 Cách xoá hình ảnh

Chỉnh sửa sản phẩm → Xóa nội dung imageUrl → Lưu

## 📊 Hiệu suất

- Base64 images được lưu trực tiếp trong database
- Không có file server bổ sung
- Kích thước database tăng theo lượng ảnh
- Nên tối ưu ảnh trước khi upload (compress)

## 🔐 Bảo mật

- Kiểm tra loại file trước upload (whitelist: JPG, PNG, GIF, WEBP)
- Giới hạn kích thước (5MB)
- Không thực hiện injection hay eval trên imageUrl

## 📝 Ghi chú

- Canvas API không hỗ trợ trên Internet Explorer cũ
- Sử dụng base64 có thể làm database lớn nhanh hơn
- Nếu muốn optimized hơn, có thể chuyển sang cloud storage (AWS S3, etc.)

## 🎯 Tiếp theo (Optional)

- [ ] Thêm compression trước khi lưu
- [ ] Tích hợp cloud storage (AWS S3, Firebase)
- [ ] Thêm editor hình (filters, effects)
- [ ] Bulk upload

---

**Phiên bản**: 1.0.0  
**Ngày cập nhật**: 2026-06-05  
**Author**: F&B Inventory Dev Team
