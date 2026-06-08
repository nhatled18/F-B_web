import React, { useState } from 'react';
import { transactionService } from '../Services/TransactionServices';
import "../assets/styles/Common.css";

function AdjustmentForm({ products = [], currentUser, onComplete }) {
  const [formData, setFormData] = useState({
    productName: '',
    sku: '',
    quantity: '',
    reason: 'damaged',
    note: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredProducts = products.filter(p => {
    const term = formData.productName?.toLowerCase() || '';
    return (
      p.productName?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term)
    );
  });

  const handleSelectProduct = (product) => {
    setFormData({
      ...formData,
      productName: product.productName,
      sku: product.sku
    });
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (name === 'productName') {
      setShowSuggestions(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!formData.productName || !formData.quantity || !formData.reason) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    if (Number(formData.quantity) <= 0) {
      setMessage({ type: 'error', text: 'Số lượng phải > 0' });
      return;
    }

    setLoading(true);

    try {
      const response = await transactionService.createAdjustment({
        productName: formData.productName,
        sku: formData.sku,
        quantity: Number(formData.quantity),
        reason: formData.reason,
        note: formData.note
      });

      setMessage({
        type: 'success',
        text: `✅ ${response.data.message}\n\nTồn kho: ${response.data.data.previousStock} → ${response.data.data.newStock}`
      });

      // Reset form
      setFormData({
        productName: '',
        sku: '',
        quantity: '',
        reason: 'damaged',
        note: ''
      });

      // Callback
      if (onComplete) onComplete();

      // Clear message after 5s
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adjustment-form-container">
      <div className="adjustment-header">
        <h2>📦 Điều Chỉnh Kho Hàng</h2>
        <p>Xử lý hàng hư, mất hoặc điều chỉnh tồn kho</p>
      </div>

      {message && (
        <div className={`message-box ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="adjustment-form">
        {/* Product Selection */}
        <div className="form-group">
          <label className="form-label">Sản Phẩm *</label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Tìm kiếm sản phẩm..."
            className="form-input"
            required
            disabled={loading}
          />

          {showSuggestions && filteredProducts.length > 0 && (
            <div className="suggestions-list">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="suggestion-item"
                  onClick={() => handleSelectProduct(product)}
                >
                  <span className="product-name">{product.productName}</span>
                  <span className="product-sku">{product.sku}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SKU */}
        <div className="form-group">
          <label className="form-label">SKU</label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            placeholder="SKU (tự động điền)"
            className="form-input"
            disabled={loading}
            readOnly
          />
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label className="form-label">Số Lượng Điều Chỉnh *</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder="Nhập số lượng (>0)"
            className="form-input"
            min="1"
            required
            disabled={loading}
          />
        </div>

        {/* Reason */}
        <div className="form-group">
          <label className="form-label">Lý Do *</label>
          <select
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            className="form-input"
            required
            disabled={loading}
          >
            <option value="damaged">🔨 Hàng Hư</option>
            <option value="lost">🔍 Hàng Mất</option>
            <option value="adjust">⚙️ Điều Chỉnh Tồn Kho</option>
          </select>
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label">Ghi Chú</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleInputChange}
            placeholder="Mô tả chi tiết (tùy chọn)"
            className="form-input"
            rows="3"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-submit"
          disabled={loading}
        >
          {loading ? '⏳ Đang xử lý...' : '✅ Điều Chỉnh Kho'}
        </button>
      </form>

      <style>{`
        .adjustment-form-container {
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 700px;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .adjustment-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .adjustment-header h2 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 24px;
          font-weight: 700;
        }

        .adjustment-header p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .message-box {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .message-box.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .message-box.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #ef4444;
        }

        .adjustment-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .suggestions-list {
          position: absolute;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-top: 4px;
          z-index: 10;
          max-height: 200px;
          overflow-y: auto;
          width: calc(100% - 40px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .suggestion-item {
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          gap: 8px;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.2s;
        }

        .suggestion-item:hover {
          background: #f8fafc;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .product-name {
          flex: 1;
          font-weight: 500;
          color: #1e293b;
        }

        .product-sku {
          font-size: 12px;
          color: #94a3b8;
        }

        .btn-submit {
          padding: 14px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default AdjustmentForm;