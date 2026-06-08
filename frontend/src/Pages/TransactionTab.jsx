import React, { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  Search, 
  Trash2, 
  FileSpreadsheet, 
  Plus,
  Edit2,
  Calendar,
  DollarSign,
  Box,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  BarChart3,
  PackageOpen,
  Inbox
} from 'lucide-react';
import ImportManagement from '../Components/ImportManagement';
import ExportManagement from '../Components/ExportManagement';
import AdjustmentForm from '../Components/AdjustmentForm';
import { transactionService } from '../Services/TransactionServices';
import "../assets/styles/TransactionTab.css";

function TransactionTab({ 
  products = [], 
  currentUser, 
  type = 'export',
  defaultType = 'export',
  onTransactionComplete  // ✅ FIX 1: Thêm prop callback
}) {
  const transactionType = type || defaultType;
  const isImport = transactionType === 'import';
  const isAdjust = transactionType === 'adjust';
  const isExport = transactionType === 'export';
  const lastColumnTitle = isImport ? 'NGUỒN NHẬP' : 'LÝ DO XUẤT';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [rows, setRows] = useState([{
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    transactionCode: '',
    summary: '',
    createdBy: currentUser?.name || '',
    sku: '',
    productName: '',
    quantity: '',
    unitPrice: '',
    reason: '',
    note: ''
  }]);
  const [processing, setProcessing] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [localTransactions, setLocalTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Batch progress states
  const [showBatchProgress, setShowBatchProgress] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    action: '',
    percentage: 0
  });

  // OPTIMIZED BATCH SIZES for Vercel Serverless
  const BATCH_CONFIG = {
    IMPORT_EXCEL: 20,
    SUBMIT_BATCH: 25,
    DELETE_BATCH: 50,
    DELAY_MS: 500
  };

  useEffect(() => {
    loadTransactions();
  }, [transactionType]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      if (isAdjust) {
        setLocalTransactions([]);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
      
      const response = await transactionService.getByType(transactionType);
      
      const transactionsData = Array.isArray(response.data) 
        ? response.data 
        : (Array.isArray(response.data?.data) ? response.data.data : []);
      
      console.log('✅ Loaded transactions:', transactionsData.length, 'items');
      
      setLocalTransactions(transactionsData);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setLocalTransactions([]);
      alert('❌ Không thể tải dữ liệu giao dịch: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const groups = ['all', ...new Set(products.map(p => p.group).filter(Boolean))];

  const filteredTransactions = localTransactions.filter(t => {
    const matchSearch = !searchTerm || 
      t.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.transactionCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = filterGroup === 'all' || t.group === filterGroup;
    return matchSearch && matchGroup;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';

  const stats = {
    total: filteredTransactions.length,
    totalAmount: filteredTransactions.reduce((sum, t) => sum + (t.quantity * t.unitPrice || 0), 0),
    totalProducts: new Set(filteredTransactions.map(t => t.productName)).size,
    thisMonth: filteredTransactions.filter(t => {
      const date = new Date(t.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length
  };

  const handleImportExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        console.log('❌ No file selected');
        return;
      }
      console.log('🎯 Uploading with type:', transactionType);
      
      console.log('📁 File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(file.type)) {
        alert('❌ Chỉ chấp nhận file Excel (.xlsx, .xls)');
        return;
      }

      try {
        setProcessing(true);
        
        setShowBatchProgress(true);
        setBatchProgress({
          current: 0,
          total: 100,
          action: 'Đang đọc file Excel...',
          percentage: 0
        });
        
        console.log('🚀 Starting upload with type:', transactionType);
        console.log(`📦 Using batch size: ${BATCH_CONFIG.IMPORT_EXCEL} items per batch`);
        
        setBatchProgress({
          current: 1,
          total: 3,
          action: 'Đang xử lý file Excel...',
          percentage: 33
        });
        
        const response = await transactionService.importExcel(file, transactionType);
        
        setBatchProgress({
          current: 2,
          total: 3,
          action: 'Đang lưu vào database...',
          percentage: 66
        });
        
        console.log('✅ Full Upload response:', response);
        console.log('📊 Response data:', response.data);
        
        const data = response.data?.data || response.data;
        const count = data?.successCount || 0;
        const failedCount = data?.failedCount || 0;
        const failedItems = data?.failedItems || [];
        const detectedType = data?.detectedType || transactionType;
        const columnMapping = data?.columnMapping || {};
        
        setBatchProgress({
          current: 3,
          total: 3,
          action: 'Hoàn tất!',
          percentage: 100
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setShowBatchProgress(false);
        
        console.log('📈 Import summary:', {
          successCount: count,
          failedCount: failedCount,
          detectedType: detectedType,
          columnMapping: columnMapping,
          failedItems: failedItems
        });
        
        if (count === 0 && failedCount === 0) {
          alert('⚠️ Không có dữ liệu để import!\n\n' +
                'Vui lòng kiểm tra:\n' +
                '- File có dữ liệu (không chỉ có header)?\n' +
                '- Cột "TÊN SẢN PHẨM" và "SL" có giá trị?\n' +
                '- Format file đúng Excel (.xlsx)?');
        } else if (failedCount > 0 && count === 0) {
          const errorDetails = failedItems.slice(0, 10).map((item, idx) => 
            `${idx + 1}. Row ${item.row}: ${item.error}`
          ).join('\n');
          
          alert(`❌ Import THẤT BẠI - Tất cả ${failedCount} dòng bị lỗi!\n\n` +
                `Chi tiết lỗi (10 dòng đầu):\n${errorDetails}\n\n` +
                `Detected Type: ${detectedType}\n` +
                `Column Mapping: ${JSON.stringify(columnMapping, null, 2)}`);
        } else if (failedCount > 0 && count > 0) {
          const errorDetails = failedItems.slice(0, 5).map((item, idx) => 
            `${idx + 1}. Row ${item.row}: ${item.error}`
          ).join('\n');
          
          alert(`⚠️ Import hoàn tất với một số lỗi!\n\n` +
                `✅ Thành công: ${count}\n` +
                `❌ Thất bại: ${failedCount}\n\n` +
                `Chi tiết lỗi (5 dòng đầu):\n${errorDetails}`);
        } else {
          alert(`✅ Import thành công ${count} giao dịch ${detectedType === 'import' ? 'nhập' : 'xuất'} kho!`);
        }
        
        if (count > 0) {
          await loadTransactions();
          
          // ✅ FIX 2: Gọi callback để Dashboard refresh inventory
          if (onTransactionComplete) {
            console.log('🔄 [TRANSACTION] Triggering Dashboard refresh...');
            await onTransactionComplete();
          }
        }
        
      } catch (error) {
        console.error('❌ Error importing:', error);
        console.error('Error response:', error.response);
        console.error('Error data:', error.response?.data);
        
        setShowBatchProgress(false);
        
        const errorData = error.response?.data;
        const errorMsg = errorData?.error || 
                        errorData?.message || 
                        error.message || 
                        'Lỗi không xác định';
        
        const errorDetails = errorData?.details || '';
        
        alert('❌ Lỗi import Excel:\n\n' + 
              errorMsg + 
              (errorDetails ? '\n\nChi tiết:\n' + errorDetails : ''));
      } finally {
        setProcessing(false);
      }
    };
    input.click();
  };

  const handleEditTransaction = (transaction) => {
    console.log('✏️ Editing transaction:', transaction);
    
    setEditingTransaction(transaction);
    
    setRows([{
      id: transaction.id,
      date: transaction.date,
      transactionCode: transaction.transactionCode || '',
      summary: transaction.summary || '',
      createdBy: transaction.createdBy || currentUser?.name || '',
      sku: transaction.sku || '',
      productName: transaction.productName || '',
      quantity: transaction.quantity || '',
      unitPrice: transaction.unitPrice || '',
      reason: transaction.reason || '',
      note: transaction.note || ''
    }]);
    
    setShowImportModal(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('⚠️ Bạn có chắc muốn xóa giao dịch này?')) return;

    try {
      setProcessing(true);
      await transactionService.delete(id);
      
      alert('✅ Đã xóa giao dịch!');
      await loadTransactions();
      
      // ✅ FIX 3: Refresh inventory sau khi xóa
      if (onTransactionComplete) {
        console.log('🔄 [TRANSACTION] Triggering Dashboard refresh after delete...');
        await onTransactionComplete();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('❌ Có lỗi khi xóa: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitAll = async () => {
    const validRows = rows.filter(r => r.productName && r.quantity);
    if (validRows.length === 0) {
      alert('⚠️ Không có dòng hợp lệ để xử lý!');
      return;
    }
    if (!window.confirm(`Xác nhận ${isImport ? 'nhập' : 'xuất'} ${validRows.length} sản phẩm?`)) return;

    setProcessing(true);
    
    try {
      const BATCH_SIZE = BATCH_CONFIG.SUBMIT_BATCH;
      const batches = [];
      
      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        batches.push(validRows.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE} items each`);
      
      setShowBatchProgress(true);
      setBatchProgress({
        current: 0,
        total: batches.length,
        action: `Đang ${isImport ? 'nhập' : 'xuất'} kho - Batch`,
        percentage: 0
      });
      
      let totalSuccess = 0;
      let totalFailed = 0;
      const allFailedItems = [];
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`🔄 Processing batch ${i + 1}/${batches.length}...`);
        
        setBatchProgress({
          current: i,
          total: batches.length,
          action: `Đang ${isImport ? 'nhập' : 'xuất'} kho - Batch ${i + 1}/${batches.length}`,
          percentage: Math.round((i / batches.length) * 100)
        });
        
        const transactionsToCreate = batch.map(row => ({
          date: row.date,
          transactionCode: row.transactionCode,
          summary: row.summary,
          createdBy: row.createdBy,
          sku: row.sku,
          productName: row.productName,
          quantity: parseFloat(row.quantity),
          unitPrice: parseFloat(row.unitPrice) || 0,
          reason: row.reason,
          note: row.note,
          type: transactionType
        }));

        try {
          const response = await transactionService.createBatch(transactionsToCreate);
          const result = response.data;
          
          totalSuccess += result.successCount || 0;
          totalFailed += result.failedCount || 0;
          
          if (result.failedItems && result.failedItems.length > 0) {
            allFailedItems.push(...result.failedItems);
          }
          
          console.log(`✅ Batch ${i + 1} completed: ${result.successCount} success, ${result.failedCount} failed`);
          
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.DELAY_MS));
          }
        } catch (batchError) {
          console.error(`❌ Batch ${i + 1} failed:`, batchError);
          totalFailed += batch.length;
        }
      }
      
      setBatchProgress({
        current: batches.length,
        total: batches.length,
        action: 'Hoàn tất!',
        percentage: 100
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowBatchProgress(false);
      
      console.log(`📊 Final results: ${totalSuccess} success, ${totalFailed} failed`);
      
      if (totalFailed > 0) {
        const errorDetails = allFailedItems.slice(0, 10).map((item, idx) => 
          `${idx + 1}. ${item.data?.productName || 'Unknown'}: ${item.error}`
        ).join('\n');
        
        alert(`⚠️ Có ${totalFailed}/${validRows.length} giao dịch thất bại!\n\n` +
              `✅ Thành công: ${totalSuccess}\n` +
              `❌ Thất bại: ${totalFailed}\n\n` +
              `Chi tiết lỗi (10 dòng đầu):\n${errorDetails}\n\n` +
              `Batch size: ${BATCH_SIZE} items/batch`);
      } else {
        alert(`✅ ${isImport ? 'Nhập' : 'Xuất'} kho thành công ${totalSuccess} sản phẩm!\n\n` +
              `📦 Đã xử lý: ${batches.length} batches (${BATCH_SIZE} items/batch)`);
      }

      await loadTransactions();
      
      // ✅ FIX 4: Gọi callback để Dashboard refresh inventory
      if (onTransactionComplete) {
        console.log('🔄 [TRANSACTION] Triggering Dashboard refresh after manual submit...');
        await onTransactionComplete();
      }
      
      setRows([{
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        transactionCode: '',
        summary: '',
        createdBy: currentUser?.name || '',
        sku: '',
        productName: '',
        quantity: '',
        unitPrice: '',
        reason: '',
        note: ''
      }]);
      
      setShowImportModal(false);

    } catch (error) {
      console.error('❌ Error submitting transactions:', error);
      setShowBatchProgress(false);
      alert('❌ Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveEditTransaction = async () => {
    if (!editingTransaction) return;
    
    const updatedRow = rows[0];
    
    if (!updatedRow.productName || !updatedRow.quantity) {
      alert('⚠️ Vui lòng điền đầy đủ tên sản phẩm và số lượng!');
      return;
    }

    if (!window.confirm('💾 Xác nhận lưu thay đổi?')) return;

    setProcessing(true);
    try {
      const updatedData = {
        date: updatedRow.date,
        transactionCode: updatedRow.transactionCode,
        summary: updatedRow.summary,
        createdBy: updatedRow.createdBy,
        sku: updatedRow.sku,
        productName: updatedRow.productName,
        quantity: parseFloat(updatedRow.quantity),
        unitPrice: parseFloat(updatedRow.unitPrice),
        reason: updatedRow.reason,
        note: updatedRow.note,
        type: transactionType
      };

      await transactionService.update(editingTransaction.id, updatedData);

      alert('✅ Đã cập nhật giao dịch thành công!');
      
      await loadTransactions();
      
      // ✅ FIX 5: Refresh inventory sau khi edit
      if (onTransactionComplete) {
        console.log('🔄 [TRANSACTION] Triggering Dashboard refresh after edit...');
        await onTransactionComplete();
      }

      setShowImportModal(false);
      setEditingTransaction(null);
      setRows([{
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        transactionCode: '',
        summary: '',
        createdBy: currentUser?.name || '',
        sku: '',
        productName: '',
        quantity: '',
        unitPrice: '',
        reason: '',
        note: ''
      }]);

    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('❌ Có lỗi khi cập nhật: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAllFiltered = async () => {
    if (filteredTransactions.length === 0) {
      alert('⚠️ Không có giao dịch nào để xóa!');
      return;
    }

    if (!window.confirm(`⚠️ Bạn có chắc muốn xóa TẤT CẢ ${filteredTransactions.length} giao dịch đã lọc?\n\n⚠️ Hành động này không thể hoàn tác!`)) return;

    try {
      setProcessing(true);
      const filteredIds = filteredTransactions.map(t => t.id);
      
      const BATCH_SIZE = BATCH_CONFIG.DELETE_BATCH;
      const batches = [];
      
      for (let i = 0; i < filteredIds.length; i += BATCH_SIZE) {
        batches.push(filteredIds.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`🗑️ Deleting ${batches.length} batches of ${BATCH_SIZE} items each`);
      
      setShowBatchProgress(true);
      setBatchProgress({
        current: 0,
        total: batches.length,
        action: 'Đang xóa sản phẩm - Batch',
        percentage: 0
      });
      
      for (let i = 0; i < batches.length; i++) {
        console.log(`🔄 Deleting batch ${i + 1}/${batches.length}...`);
        
        setBatchProgress({
          current: i,
          total: batches.length,
          action: `Đang xóa sản phẩm - Batch ${i + 1}/${batches.length}`,
          percentage: Math.round((i / batches.length) * 100)
        });
        
        await transactionService.deleteMany(batches[i]);
        
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.DELAY_MS));
        }
      }
      
      setBatchProgress({
        current: batches.length,
        total: batches.length,
        action: 'Hoàn tất!',
        percentage: 100
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowBatchProgress(false);
      
      alert(`✅ Đã xóa ${filteredTransactions.length} giao dịch!\n\n` +
            `🗑️ Đã xử lý: ${batches.length} batches (${BATCH_SIZE} items/batch)`);
      
      await loadTransactions();
      
      // ✅ FIX 6: Refresh inventory sau khi xóa hàng loạt
      if (onTransactionComplete) {
        console.log('🔄 [TRANSACTION] Triggering Dashboard refresh after batch delete...');
        await onTransactionComplete();
      }
    } catch (error) {
      console.error('Error deleting all:', error);
      setShowBatchProgress(false);
      alert('❌ Có lỗi khi xóa: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredTransactions.length)} / {filteredTransactions.length} giao dịch
        </div>
        
        <div className="pagination-controls">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft size={16} />
          </button>
          
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          {startPage > 1 && (
            <>
              <button className="pagination-button" onClick={() => handlePageChange(1)}>
                1
              </button>
              {startPage > 2 && <span style={{padding: '0 8px'}}>...</span>}
            </>
          )}
          
          {pageNumbers.map(num => (
            <button
              key={num}
              className={`pagination-button ${currentPage === num ? 'active' : ''}`}
              onClick={() => handlePageChange(num)}
            >
              {num}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span style={{padding: '0 8px'}}>...</span>}
              <button className="pagination-button" onClick={() => handlePageChange(totalPages)}>
                {totalPages}
              </button>
            </>
          )}
          
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
          
          <button
            className="pagination-button"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight size={16} />
          </button>
          
          <select 
            className="page-size-select"
            value={pageSize} 
            onChange={handlePageSizeChange}
          >
            <option value="10">10 / trang</option>
            <option value="20">20 / trang</option>
            <option value="50">50 / trang</option>
            <option value="100">100 / trang</option>
          </select>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="loading-icon">
            <Package size={48} className="animate-pulse" />
          </div>
          <div className="loading-text">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-container">
      {/* ✅ ĐIỀU CHỈNH KHO - Hiển thị form trực tiếp */}
      {isAdjust ? (
        <div className="header-card">
          <AdjustmentForm
            products={products}
            currentUser={currentUser}
            onComplete={async () => {
              await loadTransactions();
              if (onTransactionComplete) {
                await onTransactionComplete();
              }
            }}
          />
        </div>
      ) : (
        <>
          {/* ✅ NHẬP/XUẤT KHO - Hiển thị bảng + modal */}
          <div className="header-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 className={`header-title ${isImport ? 'import' : 'export'}`}>
                  {isImport ? <Inbox size={32} style={{display: 'inline', marginRight: '8px'}} /> : <PackageOpen size={32} style={{display: 'inline', marginRight: '8px'}} />}
                  {isImport ? 'Quản Lý Nhập Kho' : 'Quản Lý Xuất Kho'}
                </h1>
                <p className="header-subtitle">
                  Theo dõi và quản lý các giao dịch {isImport ? 'nhập' : 'xuất'} kho một cách dễ dàng
                </p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stats-card">
                <div className="stats-icon">
                  <BarChart3 size={28} />
                </div>
                <div className="stats-value">{stats.total}</div>
                <div className="stats-label">Tổng giao dịch</div>
              </div>

              <div className="stats-card">
                <div className="stats-icon">
                  <DollarSign size={28} />
                </div>
                <div className={`stats-value currency ${isImport ? 'import-color' : 'export-color'}`}>
                  {formatCurrency(stats.totalAmount)}
                </div>
                <div className="stats-label">Tổng giá trị</div>
              </div>

              <div className="stats-card">
                <div className="stats-icon">
                  <Box size={28} />
                </div>
                <div className="stats-value">{stats.totalProducts}</div>
                <div className="stats-label">Loại nguyên liệu</div>
              </div>

              <div className="stats-card">
                <div className="stats-icon">
                  <Calendar size={28} />
                </div>
                <div className="stats-value">{stats.thisMonth}</div>
                <div className="stats-label">Tháng này</div>
              </div>
            </div>

            <div className="action-bar">
              <div className="search-wrapper">
                <div className="search-icon">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm mã phiếu, SKU, tên sản phẩm..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="select-wrapper">
                <Filter size={16} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280'}} />
                <select
                  className="select-dropdown"
                  value={filterGroup}
                  onChange={e => setFilterGroup(e.target.value)}
                  style={{paddingLeft: '36px'}}
                >
                  {groups.map(g => (
                    <option key={g} value={g}>
                      {g === 'all' ? 'Tất cả nhóm' : g}
                    </option>
                  ))}
                </select>
                <div className="select-arrow">▼</div>
              </div>

              <button
                className="action-button delete"
                onClick={handleDeleteAllFiltered}
                disabled={processing}
              >
                <Trash2 size={18} />
                <span>Xóa ({filteredTransactions.length})</span>
              </button>

              <button 
                className="action-button import"
                onClick={handleImportExcel} 
                disabled={processing}
              >
                <FileSpreadsheet size={18} />
                <span>Import Excel</span>
              </button>

              <button 
                className="action-button add"
                onClick={() => setShowImportModal(true)} 
                disabled={processing}
              >
                <Plus size={18} />
                <span>{isImport ? 'Thêm Phiếu Nhập' : 'Thêm Phiếu Xuất'}</span>
              </button>
            </div>
          </div>

          <div className="table-container">
            <div className="table-wrapper">
              <table className="data-table">
                <thead className="table-header">
                  <tr>
                    <th>THỜI GIAN</th>
                    <th>MÃ PHIẾU {isImport ? 'NHẬP' : 'XUẤT'}</th>
                    <th>DIỄN GIẢI</th>
                    <th>THỦ KHO</th>
                    <th>MÃ NL</th>
                    <th>TÊN NGUYÊN LIỆU</th>
                    <th>SỐ LƯỢNG</th>
                    <th>ĐƠN GIÁ</th>
                    <th>THÀNH TIỀN</th>
                    <th>{lastColumnTitle}</th>
                    <th>GHI CHÚ</th>
                    <th>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="empty-state">
                        <div className="empty-icon">
                          <FileText size={48} strokeWidth={1.5} />
                        </div>
                        <div className="empty-title">Chưa có giao dịch</div>
                        <div className="empty-description">
                          Nhấn "{isImport ? 'Thêm Phiếu Nhập' : 'Thêm Phiếu Xuất'}" để bắt đầu
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((t, i) => (
                      <tr key={t.id || i} className="table-row">
                        <td className="table-cell">{t.date || '-'}</td>
                        <td className="table-cell code">{t.transactionCode || '-'}</td>
                        <td className="table-cell">{t.summary || '-'}</td>
                        <td className="table-cell">{t.createdBy || '-'}</td>
                        <td className="table-cell sku">{t.sku}</td>
                        <td className="table-cell">{t.productName}</td>
                        <td className="table-cell center">
                          <span className="quantity-badge">{t.quantity}</span>
                        </td>
                        <td className="table-cell right">{formatCurrency(t.unitPrice || 0)}</td>
                        <td className="table-cell right">
                          <span className={`amount-text ${isImport ? 'import' : 'export'}`}>
                            {formatCurrency((t.quantity || 0) * (t.unitPrice || 0))}
                          </span>
                        </td>
                        <td className="table-cell">{t.reason || '-'}</td>
                        <td className="table-cell">{t.note || '-'}</td>
                        <td className="table-cell center">
                          <div className="button-group">
                            <button 
                              className="mini-button edit"
                              onClick={() => handleEditTransaction(t)}
                              disabled={processing}
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="mini-button delete"
                              onClick={() => handleDeleteTransaction(t.id)}
                              disabled={processing}
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {renderPagination()}

          {/* Batch Progress Dialog */}
          {showBatchProgress && (
            <div className="modal-overlay" style={{ zIndex: 9999 }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: batchProgress.action.includes('xóa') ? '#FEF3F2' : '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '32px' }}>
                      {batchProgress.action.includes('xóa') ? '⚠️' : '📦'}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    {batchProgress.action.includes('xóa') 
                      ? 'Đang xóa sản phẩm' 
                      : batchProgress.action.includes('Excel')
                      ? 'Đang import Excel'
                      : `Đang ${isImport ? 'nhập' : 'xuất'} kho`
                    }
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    {batchProgress.action.includes('xóa') && (
                      <>
                        Đang xóa <span style={{ color: '#EF4444', fontWeight: '600' }}>
                          {filteredTransactions.length} sản phẩm
                        </span> khỏi hệ thống
                      </>
                    )}
                    {batchProgress.action.includes('Excel') && (
                      <>Vui lòng đợi trong giây lát...</>
                    )}
                    {!batchProgress.action.includes('xóa') && !batchProgress.action.includes('Excel') && (
                      <>Đang xử lý các giao dịch theo batch...</>
                    )}
                  </p>

                  {batchProgress.action.includes('xóa') && (
                    <div style={{
                      background: '#FEF3F2',
                      border: '1px solid #FEE2E2',
                      borderRadius: '8px',
                      padding: '12px',
                      width: '100%'
                    }}>
                      <p style={{
                        fontSize: '12px',
                        color: '#991B1B',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>⚠️</span>
                        <span>Hành động này không thể hoàn tác!</span>
                      </p>
                    </div>
                  )}

                  <div style={{ width: '100%' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      <span>{batchProgress.action}</span>
                      <span>{batchProgress.current}/{batchProgress.total}</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#F3F4F6',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${batchProgress.percentage}%`,
                        height: '100%',
                        background: batchProgress.action.includes('xóa')
                          ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                          : 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{
                      marginTop: '4px',
                      fontSize: '12px',
                      color: '#9CA3AF',
                      textAlign: 'right'
                    }}>
                      {batchProgress.percentage}%
                    </div>
                  </div>

                  <div style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    width: '100%',
                    fontSize: '12px',
                    color: '#6B7280',
                    textAlign: 'center'
                  }}>
                    💡 Batch size: {
                      batchProgress.action.includes('xóa') 
                        ? BATCH_CONFIG.DELETE_BATCH
                        : batchProgress.action.includes('Excel')
                        ? BATCH_CONFIG.IMPORT_EXCEL
                        : BATCH_CONFIG.SUBMIT_BATCH
                    } items/batch
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #E5E7EB',
                      borderTop: '2px solid #3B82F6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span>Đang xử lý...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal cho Import/Export */}
          {showImportModal && (
            <div 
              className="modal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowImportModal(false);
                }
              }}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h2 className="modal-title">
                      {editingTransaction ? (
                        <>
                          <Edit2 size={24} style={{display: 'inline', marginRight: '8px'}} />
                          Chỉnh Sửa Phiếu
                        </>
                      ) : (
                        <>
                          {isImport ? <Inbox size={24} style={{display: 'inline', marginRight: '8px'}} /> : <PackageOpen size={24} style={{display: 'inline', marginRight: '8px'}} />}
                          {isImport ? 'Thêm Phiếu Nhập Kho' : 'Thêm Phiếu Xuất Kho'}
                        </>
                      )}
                    </h2>
                    <p className="modal-subtitle">
                      {editingTransaction 
                        ? `Chỉnh sửa phiếu ${editingTransaction.transactionCode || '#' + editingTransaction.id}`
                        : `Nhập thông tin chi tiết các sản phẩm ${isImport ? 'nhập' : 'xuất'} kho`
                      }
                    </p>
                  </div>
                  <button 
                    className="modal-close"
                    onClick={() => {
                      setShowImportModal(false);
                      setEditingTransaction(null);
                      setRows([{
                        id: Date.now(),
                        date: new Date().toISOString().split('T')[0],
                        transactionCode: '',
                        summary: '',
                        createdBy: currentUser?.name || '',
                        sku: '',
                        productName: '',
                        quantity: '',
                        unitPrice: '',
                        reason: '',
                        note: ''
                      }]);
                    }}
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="modal-body">
                  {isImport ? (
                    <ImportManagement
                      rows={rows}
                      setRows={setRows}
                      products={products}
                      type={transactionType}
                      currentUser={currentUser}
                      onSubmitAll={editingTransaction ? handleSaveEditTransaction : handleSubmitAll}
                      processing={processing}
                    />
                  ) : (
                    <ExportManagement
                      rows={rows}
                      setRows={setRows}
                      products={products}
                      currentUser={currentUser}
                      onSubmitAll={editingTransaction ? handleSaveEditTransaction : handleSubmitAll}
                      processing={processing}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default TransactionTab;