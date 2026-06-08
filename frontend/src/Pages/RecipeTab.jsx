import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { recipeService } from '../Services/RecipeServices';
import '../assets/styles/Common.css';

function RecipeTab({ products }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [recipeItems, setRecipeItems] = useState([]);
  const [componentId, setComponentId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // Load existing recipe when product changes
  useEffect(() => {
    if (!selectedProductId) {
      setRecipeItems([]);
      return;
    }
    fetchRecipe(selectedProductId);
  }, [selectedProductId]);

  const fetchRecipe = async (id) => {
    try {
      setLoading(true);
      const res = await recipeService.getByProductId(id);
      if (res.data && res.data.items) {
        setRecipeItems(res.data.items);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setRecipeItems([]); // No recipe yet
      } else {
        console.error('Error fetching recipe:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddComponent = () => {
    if (!componentId || quantity <= 0) return alert('Vui lòng chọn nguyên liệu và nhập số lượng > 0');
    if (componentId === selectedProductId) return alert('Nguyên liệu không thể trùng với thành phẩm');

    const component = products.find(p => p.id === Number(componentId));
    if (!component) return;

    // Check if already exists
    const existingIndex = recipeItems.findIndex(i => Number(i.componentId) === Number(componentId));
    if (existingIndex >= 0) {
      const newItems = [...recipeItems];
      newItems[existingIndex].quantity = Number(newItems[existingIndex].quantity) + Number(quantity);
      setRecipeItems(newItems);
    } else {
      setRecipeItems([...recipeItems, { componentId: Number(componentId), quantity: Number(quantity), component }]);
    }

    // Reset inputs
    setComponentId('');
    setQuantity(1);
  };

  const handleRemoveComponent = (index) => {
    const newItems = [...recipeItems];
    newItems.splice(index, 1);
    setRecipeItems(newItems);
  };

  const handleSaveRecipe = async () => {
    if (!selectedProductId) return alert('Vui lòng chọn sản phẩm (thành phẩm)');
    try {
      setLoading(true);
      await recipeService.createOrUpdate({
        productId: selectedProductId,
        items: recipeItems.map(i => ({ componentId: i.componentId, quantity: i.quantity }))
      });
      alert('Lưu định mức thành công!');
      fetchRecipe(selectedProductId);
    } catch (err) {
      console.error('Error saving recipe:', err);
      alert('Lỗi khi lưu định mức: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-pane active">
      <div className="section-header">
        <h2 className="section-title">Quản lý Định Mức (BOM)</h2>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3>1. Chọn Thành Phẩm</h3>
        </div>
        <div className="card-body">
          <div className="form-group" style={{ maxWidth: '400px' }}>
            <label>Sản phẩm cần thiết lập định mức:</label>
            <select 
              className="form-input"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.productName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedProductId && (
        <div className="card">
          <div className="card-header">
            <h3>2. Chi Tiết Nguyên Liệu</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label>Nguyên liệu cấu thành:</label>
                <select 
                  className="form-input"
                  value={componentId}
                  onChange={(e) => setComponentId(e.target.value)}
                >
                  <option value="">-- Chọn nguyên liệu --</option>
                  {products.filter(p => p.id !== Number(selectedProductId)).map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.productName} (Đơn vị: {p.unit || 'Cái'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Số lượng:</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={quantity}
                  min="0.1" step="0.1"
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <button 
                className="btn-primary" 
                onClick={handleAddComponent}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '42px' }}
              >
                <Plus size={18} /> Thêm
              </button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU Nguyên Liệu</th>
                  <th>Tên Nguyên Liệu</th>
                  <th>Số Lượng Định Mức</th>
                  <th>Đơn Vị</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {recipeItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">Chưa có nguyên liệu nào. Hãy thêm ở trên.</td>
                  </tr>
                ) : (
                  recipeItems.map((item, index) => {
                    const comp = item.component || products.find(p => p.id === Number(item.componentId));
                    return (
                      <tr key={index}>
                        <td>{comp?.sku}</td>
                        <td>{comp?.productName}</td>
                        <td style={{ fontWeight: 'bold', color: '#0ea5e9' }}>{item.quantity}</td>
                        <td>{comp?.unit || '-'}</td>
                        <td>
                          <button 
                            className="action-btn text-danger" 
                            onClick={() => handleRemoveComponent(index)}
                            title="Xóa nguyên liệu"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-primary" 
                onClick={handleSaveRecipe}
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {loading ? <RefreshCw className="spin" size={18} /> : <Save size={18} />} 
                Lưu Định Mức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipeTab;
