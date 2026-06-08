// components/ProductTable.jsx
import { useState } from 'react';
import { formatCurrency } from '../utils/helper';
import ProductImageService from '../Services/ProductImageService';
import ProductImageCropper from './ProductImageCropper';

function ProductTable({ products, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [croppingProductId, setCroppingProductId] = useState(null);

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditingProduct({ ...product });
  };

  const saveEdit = () => {
    onUpdate(editingId, editingProduct);
    setEditingId(null);
    setEditingProduct(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingProduct(null);
  };

  const handleImageUpload = async (productId, file) => {
    if (!file) return;

    setUploadingId(productId);
    try {
      const base64Image = await ProductImageService.handleImageUpload(file);
      await ProductImageService.uploadImage(productId, base64Image);
      
      // Update product in the list
      const updatedProduct = { ...editingProduct, imageUrl: base64Image };
      onUpdate(productId, updatedProduct);
      
      alert('✅ Hình ảnh tải lên thành công!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Lỗi khi tải hình ảnh: ' + (error.message || error));
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th className="text-center">STT</th>
            <th className="text-center">HÌNH ẢNH</th>
            <th>NHÓM</th>
            <th>SKU</th>
            <th>TÊN SẢN PHẨM</th>
            <th className="text-center">PHÂN LOẠI KHO </th>
            <th className="text-center">PHÂN LOẠI CHI TIẾT</th>
            <th className="text-center">DỰ ÁN</th>
            <th className="text-center">ĐƠN VỊ</th>
            <th className="text-center">GIÁ VỐN</th>
            <th className="text-center">GIÁ NIÊM YẾT</th>
            <th className="text-center">GHI CHÚ</th>
            <th className="text-center">THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              {editingId === product.id ? (
                <>
                  <td className="text-center">{product.stt}</td>
                  <td className="text-center">
                    {editingProduct.imageUrl ? (
                      <img
                        src={editingProduct.imageUrl}
                        alt="Current"
                        style={{
                          maxWidth: '60px',
                          maxHeight: '60px',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>Chưa có</span>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingProduct.group}
                      onChange={(e) => setEditingProduct({ ...editingProduct, group: e.target.value })}
                      className="form-input"
                      style={{ padding: '5px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingProduct.sku}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      className="form-input"
                      style={{ padding: '5px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingProduct.productName}
                      onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })}
                      className="form-input"
                      style={{ padding: '5px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingProduct.stockType1 || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stockType1: e.target.value })}
                      className="form-input"
                      style={{ padding: '5px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingProduct.stockType2 || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stockType2: e.target.value })}
                      className="form-input"
                      style={{ padding: '5px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingProduct.project || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, project: e.target.value })}
                      className="form-input"
                      style={{ padding: '5px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingProduct.unit || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                      className="form-input"
                      style={{ padding: '5px', width: '80px', textAlign: 'center' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editingProduct.cost}
                      onChange={(e) => setEditingProduct({ ...editingProduct, cost: Number(e.target.value) })}
                      className="form-input"
                      style={{ padding: '5px', textAlign: 'right' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editingProduct.retailPrice}
                      onChange={(e) => setEditingProduct({ ...editingProduct, retailPrice: Number(e.target.value) })}
                      className="form-input"
                      style={{ padding: '5px', textAlign: 'right' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingProduct.note || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, note: e.target.value })}
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
                  <td className="text-center">{product.stt}</td>
                  <td className="text-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        style={{
                          maxWidth: '80px',
                          maxHeight: '80px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        title={product.productName}
                      />
                    ) : (
                      <span style={{ color: '#999' }}>Không có ảnh</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-blue">{product.group}</span>
                  </td>
                  <td>{product.sku}</td>
                  <td style={{ fontWeight: '500' }}>{product.productName}</td>
                  <td>{product.stockType1 || ''}</td>
                  <td>{product.stockType2 || ''}</td>
                  <td className="text-center">{product.project || ''}</td>
                  <td className="text-center">{product.unit || ''}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(product.cost)}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>
                    {formatCurrency(product.retailPrice)}
                  </td>
                  <td>{product.note || ''}</td>
                  <td className="text-center">
                    <div className="flex" style={{ justifyContent: 'center', gap: '5px' }}>
                      <button
                        className="icon-btn"
                        onClick={() => startEdit(product)}
                        style={{ color: '#2196f3' }}
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => setCroppingProductId(product.id)}
                        style={{ color: '#ff9800' }}
                        title="Cắt/upload ảnh"
                      >
                        📸
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => onDelete(product.id)}
                        style={{ color: '#f44336' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Image Cropper Modal */}
      {croppingProductId && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1000',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            backgroundColor: '#fff',
            borderRadius: '8px'
          }}>
            <ProductImageCropper
              product={products.find(p => p.id === croppingProductId)}
              onSuccess={(imageUrl) => {
                setCroppingProductId(null);
                // Refresh product data if needed
              }}
              onCancel={() => setCroppingProductId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductTable;