import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

function ExportManagement({ 
  rows, 
  setRows, 
  products, 
  onSubmitAll,
  currentUser,
  processing
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const headerColor = '#1e5a8e';
  const headerTitle = 'XUẤT KHO';

  // Filter products for autocomplete
  const filteredProducts = products.filter(p => {
    const name = p.productName || "";
    const sku = p.sku || "";
    const group = p.group || "";
    const term = searchTerm?.toLowerCase() || "";
    
    return (
      name.toLowerCase().includes(term) ||
      sku.toLowerCase().includes(term) ||
      group.toLowerCase().includes(term)
    );
  });

  // Handle product selection
  const handleSelectProduct = (product, rowId) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          sku: product.sku,
          productName: product.productName
        };
      }
      return row;
    }));
    setShowSuggestions(false);
    setSearchTerm('');
    setEditingCell(null);
  };

  // Handle cell change
  const handleCellChange = (rowId, field, value) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return { ...row, [field]: value };
      }
      return row;
    }));
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
    const newRow = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      transactionCode: '',
      summary: '',
      createdBy: currentUser?.username || '',
      sku: '',
      productName: '',
      quantity: '',
      unitPrice: '',
      reason: '',
      note: ''
    };
    setRows([...rows, newRow]);
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
        createdBy: currentUser?.username || '',
        sku: '',
        productName: '',
        quantity: '',
        unitPrice: '',
        reason: '',
        note: ''
      }]);
    }
  };

  // Import Excel
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      return;
    }

    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const importedRows = [];
      const errors = [];

      jsonData.forEach((row, index) => {
        try {
          // ✅ BỎ productId - chỉ cần productName và sku
          const product = products.find(p => p.sku === row.SKU);
          
          const newRow = {
            id: Date.now() + index,
            date: row['NGÀY'] ? String(row['NGÀY']) : new Date().toISOString().split('T')[0],
            transactionCode: row['MÃ PHIẾU XUẤT'] || '',
            summary: row['TÓM TẮT'] || '',
            createdBy: row['NGƯỜI LẬP'] || '',
            sku: row['SKU'] || '',
            productName: row['TÊN SẢN PHẨM'] || product?.productName || '',
            quantity: row['SL'] || '',
            unitPrice: row['ĐƠN GIÁ'] || '',
            reason: row['LÝ DO XUẤT'] || '',
            note: row['GHI CHÚ'] || ''
          };

          importedRows.push(newRow);
        } catch (error) {
          errors.push(`Dòng ${index + 2}: ${error.message}`);
        }
      });

      if (errors.length > 0) {
        alert(`Có ${errors.length} lỗi:\n${errors.slice(0, 3).join('\n')}`);
      }

      if (importedRows.length > 0) {
        if (confirm(`Import ${importedRows.length} dòng?`)) {
          setRows(importedRows);
          alert('Import thành công!');
        }
      }

    } catch (error) {
      console.error('Error importing file:', error);
      alert('Lỗi khi đọc file Excel!');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (rows.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    try {
      const exportData = rows.map(row => ({
        'NGÀY': row.date,
        'MÃ PHIẾU XUẤT': row.transactionCode,
        'TÓM TẮT': row.summary,
        'NGƯỜI LẬP': row.createdBy,
        'SKU': row.sku,
        'TÊN SẢN PHẨM': row.productName,
        'SL': row.quantity,
        'ĐƠN GIÁ': row.unitPrice,
        'THÀNH TIỀN': row.quantity && row.unitPrice 
          ? parseFloat(row.quantity) * parseFloat(row.unitPrice) 
          : '',
        'LÝ DO XUẤT': row.reason,
        'GHI CHÚ': row.note || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Xuất Kho');

      const maxWidth = 50;
      const colWidths = Object.keys(exportData[0] || {}).map(key => {
        const maxLen = Math.max(
          key.length,
          ...exportData.map(row => String(row[key] || '').length)
        );
        return { wch: Math.min(maxLen + 2, maxWidth) };
      });
      ws['!cols'] = colWidths;

      const date = new Date().toISOString().split('T')[0];
      const fileName = `Xuat_Kho_${date}.xlsx`;

      XLSX.writeFile(wb, fileName);
      alert('Xuất Excel thành công!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Lỗi khi xuất Excel!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: headerColor,
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{headerTitle}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportExcel}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: headerColor,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            📤 Export Excel
          </button>
          <label style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            color: headerColor,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            📥 Import Excel
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={handleClearAll}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🗑️ Xóa tất cả
          </button>
          <button
            onClick={handleAddRow}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: headerColor,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ➕ Thêm dòng
          </button>
          <button
            onClick={onSubmitAll}
            disabled={processing || rows.filter(r => r.productName && r.quantity).length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (processing || rows.filter(r => r.productName && r.quantity).length === 0) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: (processing || rows.filter(r => r.productName && r.quantity).length === 0) ? 0.5 : 1
            }}
          >
            {processing ? '⏳ Đang xử lý...' : '✓ Xác nhận xuất kho'}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Tổng: <strong>{rows.length}</strong> dòng | 
          Hợp lệ: <strong style={{ color: '#10b981' }}>{rows.filter(r => r.productName && r.quantity).length}</strong> dòng |
          Chưa hợp lệ: <strong style={{ color: '#ef4444' }}>{rows.filter(r => !r.productName || !r.quantity).length}</strong> dòng
        </div>
        <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
          Tổng tiền: <span style={{ color: '#ef4444', fontSize: '16px', fontWeight: '600' }}>
            {rows.reduce((sum, row) => {
              const total = parseFloat(row.quantity || 0) * parseFloat(row.unitPrice || 0);
              return sum + total;
            }, 0).toLocaleString('vi-VN')} ₫
          </span>
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
            <tr style={{ backgroundColor: '#d9d9d9', position: 'sticky', top: 0, zIndex: 10 }}>
              <th style={headerStyle}>NGÀY</th>
              <th style={headerStyle}>MÃ PHIẾU XUẤT</th>
              <th style={headerStyle}>TÓM TẮT</th>
              <th style={headerStyle}>NGƯỜI LẬP</th>
              <th style={headerStyle}>SKU</th>
              <th style={headerStyle}>TÊN SẢN PHẨM</th>
              <th style={headerStyle}>SL</th>
              <th style={headerStyle}>ĐƠN GIÁ</th>
              <th style={headerStyle}>THÀNH TIỀN</th>
              <th style={headerStyle}>LÝ DO XUẤT</th>
              <th style={headerStyle}>GHI CHÚ</th>
              <th style={headerStyle}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ ...cellStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  Chưa có dữ liệu. Nhấn "Thêm dòng" hoặc "Import Excel" để bắt đầu.
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
                          border: '1px solid #999',
                          borderRadius: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                        }}>
                          {filteredProducts.map(product => (
                            <div
                              key={product.id}
                              onMouseDown={() => handleSelectProduct(product, row.id)}
                              style={{
                                padding: '8px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                fontSize: '12px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <strong>{product.sku}</strong> - {product.productName}
                                  {product.group && (
                                    <div style={{ color: '#666', fontSize: '11px' }}>
                                      {product.group}
                                    </div>
                                  )}
                                </div>
                                <span style={{ color: '#666', fontSize: '11px' }}>
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
                          borderColor: !row.productName ? '#ef4444' : '#d1d5db',
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
                          borderColor: !row.quantity ? '#ef4444' : '#d1d5db'
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
                        color: calculateTotal(row.quantity, row.unitPrice) ? '#ef4444' : '#9ca3af',
                        fontSize: '13px',
                        fontWeight: '600',
                        textAlign: 'right'
                      }}>
                        {calculateTotal(row.quantity, row.unitPrice) ? calculateTotal(row.quantity, row.unitPrice) + ' ₫' : '-'}
                      </div>
                    </td>

                    {/* Lý do xuất */}
                    <td style={cellStyle}>
                      <input
                        type="text"
                        value={row.reason}
                        onChange={(e) => handleCellChange(row.id, 'reason', e.target.value)}
                        placeholder="Lý do xuất..."
                        style={inputStyle}
                      />
                    </td>

                    {/* Ghi chú */}
                    <td style={cellStyle}>
                      <input
                        type="text"
                        value={row.note || ''}
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
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
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

      {/* Footer Tips */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#fffbeb',
        borderTop: '1px solid #fde68a',
        fontSize: '13px',
        color: '#92400e'
      }}>
        💡 <strong>Mẹo:</strong> Nhập SKU để tự động điền, hoặc tự nhập tên sản phẩm. Dòng đỏ = chưa đủ thông tin (thiếu tên sản phẩm hoặc số lượng).
      </div>
    </div>
  );
}

const headerStyle = {
  padding: '8px',
  textAlign: 'center',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#000',
  border: '1px solid #999',
  backgroundColor: '#d9d9d9',
  whiteSpace: 'nowrap'
};

const cellStyle = {
  padding: '4px 8px',
  fontSize: '13px',
  color: '#000',
  border: '1px solid #d0d0d0',
  verticalAlign: 'middle'
};

const inputStyle = {
  width: '100%',
  padding: '4px',
  border: 'none',
  outline: 'none',
  fontSize: '13px',
  backgroundColor: 'transparent',
  fontFamily: 'inherit'
};

export default ExportManagement;