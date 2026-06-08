# Hướng dẫn: Thêm hình ảnh sản phẩm ZONZON

## 🎯 Tổng quan

Hệ thống đã được cập nhật để hỗ trợ hiển thị hình ảnh cho từng sản phẩm. Bạn có thể:
- ✂️ **Cắt hình từ menu**: Sử dụng tool cắt hình để tách từng sản phẩm từ ảnh menu chung
- 📸 **Upload hình trực tiếp**: Upload hình ảnh sản phẩm khi tạo hoặc chỉnh sửa
- 🔄 **Quản lý hình ảnh**: Thay đổi hoặc cập nhật hình bất kỳ lúc nào

## 📋 Các sản phẩm ZONZON cần thêm hình

1. **Special Banh Mi (Large)** - 69.000Đ
2. **Zonzon Sticky Rice** - 40.000Đ
3. **Zonzon Banh Mi (Small)** - 50.000Đ
4. **Char-siu (Roast Pork) Banh Mi** - 60.000Đ
5. **Pork Roll Banh Mi** - 60.000Đ

## 🚀 Hướng dẫn sử dụng

### Cách 1: Cắt hình từ ảnh menu

1. **Mở danh sách sản phẩm** → Tab "Sản phẩm" → Tìm sản phẩm cần thêm hình
2. **Nhấn nút 📸** (icon camera) trong cột "Thao tác"
3. **Chọn file ảnh menu** từ máy tính
4. **Vẽ vùng cắt**: Kéo chuột để tạo hình chữ nhật quanh sản phẩm cần cắt
5. **Chọn hành động**:
   - ✂️ **Cắt & Tải lên**: Cắt phần được chọn (sau khi vẽ vùng cắt)
   - 📤 **Sử dụng ảnh gốc**: Dùng toàn bộ ảnh mà không cắt
6. **Xác nhận** khi thấy thông báo thành công ✅

### Cách 2: Upload hình khi tạo sản phẩm

1. **Nhấn nút "+ Thêm sản phẩm"**
2. **Điền đầy đủ thông tin sản phẩm**
3. **Scroll xuống** → Tìm mục "Hình ảnh sản phẩm"
4. **Nhấn để chọn file ảnh**
5. **Xem preview** để chắc chắn
6. **Nhấn "💾 Lưu"** để tạo sản phẩm (hình sẽ được tải lên tự động)

### Cách 3: Upload hình cho sản phẩm đã có

1. Tìm sản phẩm trong danh sách
2. **Nhấn nút 📸** 
3. Làm theo Cách 1 ở trên

## 🎨 Gợi ý

- **Định dạng hình ảnh**: JPG, PNG, GIF, WEBP
- **Kích thước tối đa**: 5MB
- **Tỷ lệ hình ảnh**: Nên sử dụng hình vuông (1:1) để hiển thị đẹp
- **Chất lượng**: Hình sắc nét, tốt sẽ giúp quán trông chuyên nghiệp

## ⚙️ Cần chú ý

Nếu bạn gặp lỗi "Cannot find module 'E:\prisma\build\index.js'" khi chạy migration, vui lòng:

1. **Chạy lại npm install**:
   ```powershell
   cd "e:\F&B Inventory\backend"
   npm install
   ```

2. **Kiểm tra node_modules**:
   ```powershell
   npm ls prisma
   ```

3. **Nếu vẫn lỗi**, liên hệ để khắc phục

## 📊 Xem hình ảnh đã upload

Các hình ảnh sẽ hiển thị:
- ✅ Trong **danh sách sản phẩm** (cột "Hình ảnh")
- ✅ Trong **form chỉnh sửa** (xem preview)
- ✅ Trên **menu/báo giá** (khi được liên kết)

## 🎬 Ví dụ sử dụng

### Thêm hình cho "Special Banh Mi (Large)"

```
1. Mở tab Sản phẩm
2. Tìm "Special Banh Mi (Large)" trong danh sách
3. Nhấn 📸 → Chọn file menu.png
4. Kéo chuột vẽ hình chữ nhật quanh chiếc bánh mì
5. Nhấn "✂️ Cắt & Tải lên"
6. ✅ Thành công! Hình đã được lưu
```

---

**Cần giúp đỡ?** Liên hệ quản trị viên hệ thống.
