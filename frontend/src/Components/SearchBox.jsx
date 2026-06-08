// components/SearchBox.jsx
import React from 'react';

function SearchBox({ searchTerm, onSearchChange }) {
  return (
    <div className="search-box">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
        placeholder="Tìm kiếm sản phẩm..."
      />
    </div>
  );
}

export default SearchBox;