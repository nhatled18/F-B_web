import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { productService } from '../Services/ProductServices';
import "../assets/styles/Product.css";
import "../assets/styles/Common.css";
import SearchBox from '../Components/SearchBox';
import ProductForm from '../Components/ProductForm';
import ProductTable from '../Components/ProductTable';
import Pagination from '../Components/Pagination';

function ProductsTab({ 
  products, 
  setProducts, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onRefreshData
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Delete All States
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    group: '',
    stockRange: '',
    priceRange: '',
    sortBy: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Progress State
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  
  const itemsPerPage = 10;
  const fileInputRef = useRef(null);

  // ========== BATCH PROCESSING HELPER WITH RETRY ==========
  const processBatch = async (items, batchSize, delayMs, processFn, progressMessage = 'Đang xử lý') => {
    const results = [];
    const totalBatches = Math.ceil(items.length / batchSize);
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      setProgress({
        current: i,
        total: items.length,
        message: `${progressMessage} - Batch ${currentBatch}/${totalBatches}`
      });
      
      const batchResults = await Promise.allSettled(
        batch.map(item => processFn(item))
      );
      
      results.push(...batchResults);
      
      setProgress({
        current: Math.min(i + batch.length, items.length),
        total: items.length,
        message: `${progressMessage} - Batch ${currentBatch}/${totalBatches}`
      });
      
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  };

  // ========== RETRY HELPER FOR DEADLOCK ==========
  const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        // Kiểm tra nếu là lỗi deadlock (P2034)
        const isDeadlock = error.code === 'P2034' || 
                          error.message?.includes('write conflict') || 
                          error.message?.includes('deadlock');
        
        if (isDeadlock && i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i); // Exponential backoff
          console.log(`⏳ Retry ${i + 1}/${maxRetries} sau ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  // ========== FILTER PRODUCTS ==========
  let filteredProducts = products.filter(p => {
    const name = p.productName || "";
    const sku = p.sku || "";
    const group = p.group || "";
    const term = searchTerm?.toLowerCase() || "";
    return name.toLowerCase().includes(term) || 
           sku.toLowerCase().includes(term) || 
           group.toLowerCase().includes(term);
  });

  // Apply filters
  if (filters.group) {
    filteredProducts = filteredProducts.filter(p => p.group === filters.group);
  }
  
  if (filters.priceRange) {
    if (filters.priceRange === 'low') {
      filteredProducts = filteredProducts.filter(p => (p.retailPrice || 0) < 200000);
    } else if (filters.priceRange === 'medium') {
      filteredProducts = filteredProducts.filter(p => (p.retailPrice || 0) >= 200000 && (p.retailPrice || 0) <= 400000);
    } else if (filters.priceRange === 'high') {
      filteredProducts = filteredProducts.filter(p => (p.retailPrice || 0) > 400000);
    }
  }

  // Apply sorting
  if (filters.sortBy) {
    if (filters.sortBy === 'name_asc') {
      filteredProducts.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
    } else if (filters.sortBy === 'name_desc') {
      filteredProducts.sort((a, b) => (b.productName || '').localeCompare(a.productName || ''));
    } else if (filters.sortBy === 'price_asc') {
      filteredProducts.sort((a, b) => (a.retailPrice || 0) - (b.retailPrice || 0));
    } else if (filters.sortBy === 'price_desc') {
      filteredProducts.sort((a, b) => (b.retailPrice || 0) - (a.retailPrice || 0));
    }
  }

  // Add STT to filtered products
  const productsWithSTT = filteredProducts.map((product, index) => ({
    ...product,
    stt: index + 1
  }));

  // Pagination
  const totalPages = Math.ceil(productsWithSTT.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = productsWithSTT.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // ========== FILTER FUNCTIONS ==========
  const groups = [...new Set(products.map(p => p.group).filter(Boolean))];

  const applyFilter = (type, value) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
    
    const active = [];
    if (newFilters.group) active.push(`Nhóm: ${newFilters.group}`);
    if (newFilters.priceRange) {
      const priceLabels = { low: 'Dưới 200k', medium: '200k-400k', high: 'Trên 400k' };
      active.push(`Giá: ${priceLabels[newFilters.priceRange]}`);
    }
    if (newFilters.sortBy) {
      const sortLabels = {
        name_asc: 'Tên A-Z', name_desc: 'Tên Z-A',
        price_asc: 'Giá thấp → cao', price_desc: 'Giá cao → thấp'
      };
      active.push(`Sắp xếp: ${sortLabels[newFilters.sortBy]}`);
    }
    
    setActiveFilters(active);
  };

  const removeFilter = (filterText) => {
    const newFilters = { ...filters };
    if (filterText.includes('Nhóm:')) newFilters.group = '';
    else if (filterText.includes('Giá:')) newFilters.priceRange = '';
    else if (filterText.includes('Sắp xếp:')) newFilters.sortBy = '';
    
    setFilters(newFilters);
    const active = activeFilters.filter(f => f !== filterText);
    setActiveFilters(active);
  };

  const clearAllFilters = () => {
    setFilters({ group: '', stockRange: '', priceRange: '', sortBy: '' });
    setActiveFilters([]);
  };

  // ========== DELETE ALL FUNCTIONS ==========
  const handleDeleteAllClick = () => {
    if (products.length === 0) {
      alert('Không có sản phẩm nào để xóa!');
      return;
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    setProgress({ current: 0, total: products.length, message: 'Đang chuẩn bị xóa...' });
    
    try {
      console.log(`🗑️ Bắt đầu xóa ${products.length} sản phẩm...`);
      
      const results = await processBatch(
        products,
        3, // ⚠️ GIẢM XUỐNG 3 để tránh deadlock
        1200, // ⚠️ TĂNG delay lên 1200ms
        async (product) => {
          return await retryWithBackoff(async () => {
            try {
              const result = await productService.delete(product.id);
              console.log(`✅ Xóa thành công: ${product.sku}`);
              return result;
            } catch (error) {
              // Bỏ qua lỗi 404 (sản phẩm đã bị xóa)
              if (error.response?.status === 404) {
                console.log(`⚠️ Sản phẩm ${product.sku} đã bị xóa trước đó`);
                return { id: product.id, status: 'already_deleted' };
              }
              console.error(`❌ Lỗi xóa ${product.sku}:`, error.code || error.message);
              throw error;
            }
          }, 3, 1000); // Retry tối đa 3 lần, delay 1s
        },
        'Đang xóa sản phẩm'
      );

      const success = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      // Log chi tiết các lỗi
      if (failed.length > 0) {
        console.warn(`❌ ${failed.length} sản phẩm xóa lỗi:`);
        failed.forEach((result, index) => {
          if (index < 5) { // Chỉ log 5 lỗi đầu
            console.error(`  - ${result.reason?.code || result.reason?.message || 'Unknown error'}`);
          }
        });
      }

      if (onRefreshData) {
        await onRefreshData();
      }

      setShowDeleteModal(false);
      setProgress({ current: 0, total: 0, message: '' });
      
      // Hiển thị thông báo chi tiết hơn
      const message = `✅ Xóa hoàn tất!\n\n` +
        `✓ Thành công: ${success.length}\n` +
        `✗ Lỗi: ${failed.length}` +
        (failed.length > 0 ? `\n\n⚠️ Các sản phẩm lỗi có thể:\n- Đã bị xóa trước đó\n- Đang được sử dụng trong đơn hàng\n- Database bị conflict` : '');
      
      alert(message);
    } catch (error) {
      console.error('Error deleting products:', error);
      alert('Có lỗi nghiêm trọng khi xóa sản phẩm. Vui lòng thử lại!');
    } finally {
      setIsDeleting(false);
      setProgress({ current: 0, total: 0, message: '' });
    }
  };

  // ========== PRODUCT CRUD FUNCTIONS ==========
  const handleAddProduct = async (newProduct) => {
    try {
      console.log('🔵 [ProductTabs] handleAddProduct called');
      
      if (onAddProduct) {
        await onAddProduct(newProduct);
        setShowAddProduct(false);
      } else {
        const response = await productService.create(newProduct);
        setProducts([...products, response.data]);
        setShowAddProduct(false);
        alert('Thêm sản phẩm thành công!');
      }
    } catch (error) {
      console.error('❌ [ProductTabs] Error adding product:', error);
    }
  };

  const handleUpdateProduct = async (id, updatedProduct) => {
    try {
      console.log('🔵 [ProductTabs] handleUpdateProduct called');
      
      if (onUpdateProduct) {
        await onUpdateProduct(id, updatedProduct);
      } else {
        const response = await productService.update(id, updatedProduct);
        setProducts(products.map(p => p.id === id ? response.data : p));
        alert('Cập nhật sản phẩm thành công!');
      }
    } catch (error) {
      console.error('❌ [ProductTabs] Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      console.log('🔵 [ProductTabs] handleDeleteProduct called');
      
      if (onDeleteProduct) {
        await onDeleteProduct(id);
      } else {
        await productService.delete(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        alert('Xóa sản phẩm thành công!');
      }
    } catch (error) {
      console.error('❌ [ProductTabs] Delete failed:', error);
      
      if (error.response?.status === 404) {
        setProducts(prev => prev.filter(p => p.id !== id));
        alert('Xóa thành công (sản phẩm đã không còn tồn tại)!');
        return;
      }
      
      alert('Có lỗi khi xóa sản phẩm. Vui lòng thử lại!');
    }
  };

  // ========== IMPORT EXCEL FUNCTIONS ==========
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
    setProgress({ current: 0, total: 0, message: 'Đang đọc file...' });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const importedProducts = [];
      const errors = [];

      jsonData.forEach((row, index) => {
        try {
          if (!row['TÊN SẢN PHẨM'] || !row['SKU']) {
            errors.push(`Dòng ${index + 2}: Thiếu tên sản phẩm hoặc SKU`);
            return;
          }

          const product = {
            group: row['NHÓM'] ? String(row['NHÓM']).trim() : '',
            sku: String(row['SKU']).trim(),
            productName: String(row['TÊN SẢN PHẨM']).trim(),
            stockType1: row['PHÂN LOẠI KHO'] ? String(row['PHÂN LOẠI KHO']).trim() : '',
            stockType2: row['PHÂN LOẠI CHI TIẾT'] ? String(row['PHÂN LOẠI CHI TIẾT']).trim() : '',
            project: row['DỰ ÁN'] ? String(row['DỰ ÁN']).trim() : '',
            unit: row['ĐƠN VỊ'] ? String(row['ĐƠN VỊ']).trim() : '',
            cost: row['GIÁ VỐN'] ? Number(row['GIÁ VỐN']) : 0,
            retailPrice: row['GIÁ NIÊM YẾT'] ? Number(row['GIÁ NIÊM YẾT']) : 0,
            note: row['GHI CHÚ'] ? String(row['GHI CHÚ']).trim() : ''
          };

          if (isNaN(product.cost) || product.cost < 0) {
            errors.push(`Dòng ${index + 2}: Giá vốn không hợp lệ`);
            return;
          }
          if (isNaN(product.retailPrice) || product.retailPrice < 0) {
            errors.push(`Dòng ${index + 2}: Giá niêm yết không hợp lệ`);
            return;
          }

          const isDuplicate = products.some(p => p.sku === product.sku) ||
            importedProducts.some(p => p.sku === product.sku);
          if (isDuplicate) {
            errors.push(`Dòng ${index + 2}: SKU "${product.sku}" đã tồn tại`);
            return;
          }

          importedProducts.push(product);
        } catch (error) {
          errors.push(`Dòng ${index + 2}: Lỗi xử lý dữ liệu - ${error.message}`);
        }
      });

      if (errors.length > 0) {
        const errorMessage = `Có ${errors.length} lỗi khi import:\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... và ${errors.length - 5} lỗi khác` : ''}`;
        alert(errorMessage);
      }

      if (importedProducts.length > 0) {
        if (confirm(`Tìm thấy ${importedProducts.length} sản phẩm hợp lệ. Bạn có muốn import không?`)) {
          try {
            console.log(`📥 Bắt đầu import ${importedProducts.length} sản phẩm...`);
            
            const results = await processBatch(
              importedProducts,
              5, // Batch size cho import
              800, // Delay cho import
              async (product) => {
                return await retryWithBackoff(async () => {
                  return await productService.create(product);
                }, 2, 500); // Retry 2 lần cho import
              },
              'Đang import sản phẩm'
            );

            const success = results.filter(r => r.status === 'fulfilled');
            const failed = results.filter(r => r.status === 'rejected');

            if (failed.length > 0) {
              console.warn(`❌ ${failed.length} sản phẩm import lỗi`);
            }

            if (onRefreshData) {
              await onRefreshData();
            }
            
            setCurrentPage(1);
            alert(`✅ Import hoàn tất!\n\n✓ Thành công: ${success.length}\n✗ Lỗi: ${failed.length}`);
          } catch (error) {
            console.error('Error importing products:', error);
            alert('Có lỗi khi import sản phẩm. Vui lòng thử lại!');
          }
        }
      } else if (errors.length === 0) {
        alert('Không tìm thấy dữ liệu hợp lệ trong file Excel');
      }

    } catch (error) {
      console.error('Error importing file:', error);
      alert('Có lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng file.');
    } finally {
      setImporting(false);
      setProgress({ current: 0, total: 0, message: '' });
      e.target.value = '';
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <SearchBox 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />
          
          <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
            {/* Filter Button */}
            <button
              className="btn-secondary"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              style={{ position: 'relative' }}
            >
              <span>🔽</span>
              <span>Bộ Lọc</span>
              {activeFilters.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#4F46E5',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {activeFilters.length}
                </span>
              )}
            </button>

            {/* Filter Dropdown Menu */}
            {showFilterMenu && (
              <>
                <div 
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999
                  }}
                  onClick={() => setShowFilterMenu(false)}
                />
                
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '250px',
                  marginTop: '8px',
                  width: '280px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb',
                  zIndex: 1000
                }}>
                  <div style={{ padding: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '16px' 
                    }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                        Lọc sản phẩm
                      </h3>
                      <button
                        onClick={() => setShowFilterMenu(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '20px',
                          cursor: 'pointer',
                          color: '#6b7280',
                          padding: '0'
                        }}
                      >
                        ×
                      </button>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Nhóm sản phẩm
                      </label>
                      <select
                        value={filters.group}
                        onChange={(e) => applyFilter('group', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      >
                        <option value="">Tất cả nhóm</option>
                        {groups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Giá niêm yết
                      </label>
                      <select
                        value={filters.priceRange}
                        onChange={(e) => applyFilter('priceRange', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      >
                        <option value="">Tất cả</option>
                        <option value="low">Dưới 200,000₫</option>
                        <option value="medium">200,000₫ - 400,000₫</option>
                        <option value="high">Trên 400,000₫</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Sắp xếp theo
                      </label>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => applyFilter('sortBy', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      >
                        <option value="">Mặc định</option>
                        <option value="name_asc">Tên A → Z</option>
                        <option value="name_desc">Tên Z → A</option>
                        <option value="price_asc">Giá thấp → cao</option>
                        <option value="price_desc">Giá cao → thấp</option>
                      </select>
                    </div>

                    {activeFilters.length > 0 && (
                      <button
                        onClick={clearAllFilters}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          fontSize: '13px',
                          color: '#4F46E5',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Delete All Button */}
            <button
              className="btn-secondary"
              onClick={handleDeleteAllClick}
              disabled={products.length === 0}
              style={{
                opacity: products.length === 0 ? 0.5 : 1,
                cursor: products.length === 0 ? 'not-allowed' : 'pointer',
                backgroundColor: products.length > 0 ? '#fee2e2' : undefined,
                color: products.length > 0 ? '#dc2626' : undefined,
                borderColor: products.length > 0 ? '#fecaca' : undefined
              }}
            >
              <span>🗑️</span>
              <span>Xóa Tất Cả ({products.length})</span>
            </button>

            {/* Import Button */}
            <button
              className="btn-secondary"
              onClick={handleImportClick}
              disabled={importing}
            >
              <span>📥</span>
              <span>{importing ? 'Đang import...' : 'Import Excel'}</span>
            </button>
            
            {/* Add Product Button */}
            <button
              className="btn-primary"
              onClick={() => setShowAddProduct(!showAddProduct)}
            >
              <span>➕</span>
              <span>Thêm Sản Phẩm</span>
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div style={{ 
            padding: '0 20px 16px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            flexWrap: 'wrap'
          }}>
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                {filter}
                <button
                  onClick={() => removeFilter(filter)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#4F46E5',
                    cursor: 'pointer',
                    padding: '2px',
                    fontSize: '16px',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              style={{
                fontSize: '13px',
                color: '#4F46E5',
                textDecoration: 'underline',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0'
              }}
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {showAddProduct && (
          <ProductForm 
            onSubmit={handleAddProduct}
            onCancel={() => setShowAddProduct(false)}
          />
        )}

        <ProductTable 
          products={currentProducts}
          onUpdate={handleUpdateProduct}
          onDelete={handleDeleteProduct}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={productsWithSTT.length}
        />
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />
          
          <div style={{
            position: 'relative',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '450px',
            width: '100%',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              background: '#FEE2E2',
              borderRadius: '50%'
            }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
            </div>

            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              textAlign: 'center',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              Xác nhận xóa toàn bộ sản phẩm
            </h3>

            <p style={{
              color: '#6B7280',
              textAlign: 'center',
              marginBottom: '24px',
              lineHeight: '1.6',
              margin: '0 0 24px 0'
            }}>
              Bạn có chắc chắn muốn xóa{' '}
              <span style={{ fontWeight: '600', color: '#DC2626' }}>
                TẤT CẢ {products.length} sản phẩm
              </span>{' '}
              trong hệ thống?
              <br />
              <span style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px', display: 'block', fontWeight: '600' }}>
                ⚠️ Hành động này không thể hoàn tác!
              </span>
            </p>

            {/* Progress Bar */}
            {isDeleting && progress.total > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '13px',
                  color: '#6B7280'
                }}>
                  <span>{progress.message}</span>
                  <span>{progress.current}/{progress.total}</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="btn-secondary"
                style={{ flex: 1, opacity: isDeleting ? 0.5 : 1 }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteAll}
                disabled={isDeleting}
                className="btn-primary"
                style={{ 
                  flex: 1,
                  backgroundColor: '#DC2626',
                  borderColor: '#DC2626',
                  opacity: isDeleting ? 0.7 : 1
                }}
              >
                {isDeleting ? 'Đang xóa...' : `Xóa ${products.length} sản phẩm`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Progress Modal */}
      {importing && progress.total > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '100%',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              background: '#EEF2FF',
              borderRadius: '50%'
            }}>
              <span style={{ fontSize: '24px' }}>📥</span>
            </div>

            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              textAlign: 'center',
              margin: '0 0 16px 0'
            }}>
              Đang import sản phẩm
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#6B7280'
              }}>
                <span>{progress.message}</span>
                <span>{progress.current}/{progress.total}</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#E5E7EB',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <p style={{
              fontSize: '13px',
              color: '#9CA3AF',
              textAlign: 'center',
              margin: 0
            }}>
              Vui lòng đợi, không đóng cửa sổ này...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsTab;