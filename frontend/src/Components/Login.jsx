// components/Login.jsx
import React, { useState } from 'react';
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      onLogin(username);
    } else {
      alert('Tên đăng nhập hoặc mật khẩu không đúng!\n\nThông tin đăng nhập:\nUsername: admin\nPassword: admin123');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-icon">📦</div>
        <h1 className="login-title">Quản lý kho</h1>
        <p className="login-subtitle">Đăng nhập để tiếp tục</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="admin"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="admin123"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary">
            🔑 Đăng nhập
          </button>
        </form>
        
        <div className="demo-info">
          <strong>Demo:</strong> admin / admin123
        </div>
      </div>
    </div>
  );
}

export default Login;