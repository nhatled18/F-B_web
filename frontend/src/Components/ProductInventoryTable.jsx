import { useState } from 'react';
import { formatCurrency } from '../utils/helper';

function ProductInventoryTable({ inventories, products, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);

  const getProductInfo = (productId) => {
    const product = products.find(p => p.id === productId);
    return product || { sku: '', productName: '', group: '' };
  };

  const calculateEndingStock = (initial, stockIn, stockOut, damaged) => {
    return Number(initial) + Number(stockIn) - Number(stockOut) - Number(damaged);
  };

  const startEdit = (inventory) => {
    setEditingId(inventory.id);
    setEditingInventory({ ...inventory });
  };

  const handleFieldChange = (field, value) => {
    const newInventory = { ...editingInventory, [field]: value };
    
    // Auto calculate ending stock
    if (['initialStock', 'stockIn', 'stockOut', 'damaged'].includes(field)) {
      newInventory.endingStock = calculateEndingStock(
        newInventory.initialStock,
        newInventory.stockIn,
        newInventory.stockOut,
        newInventory.damaged
      );
    }
    
    setEditingInventory(newInventory);
  };

  const saveEdit = () => {
    onUpdate(editingId, editingInventory);
    setEditingId(null);
    setEditingInventory(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingInventory(null);
  };

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th className="text-center">STT</th>
            <th>NHÓM</th>
            <th>SKU</th>
            <th>TÊN SẢN PHẨM</th>
            <th className="text-center">PHÂN LOẠI KHO</th>
            <th className="text-center">PHÂN LOẠI CHI TIẾT</th>
            <th className="text-center">GIÁ NIÊM YẾT</th>
            <th className="text-center">GIÁ VỐN</th>
            <th className="text-center">TỒN KHO ĐẦU</th>
            <th className="text-center">TRƯNG BÀY</th>
            <th className="text-center">TỔNG NHẬP</th>
            <th className="text-center">TỔNG XUẤT</th>
            <th className="text-center">HỎNG/LỖI</th>
            <th className="text-center">TỒN KHO</th>
            <th className="text-center">GIÁ TRỊ TỒN KHO</th>
            <th className="text-center">GHI CHÚ</th>
            <th className="text-center">THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {inventories.map((inventory, index) => {
            const product = getProductInfo(inventory.productId);
            const totalValue = inventory.endingStock * inventory.cost;
            
            return (
              <tr key={inventory.id}>
                {editingId === inventory.id ? (
                  <>
                    <td className="text-center">{inventory.stt || index + 1}</td>
                    <td>
                      <span className="badge badge-blue">{product.group}</span>
                    </td>
                    <td>{product.sku}</td>
                    <td style={{ fontWeight: '500' }}>{product.productName}</td>
                    <td>
                      <input
                        type="text"
                        value={editingInventory.stockType1 || ''}
                        onChange={(e) => handleFieldChange('stockType1', e.target.value)}
                        className="form-input"
                        style={{ padding: '5px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editingInventory.stockType2 || ''}
                        onChange={(e) => handleFieldChange('stockType2', e.target.value)}
                        className="form-input"
                        style={{ padding: '5px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editingInventory.retailPrice}
                        onChange={(e) => handleFieldChange('retailPrice', Number(e.target.value))}
                        className="form-input"
                        style={{ padding: '5px', textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editingInventory.cost}
                        onChange={(e) => handleFieldChange('cost', Number(e.target.value))}
                        className="form-input"
                        style={{ padding: '5px', textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editingInventory.initialStock}
                        onChange={(e) => handleFieldChange('initialStock', Number(e.target.value))}
                        className="form-input"
                        style={{ padding: '5px', width: '80px', textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editingInventory.displayStock || 0}
                        onChange={(e) => handleFieldChange('displayStock', Number(e.target.value))}
                        className="form-input"
                        style={{ padding: '5px', width: '80px', textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editingInventory.stockIn}
                        onChange={(e) => handleFieldChange('stockIn', Number(e.target.value))}
                        className="form-input"
                        style={{ padding: '5px', width: '80px', textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editingInventory.stockOut}
                        onChange={(e) => handleFieldChange('stockOut', Number(e.target.value))}
                        className="form-input"
                        style={{ padding: '5px', width: '80px', textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editingInventory.damaged}
                        onChange={(e) => handleFieldChange('damaged', Number(e.target.value))}
                        className="form-input"
                        style={{ padding: '5px', width: '80px', textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editingInventory.endingStock}
                        readOnly
                        className="form-input"
                        style={{ 
                          padding: '5px', 
                          width: '80px', 
                          textAlign: 'center',
                          backgroundColor: '#f3f4f6',
                          cursor: 'not-allowed'
                        }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatCurrency(editingInventory.endingStock * editingInventory.cost)}
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editingInventory.note || ''}
                        onChange={(e) => handleFieldChange('note', e.target.value)}
                        className="form-input"
                        style={{ padding: '5px' }}
                      />
                    </td>
                    <td className="text-center">
                      <div className="flex" style={{ justifyContent: 'center' }}>
                        <button
                          className="icon-btn"
                          onClick={saveEdit}
                          style={{ color: '#4caf50' }}
                        >
                          💾
                        </button>
                        <button
                          className="icon-btn"
                          onClick={cancelEdit}
                          style={{ color: '#9e9e9e' }}
                        >
                          ❌
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="text-center">{inventory.stt || index + 1}</td>
                    <td>
                      <span className="badge badge-blue">{product.group}</span>
                    </td>
                    <td>{product.sku}</td>
                    <td style={{ fontWeight: '500' }}>{product.productName}</td>
                    <td className="text-center">{inventory.stockType1 || ''}</td>
                    <td className="text-center">{inventory.stockType2 || ''}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(inventory.retailPrice)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatCurrency(inventory.cost)}
                    </td>
                    <td className="text-center">
                      <span style={{ fontWeight: 'bold', color: '#333' }}>
                        {inventory.initialStock}
                      </span>
                    </td>
                    <td className="text-center">{inventory.displayStock || 0}</td>
                    <td className="text-center">
                      <span style={{ color: '#2563eb', fontWeight: '500' }}>
                        {inventory.stockIn}
                      </span>
                    </td>
                    <td className="text-center">
                      <span style={{ color: '#dc2626', fontWeight: '500' }}>
                        {inventory.stockOut}
                      </span>
                    </td>
                    <td className="text-center">
                      <span style={{ color: inventory.damaged > 0 ? '#d32f2f' : '#333' }}>
                        {inventory.damaged}
                      </span>
                    </td>
                    <td className="text-center">
                      <span style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a' }}>
                        {inventory.endingStock}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                      {formatCurrency(totalValue)}
                    </td>
                    <td>{inventory.note || ''}</td>
                    <td className="text-center">
                      <div className="flex" style={{ justifyContent: 'center' }}>
                        <button
                          className="icon-btn"
                          onClick={() => startEdit(inventory)}
                          style={{ color: '#2196f3' }}
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => onDelete(inventory.id)}
                          style={{ color: '#f44336' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ProductInventoryTable;