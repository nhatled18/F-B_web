import React, { useState } from 'react';
import { authService } from '../Services/AuthServices';
import { Mail, Lock, User, AlertCircle, Loader } from 'lucide-react';
import "../assets/styles/LoginPage.css";
import "../assets/styles/Common.css";

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ username, password });
      
      // Gọi callback onLogin với user data
      onLogin({ 
        username: response.user?.username || username,
        ...response.user 
      });
      
      // Success message (optional)
      console.log('✅ Đăng nhập thành công:', response);
    } catch (err) {
      console.error('❌ Lỗi đăng nhập:', err);
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validate trước khi gửi
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        username,
        password,
        email,
        fullName
      });
      
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      setMode('login');
      resetForm();
    } catch (err) {
      console.error('❌ Lỗi đăng ký:', err);
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Implement forgot password API endpoint
      // await authService.forgotPassword({ email });
      
      alert(`Link khôi phục mật khẩu đã được gửi đến ${email}.\nVui lòng kiểm tra email của bạn.`);
      setMode('login');
      resetForm();
    } catch (err) {
      console.error('❌ Lỗi khôi phục mật khẩu:', err);
      setError(err.message || 'Email không tồn tại trong hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setFullName('');
    setError('');
    setRememberMe(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Left Side - F&B Branding */}
        <div className="login-left">
          {/* Floating food decorations */}
          <div className="floating-icons">
            <span className="float-icon">🍔</span>
            <span className="float-icon">🍕</span>
            <span className="float-icon">🥗</span>
            <span className="float-icon">☕</span>
            <span className="float-icon">🍜</span>
            <span className="float-icon">🥩</span>
          </div>

          <div className="login-brand-section">
            {/* Logo */}
            <div className="brand-logo-area">
              <div className="brand-logo-icon">🍽️</div>
              <div className="brand-logo-text-group">
                <div className="brand-name-fb">F&B Inventory</div>
                <div className="brand-name-sub">Quản lý kho ẩm thực</div>
              </div>
            </div>

            <h1 className="brand-tagline">
              Kiểm soát <strong>nguyên liệu</strong>,<br />
              nâng tầm <strong>ẩm thực</strong>
            </h1>
            <p className="brand-description">
              Hệ thống quản lý kho chuyên nghiệp dành riêng cho nhà hàng, quán cà phê và chuỗi F&B.
            </p>

            <div className="brand-features">
              <div className="feature-item">
                <div className="feature-icon">📦</div>
                <span>Quản lý nguyên liệu theo thời gian thực</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📋</div>
                <span>Định mức (BOM) tự động trừ kho</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔗</div>
                <span>Tích hợp POS & Tổng công ty</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <span>Báo cáo thất thoát & kiểm kê</span>
              </div>
            </div>

            <div className="brand-stats">
              <div className="stat-pill"><span>ZONZON</span>Bánh Mì Việt</div>
              <div className="stat-pill"><span>✓</span>Đang hoạt động</div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="login-right">
          <div className="login-form-container">
            {/* Error Alert */}
            {error && (
              <div className="alert-box error-alert">
                <AlertCircle size={20} />
                <span>{error}</span>
                <button 
                  className="alert-close" 
                  onClick={() => setError('')}
                  type="button"
                >
                  ✕
                </button>
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <>
                <div className="auth-header">
                  <h2>Đăng Nhập</h2>
                  <p>Truy cập hệ thống kho hàng của bạn</p>
                </div>

                <form onSubmit={handleLogin} className="auth-form">
                  <div className="form-group">
                    <label className="form-label">Tên đăng nhập</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="form-input"
                      placeholder="Nhập tên đăng nhập hoặc email"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mật khẩu</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      placeholder="Nhập mật khẩu"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                      />
                      <span>Ghi nhớ đăng nhập</span>
                    </label>
                    
                    <button 
                      type="button"
                      className="forgot-link"
                      onClick={(e) => { e.preventDefault(); switchMode('forgot'); }}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="spinner" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      'Đăng Nhập'
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>Chưa có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); switchMode('register'); }}>Đăng ký</a></p>
                </div>
              </>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <>
                <div className="auth-header">
                  <h2>Tạo Tài Khoản</h2>
                  <p>Đăng ký để truy cập hệ thống kho hàng</p>
                </div>

                <form onSubmit={handleRegister} className="auth-form">
                  <div className="form-group">
                    <label className="form-label">Họ và Tên</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="form-input"
                      placeholder="Nhập họ và tên"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      placeholder="Nhập email của bạn"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tên đăng nhập</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="form-input"
                      placeholder="Chọn tên đăng nhập"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mật khẩu</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input"
                      placeholder="Nhập lại mật khẩu"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="spinner" />
                        Đang tạo tài khoản...
                      </>
                    ) : (
                      'Tạo Tài Khoản'
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>Đã có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); switchMode('login'); }}>Đăng nhập</a></p>
                </div>
              </>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <>
                <div className="auth-header">
                  <h2>Khôi Phục Mật Khẩu</h2>
                  <p>Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>
                </div>

                <form onSubmit={handleForgotPassword} className="auth-form">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      placeholder="Nhập email của bạn"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="spinner" />
                        Đang gửi...
                      </>
                    ) : (
                      'Gửi Link Khôi Phục'
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>Nhớ mật khẩu? <a href="#" onClick={(e) => { e.preventDefault(); switchMode('login'); }}>Đăng nhập</a></p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;