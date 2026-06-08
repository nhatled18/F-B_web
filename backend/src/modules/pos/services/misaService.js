// Chức năng giả lập (Mock) gọi API hóa đơn điện tử MISA
// Cơ chế retry được mô phỏng đơn giản

class MisaService {
  async syncBill(order) {
    console.log(`[MISA Service] Đang chuẩn bị gửi hóa đơn ${order.orderCode}...`);
    
    // Giả lập cấu trúc dữ liệu yêu cầu của MISA AMIS
    const payload = {
      RefDate: new Date(),
      RefNo: order.orderCode,
      TotalAmount: order.totalAmount,
      JournalMemo: "Bán hàng POS",
      Items: order.items.map(item => ({
        ProductID: item.productId,
        Quantity: item.quantity,
        Amount: item.total
      }))
    };

    // Giả lập gửi API bất đồng bộ với tỷ lệ thành công 80%
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const isSuccess = Math.random() > 0.2;
        if (isSuccess) {
          console.log(`[MISA Service] Xuất hóa đơn ${order.orderCode} thành công!`);
          resolve(true);
        } else {
          console.error(`[MISA Service] Lỗi mạng MISA, xuất hóa đơn ${order.orderCode} thất bại. Sẽ thử lại sau.`);
          // Trong thực tế, có thể dùng Redis Queue (BullMQ) để tự động retry
          reject(new Error("MISA API Timeout"));
        }
      }, 1000);
    });
  }
}

export default new MisaService();
