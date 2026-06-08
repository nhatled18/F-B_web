import React, { useState, useEffect } from 'react';
import { Plus, Check, X, RefreshCw } from 'lucide-react';
import { wastageService } from '../Services/WastageServices';
import '../assets/styles/Common.css';

function WastageTab({ products }) {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Form states
  const [reason, setReason] = useState('');
  const [items, setItems] = useState([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    fetchSlips();
  }, []);

  const fetchSlips = async () => {
    try {
      setLoading(true);
      const res = await wastageService.getAll();
      setSlips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!productId || !quantity || quantity <= 0) return alert('Dữ liệu không hợp lệ');
    const product = products.find(p => p.id === Number(productId));
    setItems([...items, { productId: Number(productId), quantity: Number(quantity), product }]);
    setProductId('');
    setQuantity('');
  };

  const removeItem = (idx) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
  };

  const handleCreate = async () => {
    if (items.length === 0) return alert('Phiếu không có sản phẩm nào');
    try {
      setLoading(true);
      await wastageService.create({ reason, items });
      alert('Tạo phiếu xuất hủy thành công, chờ quản lý duyệt');
      setShowCreate(false);
      setReason('');
      setItems([]);
      fetchSlips();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Bạn có chắc muốn duyệt phiếu này? Kho sẽ bị trừ ngay lập tức.')) return;
    try {
      await wastageService.approve(id);
      alert('Đã duyệt phiếu');
      fetchSlips();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Bạn muốn từ chối phiếu này?')) return;
    try {
      await wastageService.reject(id);
      alert('Đã từ chối phiếu');
      fetchSlips();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="tab-pane active">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Quản Lý Thất Thoát</h2>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Quay lại danh sách' : '+ Tạo Phiếu Xuất Hủy'}
        </button>
      </div>

      {showCreate ? (
        <div className="card">
          <div className="card-header">
            <h3>Tạo Phiếu Xuất Hủy Mới</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Lý do xuất hủy chung:</label>
              <input type="text" className="form-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="VD: Hàng hết hạn, rơi vỡ..." />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label>Sản phẩm bị hỏng:</label>
                <select className="form-input" value={productId} onChange={e => setProductId(e.target.value)}>
                  <option value="">-- Chọn --</option>
                  {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.productName}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Số lượng:</label>
                <input type="number" className="form-input" value={quantity} onChange={e => setQuantity(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={addItem} style={{ height: '42px' }}>Thêm</button>
            </div>

            <table className="data-table" style={{ marginTop: '20px' }}>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Số lượng hủy</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product?.productName}</td>
                    <td>{item.quantity}</td>
                    <td><button className="action-btn text-danger" onClick={() => removeItem(idx)}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn-primary" onClick={handleCreate} disabled={loading}>Lưu Phiếu (Chờ Duyệt)</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Danh Sách Phiếu Yêu Cầu</h3>
            <button className="action-btn" onClick={fetchSlips}><RefreshCw size={16} /> Làm mới</button>
          </div>
          <div className="card-body">
            {loading ? <p>Đang tải...</p> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã Phiếu</th>
                    <th>Ngày Tạo</th>
                    <th>Người Báo Cáo</th>
                    <th>Lý do</th>
                    <th>Sản Phẩm (SL)</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác (Quản lý)</th>
                  </tr>
                </thead>
                <tbody>
                  {slips.length === 0 ? <tr><td colSpan="7" className="text-center">Chưa có phiếu xuất hủy nào</td></tr> : slips.map(slip => (
                    <tr key={slip.id}>
                      <td>{slip.slipCode}</td>
                      <td>{new Date(slip.createdAt).toLocaleString()}</td>
                      <td>{slip.reporter?.username || 'System'}</td>
                      <td>{slip.reason}</td>
                      <td>
                        <ul style={{ paddingLeft: '15px', margin: 0 }}>
                          {slip.items.map(i => (
                            <li key={i.id}>{i.product?.productName} - SL: <strong style={{color:'red'}}>{i.quantity}</strong></li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                          background: slip.status === 'pending' ? '#fef08a' : slip.status === 'approved' ? '#bbf7d0' : '#fecaca',
                          color: slip.status === 'pending' ? '#854d0e' : slip.status === 'approved' ? '#166534' : '#991b1b'
                        }}>
                          {slip.status === 'pending' ? 'Chờ duyệt' : slip.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                        </span>
                      </td>
                      <td>
                        {slip.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button className="action-btn" style={{ color: '#10b981' }} onClick={() => handleApprove(slip.id)} title="Duyệt"><Check size={18} /></button>
                            <button className="action-btn" style={{ color: '#ef4444' }} onClick={() => handleReject(slip.id)} title="Từ chối"><X size={18} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WastageTab;
