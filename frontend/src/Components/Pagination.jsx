import React from 'react';
import '../assets/styles/Pagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  totalItems,
  itemName = 'sản phẩm' // THÊM MỚI: Default là 'sản phẩm'
}) => {
  
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="pagination-btn"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="dots-start" className="pagination-dots">...</span>);
      }
    }

    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots-end" className="pagination-dots">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="pagination-btn"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-wrapper">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-nav-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span className="nav-text">Trước</span>
        </button>

        {/* Page Numbers */}
        <div className="pagination-numbers">
          {renderPageNumbers()}
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-nav-btn"
        >
          <span className="nav-text">Sau</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* Page Info - UPDATED */}
      <div className="pagination-info">
        Hiển thị {startItem} - {endItem} trong tổng số {totalItems} {itemName}
      </div>
    </div>
  );
};

export default Pagination;