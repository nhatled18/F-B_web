import React, { useState } from 'react';

function ProductInventoryForm({ onSubmit, onCancel, products }) {
  const [formData, setFormData] = useState({
    productId: '',
    stockType1: '',
    stockType2: '',
    retailPrice: 0,
    cost: 0,
    initialStock: 0,
    displayStock: 0,  // ✅ Trưng bày
    stockIn: 0,       // ✅ Tổng nhập
    stockOut: 0,      // ✅ Tổng xuất
    damaged: 0,       // ✅ Hỏng/Lỗi
    endingStock: 0,
    note: ''
  });

  // ✅ Auto calculate: initialStock + stockIn - stockOut - damaged
  const calculateEndingStock = (initial, stockIn, stockOut, damaged) => {
    return Number(initial) + Number(stockIn) - Number(stockOut) - Number(damaged);
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    
    // Auto calculate ending stock when relevant fields change
    if (['initialStock', 'stockIn', 'stockOut', 'damaged'].includes(field)) {
      newData.endingStock = calculateEndingStock(
        newData.initialStock,
        newData.stockIn,
        newData.stockOut,
        newData.damaged
      );
    }
    
    setFormData(newData);
  };

  const handleSubmit = () => {
    if (!formData.productId) {
      alert('Vui lòng chọn sản phẩm!');
      return;
    }
    
    onSubmit({
      ...formData,
      retailPrice: Number(formData.retailPrice),
      cost: Number(formData.cost),
      initialStock: Number(formData.initialStock),
      displayStock: Number(formData.displayStock),
      stockIn: Number(formData.stockIn),
      stockOut: Number(formData.stockOut),
      damaged: Number(formData.damaged),
      endingStock: Number(formData.endingStock)
    });
    
    // Reset form
    setFormData({ 
      productId: '',
      stockType1: '',
      stockType2: '',
      retailPrice: 0,
      cost: 0,
      initialStock: 0,
      displayStock: 0,
      stockIn: 0,
      stockOut: 0,
      damaged: 0,
      endingStock: 0,
      note: ''
    });
  };

  return (
    <div className="form-box">
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#1a1a1a' }}>
        Thêm tồn kho sản phẩm
      </h3>
      
      <div className="form-grid">
        {/* Chọn sản phẩm */}
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Chọn sản phẩm *</label>
          <select
            value={formData.productId}
            onChange={(e) => handleChange('productId', e.target.value)}
            className="form-input"
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.sku} - {product.productName}
              </option>
            ))}
          </select>
        </div>
        
        {/* Phân loại kho */}
        <div className="form-group">
          <label className="form-label">Phân loại kho</label>
          <input
            type="text"
            value={formData.stockType1}
            onChange={(e) => handleChange('stockType1', e.target.value)}
            className="form-input"
            placeholder="Nhập phân loại kho"
          />
        </div>
        
        {/* Phân loại chi tiết */}
        <div className="form-group">
          <label className="form-label">Phân loại chi tiết</label>
          <input
            type="text"
            value={formData.stockType2}
            onChange={(e) => handleChange('stockType2', e.target.value)}
            className="form-input"
            placeholder="Nhập phân loại chi tiết"
          />
        </div>
        
        {/* Giá niêm yết */}
        <div className="form-group">
          <label className="form-label">Giá niêm yết (VNĐ)</label>
          <input
            type="number"
            value={formData.retailPrice}
            onChange={(e) => handleChange('retailPrice', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
          />
        </div>
        
        {/* Giá vốn */}
        <div className="form-group">
          <label className="form-label">Giá vốn (VNĐ)</label>
          <input
            type="number"
            value={formData.cost}
            onChange={(e) => handleChange('cost', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
          />
        </div>
        
        {/* Tồn kho đầu */}
        <div className="form-group">
          <label className="form-label">Tồn kho đầu</label>
          <input
            type="number"
            value={formData.initialStock}
            onChange={(e) => handleChange('initialStock', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
          />
        </div>
        
        {/* ✅ Trưng bày - displayStock */}
        <div className="form-group">
          <label className="form-label">Trưng bày</label>
          <input
            type="number"
            value={formData.displayStock}
            onChange={(e) => handleChange('displayStock', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
          />
        </div>
        
        {/* ✅ Tổng nhập - stockIn */}
        <div className="form-group">
          <label className="form-label">Tổng nhập</label>
          <input
            type="number"
            value={formData.stockIn}
            onChange={(e) => handleChange('stockIn', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
          />
        </div>
        
        {/* ✅ Tổng xuất - stockOut */}
        <div className="form-group">
          <label className="form-label">Tổng xuất</label>
          <input
            type="number"
            value={formData.stockOut}
            onChange={(e) => handleChange('stockOut', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
          />
        </div>
        
        {/* ✅ Hỏng/Lỗi - damaged */}
        <div className="form-group">
          <label className="form-label">Hỏng/Lỗi</label>
          <input
            type="number"
            value={formData.damaged}
            onChange={(e) => handleChange('damaged', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
          />
        </div>
        
        {/* ✅ Tồn kho cuối - Auto calculated */}
        <div className="form-group">
          <label className="form-label">Tồn kho</label>
          <input
            type="number"
            value={formData.endingStock}
            readOnly
            className="form-input"
            placeholder="0"
            style={{ 
              backgroundColor: '#f3f4f6', 
              cursor: 'not-allowed',
              fontWeight: '600',
              color: formData.endingStock < 0 ? '#dc2626' : '#059669'
            }}
          />
        </div>
        
        {/* Ghi chú */}
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Ghi chú</label>
          <input
            type="text"
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            className="form-input"
            placeholder="Nhập ghi chú"
          />
        </div>
      </div>

      {/* Formula Display */}
      <div style={{ 
        padding: '12px 16px', 
        background: '#eff6ff', 
        borderRadius: '6px',
        marginTop: '16px',
        marginBottom: '16px',
        border: '1px solid #bfdbfe'
      }}>
        <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: '500' }}>
          📊 Công thức: Tồn kho đầu + Tổng nhập - Tổng xuất - Hỏng/Lỗi
        </div>
        <div style={{ fontSize: '14px', color: '#1e3a8a', marginTop: '4px', fontWeight: '600' }}>
          {formData.initialStock} + {formData.stockIn} - {formData.stockOut} - {formData.damaged} = {formData.endingStock}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex">
        <button className="btn-primary btn-success" onClick={handleSubmit}>
          💾 Lưu
        </button>
        <button className="btn-secondary" onClick={onCancel}>
          ❌ Hủy
        </button>
      </div>
    </div>
  );
}

export default ProductInventoryForm;