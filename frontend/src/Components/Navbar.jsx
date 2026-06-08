// components/Navbar.jsx
// import React from 'react';
import '../assets/styles/Navbar.css';
function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-icon">📦</div>
        <span>Kho hàng</span>
      </div>
      <div className="navbar-user">
        <span className="user-name">
          Xin chào, <strong>{user?.username}</strong>
        </span>
        <button className="btn-logout" onClick={onLogout}>
          Đăng xuất
        </button>
      </div>
    </nav>
  );
}

export default Navbar;