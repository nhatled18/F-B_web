import React, { useState } from 'react';

function ImportManagement({ 
  rows, 
  setRows, 
  products, 
  type = 'import',
  onSubmitAll,
  processing 
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null);

  const isImport = type === 'import';
  const lastColumnTitle = isImport ? 'NGUỒN NHẬP' : 'LÝ DO XUẤT';

  // Filter products for autocomplete
  const filteredProducts = products.filter(p => {
    const term = searchTerm?.toLowerCase() || "";
    return (
      (p.productName || "").toLowerCase().includes(term) ||
      (p.sku || "").toLowerCase().includes(term) ||
      (p.group || "").toLowerCase().includes(term)
    );
  });

  // Handle product selection
  const handleSelectProduct = (product, rowId) => {
    setRows(rows.map(row => row.id === rowId ? {
      ...row,
      sku: product.sku,
      productName: product.productName
    } : row));
    setShowSuggestions(false);
    setSearchTerm('');
    setEditingCell(null);
  };

  // Handle cell change
  const handleCellChange = (rowId, field, value) => {
    setRows(rows.map(row => row.id === rowId ? { ...row, [field]: value } : row));
  };

  // Calculate total
  const calculateTotal = (quantity, unitPrice) => {
    if (quantity && unitPrice) {
      return (parseFloat(quantity) * parseFloat(unitPrice)).toLocaleString('vi-VN');
    }
    return '';
  };

  // Add new row
  const handleAddRow = () => {
    setRows([...rows, {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      transactionCode: '',
      summary: '',
      createdBy: '',
      sku: '',
      productName: '',
      quantity: '',
      unitPrice: '',
      reason: '',
      note: ''
    }]);
  };

  // Delete row
  const handleDeleteRow = (rowId) => {
    if (rows.length === 1) {
      alert('Phải có ít nhất 1 dòng!');
      return;
    }
    setRows(rows.filter(r => r.id !== rowId));
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả dữ liệu?')) {
      setRows([{
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        transactionCode: '',
        summary: '',
        createdBy: '',
        sku: '',
        productName: '',
        quantity: '',
        unitPrice: '',
        reason: '',
        note: ''
      }]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Tổng: <strong>{rows.length}</strong> dòng | 
          Hợp lệ: <strong>{rows.filter(r => r.productName && r.quantity).length}</strong> dòng
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleClearAll}
            style={{
              padding: '8px 14px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🗑️ Xóa tất cả
          </button>
          <button
            onClick={handleAddRow}
            style={{
              padding: '8px 14px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ➕ Thêm dòng
          </button>
          <button
            onClick={onSubmitAll}
            disabled={processing || rows.filter(r => r.productName && r.quantity).length === 0}
            style={{
              padding: '8px 14px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: processing || rows.filter(r => r.productName && r.quantity).length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              opacity: processing || rows.filter(r => r.productName && r.quantity).length === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {processing ? '⏳ Đang xử lý...' : `💾 Lưu & ${isImport ? 'Nhập kho' : 'Xuất kho'}`}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '13px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', position: 'sticky', top: 0, zIndex: 10 }}>
              <th style={headerStyle}>NGÀY</th>
              <th style={headerStyle}>MÃ PHIẾU {isImport ? 'NHẬP' : 'XUẤT'}</th>
              <th style={headerStyle}>TÓM TẮT</th>
              <th style={headerStyle}>NGƯỜI LẬP</th>
              <th style={headerStyle}>SKU</th>
              <th style={headerStyle}>TÊN SẢN PHẨM</th>
              <th style={headerStyle}>SL</th>
              <th style={headerStyle}>ĐƠN GIÁ</th>
              <th style={headerStyle}>THÀNH TIỀN</th>
              <th style={headerStyle}>{lastColumnTitle}</th>
              <th style={headerStyle}>GHI CHÚ</th>
              <th style={headerStyle}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ ...cellStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  Chưa có dữ liệu. Nhấn "Thêm dòng" để bắt đầu.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const isValid = row.productName && row.quantity;
                const rowStyle = isValid ? {} : { backgroundColor: '#fef2f2' };
                
                return (
                  <tr key={row.id} style={rowStyle}>
                    {/* Ngày */}
                    <td style={cellStyle}>
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleCellChange(row.id, 'date', e.target.value)}
                        style={inputStyle}
                      />
                    </td>

                    {/* Mã phiếu */}
                    <td style={cellStyle}>
                      <input
                        type="text"
                        value={row.transactionCode}
                        onChange={(e) => handleCellChange(row.id, 'transactionCode', e.target.value)}
                        placeholder="Mã phiếu..."
                        style={inputStyle}
                      />
                    </td>

                    {/* Tóm tắt */}
                    <td style={cellStyle}>
                      <input
                        type="text"
                        value={row.summary}
                        onChange={(e) => handleCellChange(row.id, 'summary', e.target.value)}
                        placeholder="Tóm tắt..."
                        style={inputStyle}
                      />
                    </td>

                    {/* Người lập */}
                    <td style={cellStyle}>
                      <input
                        type="text"
                        value={row.createdBy}
                        onChange={(e) => handleCellChange(row.id, 'createdBy', e.target.value)}
                        placeholder="Người lập..."
                        style={inputStyle}
                      />
                    </td>

                    {/* SKU - with autocomplete */}
                    <td style={{ ...cellStyle, position: 'relative' }}>
                      <input
                        type="text"
                        value={row.sku}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          handleCellChange(row.id, 'sku', e.target.value);
                        }}
                        onFocus={() => {
                          setShowSuggestions(row.id);
                          setEditingCell(row.id);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowSuggestions(false);
                            setEditingCell(null);
                          }, 200);
                        }}
                        placeholder="SKU (tùy chọn)..."
                        style={inputStyle}
                      />
                      
                      {/* Suggestions Dropdown */}
                      {showSuggestions === row.id && row.sku && filteredProducts.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          {filteredProducts.map(product => (
                            <div
                              key={product.id}
                              onMouseDown={() => handleSelectProduct(product, row.id)}
                              style={{
                                padding: '8px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f3f4f6',
                                fontSize: '12px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <strong>{product.sku}</strong> - {product.productName}
                                  {product.group && (
                                    <div style={{ color: '#6b7280', fontSize: '11px' }}>
                                      {product.group}
                                    </div>
                                  )}
                                </div>
                                <span style={{ color: '#6b7280', fontSize: '11px' }}>
                                  Tồn: {product.quantity}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Tên sản phẩm - CHO PHÉP NHẬP THỦ CÔNG */}
                    <td style={cellStyle}>
                      <input
                        type="text"
                        value={row.productName}
                        onChange={(e) => handleCellChange(row.id, 'productName', e.target.value)}
                        placeholder="Nhập tên sản phẩm..."
                        style={{
                          ...inputStyle,
                          borderColor: !row.productName ? '#ef4444' : undefined,
                          fontWeight: row.productName ? '500' : 'normal'
                        }}
                      />
                      {!row.productName && (
                        <div style={{
                          fontSize: '10px',
                          color: '#ef4444',
                          marginTop: '2px'
                        }}>
                          * Bắt buộc
                        </div>
                      )}
                    </td>

                    {/* Số lượng */}
                    <td style={cellStyle}>
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleCellChange(row.id, 'quantity', e.target.value)}
                        placeholder="SL"
                        min="1"
                        style={{
                          ...inputStyle,
                          borderColor: !row.quantity ? '#ef4444' : undefined
                        }}
                      />
                      {!row.quantity && (
                        <div style={{
                          fontSize: '10px',
                          color: '#ef4444',
                          marginTop: '2px'
                        }}>
                          * Bắt buộc
                        </div>
                      )}
                    </td>

                    {/* Đơn giá */}
                    <td style={cellStyle}>
                      <input
                        type="number"
                        value={row.unitPrice}
                        onChange={(e) => handleCellChange(row.id, 'unitPrice', e.target.value)}
                        placeholder="Đơn giá"
                        min="0"
                        style={inputStyle}
                      />
                    </td>

                    {/* Thành tiền */}
                    <td style={cellStyle}>
                      <div style={{
                        padding: '6px 8px',
                        color: calculateTotal(row.quantity, row.unitPrice) ? '#111827' : '#9ca3af',
                        fontSize: '13px',
                        fontWeight: '600',
                        textAlign: 'right'
                      }}>
                        {calculateTotal(row.quantity, row.unitPrice) ? calculateTotal(row.quantity, row.unitPrice) + ' ₫' : '-'}
                      </div>
                    </td>

                    {/* Nguồn nhập / Lý do xuất */}
                    <td style={cellStyle}>
                      <input
                        type="text"
                        value={row.reason}
                        onChange={(e) => handleCellChange(row.id, 'reason', e.target.value)}
                        placeholder={lastColumnTitle}
                        style={inputStyle}
                      />
                    </td>

                    {/* Ghi chú */}
                    <td style={cellStyle}>
                      <input
                        type="text"
                        value={row.note}
                        onChange={(e) => handleCellChange(row.id, 'note', e.target.value)}
                        placeholder="Ghi chú..."
                        style={inputStyle}
                      />
                    </td>

                    {/* Thao tác */}
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fee2e2',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          💡 <strong>Mẹo:</strong> Nhập SKU để tự động điền, hoặc tự nhập tên sản phẩm. Dòng đỏ = chưa đủ thông tin.
        </div>
        <div style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
          Tổng tiền: <span style={{ color: '#10b981', fontSize: '15px', fontWeight: '600' }}>
            {rows.reduce((sum, row) => {
              const total = parseFloat(row.quantity || 0) * parseFloat(row.unitPrice || 0);
              return sum + total;
            }, 0).toLocaleString('vi-VN')} ₫
          </span>
        </div>
      </div>
    </div>
  );
}

const headerStyle = {
  padding: '12px 8px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '2px solid #e5e7eb',
  backgroundColor: '#f3f4f6',
  whiteSpace: 'nowrap'
};

const cellStyle = {
  padding: '8px',
  fontSize: '13px',
  color: '#1f2937',
  borderBottom: '1px solid #e5e7eb',
  verticalAlign: 'middle'
};

const inputStyle = {
  width: '100%',
  padding: '8px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s'
};

export default ImportManagement;