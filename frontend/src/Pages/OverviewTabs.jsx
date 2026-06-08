// pages/OverviewTab.jsx
import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import "../assets/styles/Overview.css";
import "../assets/styles/Common.css";
import { formatCurrency } from '../utils/helper';

function OverviewTab({ products, transactions }) {
  // Tính toán các chỉ số chính
  const totalValue = useMemo(() => 
    products.reduce((sum, p) => sum + (p.quantity * p.cost), 0), [products]
  );
  
  const lowStockProducts = useMemo(() => 
    products.filter(p => p.quantity <= p.minStock), [products]
  );
  
  const outOfStockProducts = useMemo(() => 
    products.filter(p => p.quantity === 0), [products]
  );
  
  const totalCategories = useMemo(() => 
    [...new Set(products.map(p => p.category))].length, [products]
  );

  // Tính toán thống kê giao dịch
  const totalTransactions = transactions?.length || 0;
  const totalTransactionValue = useMemo(() => 
    transactions?.reduce((sum, t) => sum + (t.quantityChange * t.unitPrice), 0) || 0, [transactions]
  );

  // Dữ liệu cho biểu đồ theo danh mục
  const categoryData = useMemo(() => {
    const categories = {};
    products.forEach(p => {
      if (!categories[p.category]) {
        categories[p.category] = { name: p.category, value: 0, count: 0 };
      }
      categories[p.category].value += p.quantity * p.cost;
      categories[p.category].count += p.quantity;
    });
    return Object.values(categories).slice(0, 6);
  }, [products]);

  // Dữ liệu cho biểu đồ nhập vs xuất (5 ngày)
  const importExportData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [
        { name: 'Hôm nay', import: 0, export: 0 },
        { name: 'Hôm qua', import: 0, export: 0 },
        { name: 'T7', import: 0, export: 0 },
        { name: 'T6', import: 0, export: 0 },
        { name: 'T5', import: 0, export: 0 }
      ];
    }
    
    const last5Days = {};
    const today = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' });
      last5Days[dateStr] = { import: 0, export: 0 };
    }

    transactions.slice(-50).forEach(t => {
      const date = new Date(t.date);
      const dateStr = date.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' });
      if (last5Days.hasOwnProperty(dateStr)) {
        // Kiểm tra trường type: 'import' hoặc 'export'
        const isImport = t.type === 'import' || t.type?.toLowerCase() === 'import';
        if (isImport) {
          last5Days[dateStr].import += Math.abs(t.quantity || 0);
        } else {
          last5Days[dateStr].export += Math.abs(t.quantity || 0);
        }
      }
    });

    return Object.entries(last5Days).map(([name, data]) => ({ name, ...data }));
  }, [transactions]);

  // Dữ liệu phân bố nhập/xuất
  const transactionTypeData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [
        { name: 'Nhập Hàng', value: 0, color: '#10b981' },
        { name: 'Xuất Hàng', value: 0, color: '#ef4444' }
      ];
    }

    let importQty = 0;
    let exportQty = 0;

    transactions.slice(-50).forEach(t => {
      const isImport = t.type === 'import' || t.type?.toLowerCase() === 'import';
      if (isImport) {
        importQty += Math.abs(t.quantity || 0);
      } else {
        exportQty += Math.abs(t.quantity || 0);
      }
    });

    return [
      { name: 'Nhập Hàng', value: importQty, color: '#10b981' },
      { name: 'Xuất Hàng', value: exportQty, color: '#ef4444' }
    ];
  }, [transactions]);

  // Dữ liệu sản phẩm có doanh thu cao (Revenue)
  const revenueByProduct = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const revenueMap = {};
    transactions.forEach(t => {
      // Chỉ tính doanh thu từ xuất hàng (export)
      const isExport = t.type === 'export' || t.type?.toLowerCase() === 'export';
      if (isExport) {
        const productName = t.productName || t.product?.productName || 'Không xác định';
        if (!revenueMap[productName]) {
          revenueMap[productName] = 0;
        }
        revenueMap[productName] += Math.abs(t.quantity || 0) * (t.unitPrice || 0);
      }
    });

    return Object.entries(revenueMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, revenue]) => ({ name, revenue }));
  }, [transactions]);

  // Dữ liệu cho biểu đồ tình trạng tồn kho
  const stockStatusData = useMemo(() => [
    { name: 'Đủ hàng', value: products.length - lowStockProducts.length, color: '#10b981' },
    { name: 'Cảnh báo', value: lowStockProducts.length - outOfStockProducts.length, color: '#f59e0b' },
    { name: 'Hết hàng', value: outOfStockProducts.length, color: '#ef4444' }
  ], [products, lowStockProducts, outOfStockProducts]);

  // Sản phẩm bán chạy nhất
  const topProducts = useMemo(() => {
    if (!transactions) return [];
    const productSales = {};
    transactions.forEach(t => {
      if (!productSales[t.productName]) {
        productSales[t.productName] = 0;
      }
      productSales[t.productName] += Math.abs(t.quantityChange);
    });
    return Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));
  }, [transactions]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="overview-container">
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-info">
              <h3>Tổng Số Sản Phẩm</h3>
              <p className="stat-value">{products.length}</p>
            </div>
            <div className="stat-icon blue">📦</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-info">
              <h3>Tổng Giá Trị Kho</h3>
              <p className="stat-value-large">{formatCurrency(totalValue)}</p>
            </div>
            <div className="stat-icon green">💰</div>
          </div>
        </div>
        
        <div className="stat-card alert">
          <div className="stat-header">
            <div className="stat-info">
              <h3>Sản Phẩm Cảnh Báo</h3>
              <p className="stat-value warning">{lowStockProducts.length}</p>
            </div>
            <div className="stat-icon red">⚠️</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-info">
              <h3>Danh Mục Sản Phẩm</h3>
              <p className="stat-value">{totalCategories}</p>
            </div>
            <div className="stat-icon yellow">🏷️</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-info">
              <h3>Tổng Giao Dịch</h3>
              <p className="stat-value">{totalTransactions}</p>
            </div>
            <div className="stat-icon purple">📊</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-info">
              <h3>Hết Hàng</h3>
              <p className="stat-value danger">{outOfStockProducts.length}</p>
            </div>
            <div className="stat-icon danger">🚫</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        {/* Biểu đồ nhập vs xuất hàng */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Nhập vs Xuất Hàng (5 Ngày Gần Đây)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={importExportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="import" fill="#10b981" name="Nhập Hàng" radius={[8, 8, 0, 0]} />
              <Bar dataKey="export" fill="#ef4444" name="Xuất Hàng" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ phân bố nhập/xuất */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Tỷ Lệ Nhập/Xuất</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={transactionTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {transactionTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-row">
        {/* Biểu đồ doanh thu theo sản phẩm */}
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3>💰 Sản Phẩm Có Doanh Thu Cao Nhất</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByProduct}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="revenue" fill="#667eea" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        {/* Sản phẩm bán chạy */}
        <div className="info-card">
          <div className="card-header">
            <h3>🔥 Sản Phẩm Bán Chạy Nhất</h3>
          </div>
          <div className="product-list">
            {topProducts.length > 0 ? (
              topProducts.map((product, idx) => (
                <div key={idx} className="product-item">
                  <div className="product-rank">#{idx + 1}</div>
                  <div className="product-details">
                    <p className="product-name">{product.name}</p>
                    <p className="product-quantity">{product.quantity} giao dịch</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">Chưa có dữ liệu giao dịch</p>
            )}
          </div>
        </div>

        {/* Cảnh báo tồn kho */}
        <div className="info-card alert-card">
          <div className="card-header">
            <h3>⚠️ Sản Phẩm Cần Nhập Hàng</h3>
          </div>
          <div className="product-list">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 5).map((product, idx) => (
                <div key={idx} className="product-item warning-item">
                  <div className="product-name-badge">{product.name}</div>
                  <div className="stock-info">
                    <span className="current-stock">Hiện tại: {product.quantity}</span>
                    <span className="min-stock">Min: {product.minStock}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state success">✓ Tất cả sản phẩm đều đủ hàng</p>
            )}
          </div>
        </div>

        {/* Gợi ý hành động */}
        <div className="info-card tips-card">
          <div className="card-header">
            <h3>💡 Gợi Ý Hành Động</h3>
          </div>
          <div className="tips-list">
            {outOfStockProducts.length > 0 && (
              <div className="tip-item danger-tip">
                <span className="tip-icon">🚫</span>
                <p>Có <strong>{outOfStockProducts.length}</strong> sản phẩm hết hàng - Ưu tiên nhập hàng ngay</p>
              </div>
            )}
            {lowStockProducts.length > 3 && (
              <div className="tip-item warning-tip">
                <span className="tip-icon">⚠️</span>
                <p><strong>{lowStockProducts.length}</strong> sản phẩm sắp hết - Lên kế hoạch nhập hàng</p>
              </div>
            )}
            {totalValue > 10000000 && (
              <div className="tip-item info-tip">
                <span className="tip-icon">💰</span>
                <p>Tổng giá trị kho cao - Cân nhắc chiến lược bán hàng</p>
              </div>
            )}
            {products.length > 50 && (
              <div className="tip-item info-tip">
                <span className="tip-icon">📦</span>
                <p>Kho hàng có <strong>{products.length}</strong> SKU - Kiểm tra tồn kho thường xuyên</p>
              </div>
            )}
            {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
              <div className="tip-item success-tip">
                <span className="tip-icon">✓</span>
                <p>Tình trạng kho tốt - Hệ thống đang hoạt động bình thường</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;