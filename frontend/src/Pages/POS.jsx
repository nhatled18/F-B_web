import React, { useState, useEffect } from 'react';
import apiClient from '../API/apiClient';
import './POS.css';

const POS = ({ onLogout }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [source, setSource] = useState('at_store');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shift, setShift] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCurrentShift();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/products');
      setProducts(res.data.products || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurrentShift = async () => {
    try {
      const res = await apiClient.get('/pos/shift/current');
      setShift(res.data.shift);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product) => {
    setCart([...cart, { ...product, cartId: Date.now(), quantity: 1, options: [] }]);
  };

  const updateQuantity = (cartId, delta) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const toggleOption = (cartId, optionSku) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        const hasOption = item.options.find(o => o.option_id === optionSku);
        let newOptions;
        if (hasOption) {
          newOptions = item.options.filter(o => o.option_id !== optionSku);
        } else {
          newOptions = [...item.options, { option_id: optionSku, quantity: 1 }];
        }
        return { ...item, options: newOptions };
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.retailPrice * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        source,
        paymentMethod,
        totalAmount,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.retailPrice,
          options: item.options
        }))
      };

      await apiClient.post('/pos/orders', payload);
      
      // In hóa đơn (Kích hoạt @media print)
      window.print();
      
      // Reset giỏ hàng
      setCart([]);
      alert("Thanh toán thành công!");
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async () => {
    try {
      const amount = prompt("Nhập số tiền mặt đầu ca (VNĐ):", "0");
      if (amount !== null) {
        await apiClient.post('/pos/shift/open', { startAmount: Number(amount) });
        fetchCurrentShift();
      }
    } catch (err) {
      alert("Lỗi mở ca");
    }
  };

  const handleCloseShift = async () => {
    try {
      const amount = prompt("Nhập số tiền mặt thực tế trong két (VNĐ):", "0");
      if (amount !== null) {
        const res = await apiClient.post('/pos/shift/close', { endAmountReal: Number(amount) });
        alert(res.data.differenceAlert);
        setShift(null);
      }
    } catch (err) {
      alert("Lỗi chốt ca");
    }
  };

  return (
    <div className="pos-container">
      {/* KHU VỰC IN BILL (Chỉ hiển thị khi in) */}
      <div className="print-area">
        <div className="customer-bill">
          <h2>ZON ZON - Liên Khách</h2>
          <p>Nguồn: {source}</p>
          <ul>
            {cart.map(item => (
              <li key={item.cartId}>
                {item.productName} x{item.quantity} - {item.retailPrice * item.quantity}đ
              </li>
            ))}
          </ul>
          <h3>Tổng: {totalAmount}đ</h3>
          <p>Cảm ơn quý khách!</p>
        </div>
        <div className="kitchen-bill">
          <h2>ZON ZON - Liên Bếp</h2>
          <ul>
            {cart.map(item => (
              <li key={item.cartId}>
                <h3>{item.productName} x{item.quantity}</h3>
                {item.options.length > 0 && (
                  <p>Ghi chú: {item.options.map(o => o.option_id).join(', ')}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* GIAO DIỆN CHÍNH */}
      <div className="pos-main">
        <div className="pos-header">
          <h2>BÁN HÀNG TẠI QUẦY</h2>
          <div className="shift-controls">
            <button className="btn-logout" style={{ marginRight: '10px' }} onClick={onLogout}>🚪 Đăng xuất</button>
            {!shift ? (
              <button onClick={handleOpenShift} className="btn-open-shift">Mở Ca</button>
            ) : (
              <button onClick={handleCloseShift} className="btn-close-shift">Chốt Ca</button>
            )}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="pos-grid">
          {products.map(p => (
            <button key={p.id} className="product-btn" onClick={() => addToCart(p)}>
              <span className="p-name">{p.productName}</span>
              <span className="p-price">{p.retailPrice}đ</span>
            </button>
          ))}
        </div>
      </div>

      {/* GIỎ HÀNG */}
      <div className="pos-cart">
        <h3>Giỏ Hàng</h3>
        <div className="cart-options">
          <select value={source} onChange={e => setSource(e.target.value)}>
            <option value="at_store">Tại quán</option>
            <option value="take_away">Mang đi</option>
            <option value="grab">Grab</option>
            <option value="shopeefood">ShopeeFood</option>
          </select>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="cash">Tiền mặt</option>
            <option value="banking">Chuyển khoản</option>
          </select>
        </div>

        <div className="cart-items">
          {cart.map(item => (
            <div key={item.cartId} className="cart-item">
              <div className="item-info">
                <h4>{item.productName}</h4>
                <div className="qty-controls">
                  <button onClick={() => updateQuantity(item.cartId, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cartId, 1)}>+</button>
                </div>
                <span className="item-total">{item.retailPrice * item.quantity}đ</span>
                <button className="btn-remove" onClick={() => removeFromCart(item.cartId)}>X</button>
              </div>
              <div className="kitchen-notes">
                <label>
                  <input 
                    type="checkbox" 
                    checked={item.options.some(o => o.option_id === 'PATE')}
                    onChange={() => toggleOption(item.cartId, 'PATE')}
                  /> Thêm Pate
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={item.options.some(o => o.option_id === 'KHONG_CAY')}
                    onChange={() => toggleOption(item.cartId, 'KHONG_CAY')}
                  /> Không cay
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <div className="total-row">
            <span>Tổng tiền:</span>
            <span className="total-amount">{totalAmount}đ</span>
          </div>
          <button 
            className="btn-checkout" 
            onClick={handleCheckout}
            disabled={loading || cart.length === 0 || !shift}
          >
            {loading ? 'Đang xử lý...' : (!shift ? 'VUI LÒNG MỞ CA' : 'THANH TOÁN & IN BILL')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
