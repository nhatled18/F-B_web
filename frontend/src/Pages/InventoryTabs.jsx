import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Package, 
  DollarSign, 
  AlertTriangle,
  Filter,
  Upload,
  Download,
  Trash2,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { inventoryService } from '../Services/InventoryServices';
import "../assets/styles/Product.css";
import "../assets/styles/Common.css";
import SearchBox from '../Components/SearchBox';
import ProductInventoryForm from '../Components/ProductInventoryForm';
import ProductInventoryTable from '../Components/ProductInventoryTable';
import Pagination from '../Components/Pagination';

function InventoryTab({ 
  inventories, 
  setInventories,
  products,
  onAddInventory, 
  onUpdateInventory, 
  onDeleteInventory, 
  onRefreshData
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Delete All States
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({
    group: '',
    stockType1: '',
    stockLevel: '',
    sortBy: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Progress State
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  
  const itemsPerPage = 10;
  const fileInputRef = useRef(null);

  // ========== BATCH PROCESSING HELPER ==========
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

  // ========== FILTER INVENTORIES ==========
  const getProductInfo = (productId) => {
    return products.find(p => p.id === productId) || {};
  };

  let filteredInventories = inventories.filter(inv => {
    const product = getProductInfo(inv.productId);
    const name = product.productName || "";
    const sku = product.sku || "";
    const group = product.group || "";
    const term = searchTerm?.toLowerCase() || "";
    return name.toLowerCase().includes(term) || 
           sku.toLowerCase().includes(term) || 
           group.toLowerCase().includes(term);
  });
  console.log('inventories:', inventories);
  // Apply filters
  if (filters.group) {
    filteredInventories = filteredInventories.filter(inv => {
      const product = getProductInfo(inv.productId);
      return product.group === filters.group;
    });
  }

  if (filters.stockType1) {
    filteredInventories = filteredInventories.filter(inv => inv.stockType1 === filters.stockType1);
  }
  
  if (filters.stockLevel) {
    if (filters.stockLevel === 'low') {
      filteredInventories = filteredInventories.filter(inv => (inv.endingStock || 0) < 50);
    } else if (filters.stockLevel === 'medium') {
      filteredInventories = filteredInventories.filter(inv => (inv.endingStock || 0) >= 50 && (inv.endingStock || 0) <= 200);
    } else if (filters.stockLevel === 'high') {
      filteredInventories = filteredInventories.filter(inv => (inv.endingStock || 0) > 200);
    }
  }

  // Apply sorting
  if (filters.sortBy) {
    if (filters.sortBy === 'name_asc') {
      filteredInventories.sort((a, b) => {
        const prodA = getProductInfo(a.productId);
        const prodB = getProductInfo(b.productId);
        return (prodA.productName || '').localeCompare(prodB.productName || '');
      });
    } else if (filters.sortBy === 'name_desc') {
      filteredInventories.sort((a, b) => {
        const prodA = getProductInfo(a.productId);
        const prodB = getProductInfo(b.productId);
        return (prodB.productName || '').localeCompare(prodA.productName || '');
      });
    } else if (filters.sortBy === 'stock_asc') {
      filteredInventories.sort((a, b) => (a.endingStock || 0) - (b.endingStock || 0));
    } else if (filters.sortBy === 'stock_desc') {
      filteredInventories.sort((a, b) => (b.endingStock || 0) - (a.endingStock || 0));
    } else if (filters.sortBy === 'value_asc') {
      filteredInventories.sort((a, b) => {
        const valueA = (a.endingStock || 0) * (a.cost || 0);
        const valueB = (b.endingStock || 0) * (b.cost || 0);
        return valueA - valueB;
      });
    } else if (filters.sortBy === 'value_desc') {
      filteredInventories.sort((a, b) => {
        const valueA = (a.endingStock || 0) * (a.cost || 0);
        const valueB = (b.endingStock || 0) * (b.cost || 0);
        return valueB - valueA;
      });
    }
  }

  // Add STT to filtered inventories
  const inventoriesWithSTT = filteredInventories.map((inventory, index) => ({
    ...inventory,
    stt: index + 1
  }));

  // Pagination
  const totalPages = Math.ceil(inventoriesWithSTT.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInventories = inventoriesWithSTT.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // ========== FILTER FUNCTIONS ==========
  const groups = [...new Set(products.map(p => p.group).filter(Boolean))];
  const stockTypes = [...new Set(inventories.map(inv => inv.stockType1).filter(Boolean))];

  const applyFilter = (type, value) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
    
    const active = [];
    if (newFilters.group) active.push(`Nhóm: ${newFilters.group}`);
    if (newFilters.stockType1) active.push(`Loại kho: ${newFilters.stockType1}`);
    if (newFilters.stockLevel) {
      const stockLabels = { low: 'Dưới 50', medium: '50-200', high: 'Trên 200' };
      active.push(`Tồn kho: ${stockLabels[newFilters.stockLevel]}`);
    }
    if (newFilters.sortBy) {
      const sortLabels = {
        name_asc: 'Tên A-Z', name_desc: 'Tên Z-A',
        stock_asc: 'Tồn kho tăng dần', stock_desc: 'Tồn kho giảm dần',
        value_asc: 'Giá trị tăng dần', value_desc: 'Giá trị giảm dần'
      };
      active.push(`Sắp xếp: ${sortLabels[newFilters.sortBy]}`);
    }
    
    setActiveFilters(active);
  };

  const removeFilter = (filterText) => {
    const newFilters = { ...filters };
    if (filterText.includes('Nhóm:')) newFilters.group = '';
    else if (filterText.includes('Loại kho:')) newFilters.stockType1 = '';
    else if (filterText.includes('Tồn kho:')) newFilters.stockLevel = '';
    else if (filterText.includes('Sắp xếp:')) newFilters.sortBy = '';
    
    setFilters(newFilters);
    const active = activeFilters.filter(f => f !== filterText);
    setActiveFilters(active);
  };

  const clearAllFilters = () => {
    setFilters({ group: '', stockType1: '', stockLevel: '', sortBy: '' });
    setActiveFilters([]);
  };

  // ========== DELETE ALL FUNCTIONS ==========
  const handleDeleteAllClick = () => {
    if (inventories.length === 0) {
      alert('Không có dữ liệu tồn kho nào để xóa!');
      return;
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    setProgress({ current: 0, total: inventories.length, message: 'Đang chuẩn bị xóa...' });
    
    try {
      console.log(`🗑️ Bắt đầu xóa ${inventories.length} bản ghi tồn kho...`);
      
      const results = await processBatch(
        inventories,
        10,
        500,
        (inventory) => inventoryService.delete(inventory.id),
        'Đang xóa tồn kho'
      );

      const success = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length > 0) {
        console.warn(`❌ ${failed.length} bản ghi xóa lỗi`);
      }

      if (onRefreshData) {
        await onRefreshData();
      }

      setShowDeleteModal(false);
      setProgress({ current: 0, total: 0, message: '' });
      
      alert(`✅ Xóa hoàn tất!\n\n✓ Thành công: ${success.length}\n✗ Lỗi: ${failed.length}`);
    } catch (error) {
      console.error('Error deleting inventories:', error);
      alert('Có lỗi khi xóa dữ liệu tồn kho. Vui lòng thử lại!');
    } finally {
      setIsDeleting(false);
      setProgress({ current: 0, total: 0, message: '' });
    }
  };

  // ========== INVENTORY CRUD FUNCTIONS ==========
  const handleAddInventory = async (newInventory) => {
    try {
      const response = await inventoryService.create(newInventory);
      if (onAddInventory) {
        onAddInventory(response.data);
      } else {
        setInventories([...inventories, response.data]);
      }
      setShowAddForm(false);
      if (onRefreshData) {
        await onRefreshData();
      }
      alert('Thêm tồn kho thành công!');
    } catch (error) {
      console.error('Error adding inventory:', error);
      alert('Có lỗi khi thêm tồn kho. Vui lòng thử lại!');
    }
  };

  const handleUpdateInventory = async (id, updatedInventory) => {
    try {
      const response = await inventoryService.update(id, updatedInventory);
      if (onUpdateInventory) {
        onUpdateInventory(id, response.data);
      } else {
        setInventories(inventories.map(inv => inv.id === id ? response.data : inv));
      }
      if (onRefreshData) {
        await onRefreshData();
      }
      alert('Cập nhật tồn kho thành công!');
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Có lỗi khi cập nhật tồn kho. Vui lòng thử lại!');
    }
  };

  const handleDeleteInventory = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi tồn kho này?')) {
      try {
        await inventoryService.delete(id);
        if (onDeleteInventory) {
          onDeleteInventory(id);
        } else {
          setInventories(inventories.filter(inv => inv.id !== id));
        }
        if (onRefreshData) {
          await onRefreshData();
        }
        alert('Xóa tồn kho thành công!');
      } catch (error) {
        console.error('Error deleting inventory:', error);
        alert('Có lỗi khi xóa tồn kho. Vui lòng thử lại!');
      }
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

      const importedInventories = [];
      const errors = [];

      jsonData.forEach((row, index) => {
        try {
          const sku = row['SKU'] ? String(row['SKU']).trim() : '';
          const product = products.find(p => p.sku === sku);
          
          if (!product) {
            errors.push(`Dòng ${index + 2}: Không tìm thấy sản phẩm với SKU "${sku}"`);
            return;
          }

          const initialStock = row['TỒN KHO ĐẦU'] ? Number(row['TỒN KHO ĐẦU']) : 0;
          const stockIn = row['TỔNG NHẬP'] ? Number(row['TỔNG NHẬP']) : 0;
          const stockOut = row['TỔNG XUẤT'] ? Number(row['TỔNG XUẤT']) : 0;
          const damaged = row['HỎNG/LỖI'] ? Number(row['HỎNG/LỖI']) : 0;
          const endingStock = initialStock + stockIn - stockOut - damaged;

          const inventory = {
            productId: product.id,
            stockType1: row['PHÂN LOẠI KHO'] ? String(row['PHÂN LOẠI KHO']).trim() : '',
            stockType2: row['PHÂN LOẠI CHI TIẾT'] ? String(row['PHÂN LOẠI CHI TIẾT']).trim() : '',
            retailPrice: row['GIÁ NIÊM YẾT'] ? Number(row['GIÁ NIÊM YẾT']) : 0,
            cost: row['GIÁ VỐN'] ? Number(row['GIÁ VỐN']) : 0,
            initialStock: initialStock,
            displayStock: row['TRƯNG BÀY'] ? Number(row['TRƯNG BÀY']) : 0,
            stockIn: stockIn,
            stockOut: stockOut,
            damaged: damaged,
            endingStock: endingStock,
            note: row['GHI CHÚ'] ? String(row['GHI CHÚ']).trim() : ''
          };

          if (isNaN(inventory.cost) || inventory.cost < 0) {
            errors.push(`Dòng ${index + 2}: Giá vốn không hợp lệ`);
            return;
          }
          if (isNaN(inventory.retailPrice) || inventory.retailPrice < 0) {
            errors.push(`Dòng ${index + 2}: Giá niêm yết không hợp lệ`);
            return;
          }

          importedInventories.push(inventory);
        } catch (error) {
          errors.push(`Dòng ${index + 2}: Lỗi xử lý dữ liệu - ${error.message}`);
        }
      });

      if (errors.length > 0) {
        const errorMessage = `Có ${errors.length} lỗi khi import:\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... và ${errors.length - 5} lỗi khác` : ''}`;
        alert(errorMessage);
      }

      if (importedInventories.length > 0) {
        if (confirm(`Tìm thấy ${importedInventories.length} bản ghi hợp lệ. Bạn có muốn import không?`)) {
          try {
            console.log(`📥 Bắt đầu import ${importedInventories.length} tồn kho...`);
            
            const results = await processBatch(
              importedInventories,
              10,
              500,
              (inventory) => inventoryService.create(inventory),
              'Đang import tồn kho'
            );

            const success = results.filter(r => r.status === 'fulfilled');
            const failed = results.filter(r => r.status === 'rejected');

            if (failed.length > 0) {
              console.warn(`❌ ${failed.length} tồn kho import lỗi`);
            }

            if (onRefreshData) {
              await onRefreshData();
            }
            
            setCurrentPage(1);
            alert(`✅ Import hoàn tất!\n\n✓ Thành công: ${success.length}\n✗ Lỗi: ${failed.length}`);
          } catch (error) {
            console.error('Error importing inventories:', error);
            alert('Có lỗi khi import tồn kho. Vui lòng thử lại!');
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

  // ========== EXPORT EXCEL FUNCTION ==========
  const handleExportClick = () => {
    try {
      const exportData = inventoriesWithSTT.map(inv => {
        const product = getProductInfo(inv.productId);
        return {
          'STT': inv.stt,
          'NHÓM': product.group || '',
          'SKU': product.sku || '',
          'TÊN SẢN PHẨM': product.productName || '',
          'PHÂN LOẠI KHO': inv.stockType1 || '',
          'PHÂN LOẠI CHI TIẾT': inv.stockType2 || '',
          'GIÁ NIÊM YẾT': inv.retailPrice || 0,
          'GIÁ VỐN': inv.cost || 0,
          'TỒN KHO ĐẦU': inv.initialStock || 0,
          'TRƯNG BÀY': inv.displayStock || 0,
          'TỔNG NHẬP': inv.stockIn || 0,
          'TỔNG XUẤT': inv.stockOut || 0,
          'HỎNG/LỖI': inv.damaged || 0,
          'TỒN KHO': inv.endingStock || 0,
          'GIÁ TRỊ TỒN KHO': (inv.endingStock || 0) * (inv.cost || 0),
          'GHI CHÚ': inv.note || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tồn kho');
      
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `ton-kho-${date}.xlsx`);
      
      alert('Export thành công!');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Có lỗi khi export dữ liệu!');
    }
  };

  // Calculate summary statistics
  const totalItems = inventoriesWithSTT.length;
  const totalValue = inventoriesWithSTT.reduce((sum, inv) => sum + (inv.endingStock * inv.cost), 0);
  const lowStockCount = inventoriesWithSTT.filter(inv => inv.endingStock < 50).length;

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '20px' 
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Package size={28} />
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Tổng sản phẩm</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalItems}</div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <DollarSign size={28} />
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Giá trị tồn kho</div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {(totalValue / 1000000).toFixed(1)}M
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertTriangle size={28} />
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Tồn kho thấp</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{lowStockCount}</div>
        </div>
      </div>

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
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Filter size={18} />
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
                  right: '320px',
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
                        Lọc tồn kho
                      </h3>
                      <button
                        onClick={() => setShowFilterMenu(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6b7280',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={20} />
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
                        Phân loại kho
                      </label>
                      <select
                        value={filters.stockType1}
                        onChange={(e) => applyFilter('stockType1', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      >
                        <option value="">Tất cả loại</option>
                        {stockTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Mức tồn kho
                      </label>
                      <select
                        value={filters.stockLevel}
                        onChange={(e) => applyFilter('stockLevel', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      >
                        <option value="">Tất cả</option>
                        <option value="low">Dưới 50</option>
                        <option value="medium">50 - 200</option>
                        <option value="high">Trên 200</option>
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
                        <option value="name_asc">Tên A-Z</option>
                        <option value="name_desc">Tên Z-A</option>
                        <option value="stock_asc">Tồn kho tăng dần</option>
                        <option value="stock_desc">Tồn kho giảm dần</option>
                        <option value="value_asc">Giá trị tăng dần</option>
                        <option value="value_desc">Giá trị giảm dần</option>
                      </select>
                    </div>

                    {activeFilters.length > 0 && (
                      <button
                        onClick={clearAllFilters}
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#6b7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <X size={16} />
                        Xóa tất cả bộ lọc
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            <button
              className="btn-import"
              onClick={handleImportClick}
              disabled={importing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              <span>{importing ? 'Đang import...' : 'Import'}</span>
            </button>
            
            <button
              className="btn-export"
              onClick={handleExportClick}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={18} />
              <span>Export</span>
            </button>
            
            <button
              className="btn-danger"
              onClick={handleDeleteAllClick}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={18} />
              <span>Xóa Tất Cả</span>
            </button>
            
            <button
              className="btn-primary"
              onClick={() => setShowAddForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={18} />
              <span>Thêm Tồn Kho</span>
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div style={{ 
            padding: '12px 20px', 
            background: '#f9fafb', 
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Đang lọc:
            </span>
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                style={{
                  background: '#4F46E5',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {filter}
                <button
                  onClick={() => removeFilter(filter)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0'
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {(importing || isDeleting) && progress.total > 0 && (
          <div style={{ 
            padding: '16px 20px', 
            background: '#f0f9ff', 
            borderBottom: '1px solid #bae6fd' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '8px',
              fontSize: '13px',
              color: '#0369a1',
              alignItems: 'center'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="animate-spin" />
                {progress.message}
              </span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: '#e0f2fe', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${(progress.current / progress.total) * 100}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
        />

        {showAddForm && (
          <ProductInventoryForm
            products={products}
            onSubmit={handleAddInventory}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        <ProductInventoryTable
          inventories={currentInventories}
          products={products}
          onUpdate={handleUpdateInventory}
          onDelete={handleDeleteInventory}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <div 
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={24} color="#dc2626" />
                </div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: '#dc2626'
                }}>
                  Xác nhận xóa tất cả
                </h3>
              </div>
              
              <p style={{ 
                margin: '0 0 20px 0', 
                fontSize: '14px', 
                color: '#4b5563',
                lineHeight: '1.6'
              }}>
                Bạn có chắc chắn muốn xóa <strong>{inventories.length} bản ghi</strong> tồn kho?
                <br /><br />
                <span style={{ color: '#dc2626', fontWeight: '500' }}>
                  Hành động này không thể hoàn tác!
                </span>
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <X size={16} />
                  Hủy
                </button>
                
                <button
                  onClick={handleConfirmDeleteAll}
                  disabled={isDeleting}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#dc2626',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Xóa tất cả
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default InventoryTab;