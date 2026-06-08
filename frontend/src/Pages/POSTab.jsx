import React, { useState } from 'react';
import { ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import { posService } from '../Services/POSServices';
import '../assets/styles/Common.css';

function POSTab({ products, onTransactionComplete }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter out products that might be just ingredients, or let user pick any.
  // For simplicity, let's show all products. In real app, might filter by group.
  const posProducts = products.filter(p => p.retailPrice > 0);

  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { 
        productId: product.id, 
        productName: product.productName,
        price: product.retailPrice,
        quantity: 1 
      }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) return removeFromCart(productId);
    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Giỏ hàng trống');
    try {
      setLoading(true);
      await posService.checkout({ items: cart, totalAmount });
      alert('Thanh toán thành công! Hệ thống đã tự động trừ kho.');
      setCart([]);
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (err) {
      console.error('Lỗi thanh toán:', err);
      alert('Lỗi: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-pane active" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="section-header">
        <h2 className="section-title">POS Bán Hàng</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: '600px' }}>
        
        {/* Left: Product List */}
        <div className="card" style={{ flex: 2, overflowY: 'auto' }}>
          <div className="card-header">
            <h3>Danh sách món ăn / đồ uống</h3>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', padding: '15px' }}>
            {posProducts.length > 0 ? posProducts.map(p => (
              <div 
                key={p.id} 
                className="pos-product-card" 
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '15px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onClick={() => addToCart(p)}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🍔</div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#1e293b' }}>{p.productName}</h4>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#10b981' }}>
                  {p.retailPrice.toLocaleString()} đ
                </p>
              </div>
            )) : (
              <p>Chưa có sản phẩm nào có giá bán lẻ.</p>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={20} />
            <h3>Giỏ Hàng</h3>
          </div>
          <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
                <ShoppingCart size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
                <p>Chưa có món nào được chọn</p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {cart.map(item => (
                  <li key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{item.productName}</div>
                      <div style={{ color: '#64748b', fontSize: '13px' }}>{item.price.toLocaleString()} đ</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                        <button style={{ border: 'none', background: '#f1f5f9', padding: '4px 8px', cursor: 'pointer' }} onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                        <span style={{ padding: '0 10px', minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                        <button style={{ border: 'none', background: '#f1f5f9', padding: '4px 8px', cursor: 'pointer' }} onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                      </div>
                      <button className="action-btn text-danger" onClick={() => removeFromCart(item.productId)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div style={{ padding: '20px', borderTop: '2px dashed #e2e8f0', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              <span>Tổng Tiền:</span>
              <span style={{ color: '#ef4444' }}>{totalAmount.toLocaleString()} đ</span>
            </div>
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '15px', fontSize: '16px', display: 'flex', justifyContent: 'center', gap: '10px', background: '#10b981' }}
              disabled={cart.length === 0 || loading}
              onClick={handleCheckout}
            >
              {loading ? 'Đang xử lý...' : <><CheckCircle size={20} /> Thanh Toán</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POSTab;
