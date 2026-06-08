import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Archive,
  History,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  ClipboardList,
  MonitorSmartphone,
  Trash2,
  CheckSquare
} from 'lucide-react';
import '../assets/styles/Sidebar.css';

function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const isActive = (path) => location.pathname.includes(path);

  const menuGroups = [
    {
      label: 'Tổng Quan',
      items: [
        { name: 'Dashboard', path: '/dashboard/overview', icon: LayoutDashboard, color: '#667eea' },
      ]
    },
    {
      label: 'Nguyên Liệu',
      items: [
        { name: 'Mặt Hàng & Nguyên Liệu', path: '/dashboard/products', icon: Package, color: '#FFD166' },
        { name: 'Kho Hàng', path: '/dashboard/inventory', icon: Archive, color: '#10b981' },
        { name: 'Lịch Sử', path: '/dashboard/history', icon: History, color: '#8b5cf6' },
      ]
    },
    {
      label: 'Giao Dịch',
      items: [
        { name: 'Nhập Hàng', path: '/dashboard/import', icon: ArrowDownToLine, color: '#3b82f6' },
        { name: 'Xuất Hàng', path: '/dashboard/export', icon: ArrowUpFromLine, color: '#ef4444' },
        { name: 'Điều Chỉnh Kho', path: '/dashboard/adjust', icon: AlertTriangle, color: '#f59e0b' },
      ]
    },
    {
      label: 'F&B Pro',
      items: [
        { name: 'Định Mức (BOM)', path: '/dashboard/recipes', icon: ClipboardList, color: '#0ea5e9' },
        { name: 'POS Bán Hàng', path: '/dashboard/pos', icon: MonitorSmartphone, color: '#14b8a6' },
        { name: 'Quản Lý Thất Thoát', path: '/dashboard/wastage', icon: Trash2, color: '#f43f5e' },
        { name: 'Kiểm Kê Kho', path: '/dashboard/stocktake', icon: CheckSquare, color: '#84cc16' },
      ]
    }
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">🍽️</div>
            {isOpen && (
              <div className="logo-text-group">
                <span className="logo-text">F&B Inventory</span>
                <span className="logo-sub">Quản lý kho ẩm thực</span>
              </div>
            )}
          </div>
          <button
            className="toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {isOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuGroups.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              {isOpen && <div className="nav-section-label">{group.label}</div>}
              {gIdx > 0 && !isOpen && <div className="nav-separator" />}
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  title={!isOpen ? item.name : ''}
                >
                  <div className="nav-icon-wrapper">
                    <item.icon size={17} color={item.color} />
                  </div>
                  {isOpen && <span className="nav-label">{item.name}</span>}
                </Link>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {isOpen && (
            <div className="user-info">
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <p className="user-name">{user?.username || 'User'}</p>
                <p className="user-status">Thủ kho</p>
              </div>
            </div>
          )}
          {!isOpen && (
            <div className="user-info">
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={onLogout} title="Đăng xuất">
            <LogOut size={16} />
            {isOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}

export default Sidebar;
