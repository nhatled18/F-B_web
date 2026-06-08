import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Save } from 'lucide-react';
import { stocktakeService } from '../Services/StocktakeServices';
import '../assets/styles/Common.css';

function StocktakeTab({ products, onTransactionComplete }) {
  const [stocktakes, setStocktakes] = useState([]);
  const [activeStocktake, setActiveStocktake] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStocktakes();
  }, []);

  const fetchStocktakes = async () => {
    try {
      setLoading(true);
      const res = await stocktakeService.getAll();
      setStocktakes(res.data);
      // find pending if any
      const pending = res.data.find(s => s.status === 'pending');
      setActiveStocktake(pending || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStocktake = async () => {
    if (activeStocktake) return alert('Đang có một phiếu kiểm kê chưa chốt. Vui lòng hoàn thành phiếu cũ trước.');
    if (!window.confirm('Hệ thống sẽ lấy số tồn kho hiện tại để tạo phiếu kiểm kê. Bạn có chắc chắn?')) return;
    
    try {
      setLoading(true);
      await stocktakeService.create({ note: `Kiểm kê ngày ${new Date().toLocaleDateString()}` });
      fetchStocktakes();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleItemCountChange = async (itemId, actualQty) => {
    try {
      const res = await stocktakeService.updateItem(itemId, { actualQuantity: actualQty });
      // Update local state without full reload
      const updated = res.data.updatedItem;
      setActiveStocktake(prev => {
        const newItems = prev.items.map(i => i.id === itemId ? { ...i, actualQuantity: updated.actualQuantity, difference: updated.difference } : i);
        return { ...prev, items: newItems };
      });
    } catch (err) {
      console.error('Lỗi lưu số đếm', err);
    }
  };

  const handleComplete = async () => {
    if (!activeStocktake) return;
    const hasUncounted = activeStocktake.items.some(i => i.actualQuantity === null);
    if (hasUncounted && !window.confirm('Có một số sản phẩm CHƯA được đếm. Bạn có chắc muốn chốt kho? (Độ lệch sẽ được tính bằng tồn kho hiện tại)')) return;
    
    try {
      setLoading(true);
      await stocktakeService.complete(activeStocktake.id);
      alert('Đã chốt kho thành công!');
      fetchStocktakes();
      if (onTransactionComplete) onTransactionComplete();
    } catch (err) {
      alert('Lỗi chốt kho: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-pane active">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Kiểm Kê Kho Cuối Ngày</h2>
        <button className="btn-primary" onClick={handleCreateStocktake} disabled={!!activeStocktake || loading}>
          + Bắt đầu Kiểm Kê Mới
        </button>
      </div>

      {!activeStocktake ? (
        <div className="card text-center" style={{ padding: '50px' }}>
          <CheckCircle size={48} color="#10b981" style={{ marginBottom: '20px' }} />
          <h3>Không có phiếu kiểm kê nào đang chờ.</h3>
          <p style={{ color: '#64748b' }}>Bấm nút "Bắt đầu Kiểm Kê Mới" ở góc trên để tạo phiếu kiểm kê.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Đang kiểm kê: Phiếu {activeStocktake.code}</h3>
              <small style={{ color: '#64748b' }}>Tạo lúc: {new Date(activeStocktake.createdAt).toLocaleString()}</small>
            </div>
            <button className="btn-primary" style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleComplete}>
              <Save size={18} /> Chốt Kho
            </button>
          </div>
          <div className="card-body">
            <p style={{ color: '#ef4444', fontStyle: 'italic', marginBottom: '15px' }}>
              * Lưu ý: Nhập số lượng thực tế đếm được vào cột "Tồn Thực Tế". Hệ thống tự động tính ra độ lệch và lưu lại.
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đơn Vị</th>
                  <th>Tồn Phần Mềm</th>
                  <th>Tồn Thực Tế (Đếm)</th>
                  <th>Độ Lệch</th>
                </tr>
              </thead>
              <tbody>
                {activeStocktake.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.product?.productName} ({item.product?.sku})</td>
                    <td>{item.product?.unit || '-'}</td>
                    <td>{item.systemQuantity}</td>
                    <td>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '100px', padding: '4px' }}
                        value={item.actualQuantity !== null ? item.actualQuantity : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          // We can debounce this in real life, but for now we'll trigger save on blur or explicitly
                          // Actually, saving on change might spam API, let's just trigger on onBlur
                        }}
                        onBlur={(e) => {
                          if (e.target.value !== '') handleItemCountChange(item.id, Number(e.target.value));
                        }}
                        placeholder="Nhập số..."
                      />
                    </td>
                    <td>
                      {item.difference !== null && item.difference !== undefined ? (
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: item.difference === 0 ? '#10b981' : item.difference < 0 ? '#ef4444' : '#f59e0b'
                        }}>
                          {item.difference > 0 ? `+${item.difference}` : item.difference}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Lịch sử kiểm kê */}
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header">
          <h3>Lịch sử kiểm kê gần đây</h3>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Phiếu</th>
                <th>Ngày Kiểm Kê</th>
                <th>Người Tạo</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {stocktakes.filter(s => s.status === 'completed').slice(0, 5).map(s => (
                <tr key={s.id}>
                  <td>{s.code}</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>{s.creator?.username || 'System'}</td>
                  <td><span style={{ color: '#10b981', fontWeight: 'bold' }}>Hoàn thành</span></td>
                </tr>
              ))}
              {stocktakes.filter(s => s.status === 'completed').length === 0 && (
                <tr><td colSpan="4" className="text-center">Chưa có lịch sử</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StocktakeTab;
