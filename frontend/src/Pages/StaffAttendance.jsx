import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../API/apiClient';
import './StaffAttendance.css';

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Thấp', color: '#3fb950', emoji: '🟢' },
  { value: 'medium', label: 'Trung bình', color: '#f9a826', emoji: '🟡' },
  { value: 'high', label: 'Cao', color: '#ff7b72', emoji: '🟠' },
  { value: 'critical', label: 'Nghiêm trọng', color: '#ff4d4f', emoji: '🔴' },
];

const CATEGORY_OPTIONS = [
  { value: 'equipment', label: '⚙️ Thiết bị hỏng hóc', desc: 'Máy pha cà phê, lò nướng...' },
  { value: 'customer_complaint', label: '😤 Khiếu nại khách hàng', desc: 'Phàn nàn về chất lượng, phục vụ...' },
  { value: 'hygiene', label: '🧹 Vệ sinh an toàn thực phẩm', desc: 'Sự cố vệ sinh, kiểm tra...' },
  { value: 'other', label: '📋 Vấn đề khác', desc: 'Các sự cố không thuộc loại trên' },
];

const StaffAttendance = ({ onLogout }) => {
  const [attendance, setAttendance] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('shift'); // shift | issues
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: '', description: '', category: '', severity: 'medium', imageBase64: ''
  });
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, chkRes, issueRes] = await Promise.all([
        apiClient.get('/hr/attendance/today'),
        apiClient.get('/hr/checklist/today'),
        apiClient.get('/hr/issues')
      ]);
      setAttendance(attRes.data.attendance);
      setChecklists(chkRes.data.checklists || []);
      setIssues(issueRes.data.issues || []);
    } catch (err) {
      setError('Lỗi lấy dữ liệu ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setError('');
      const mockBssid = '00:14:22:01:23:45';
      await apiClient.post('/hr/check-in', { wifiBssid: mockBssid });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi chấm công');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await apiClient.post(`/hr/checklist/${taskId}/complete`);
      setChecklists(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: true } : t));
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi hoàn thành công việc');
    }
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setIssueForm(f => ({ ...f, imageBase64: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.title || !issueForm.description || !issueForm.category) {
      setError('Vui lòng điền đầy đủ thông tin báo cáo!');
      return;
    }
    setSubmittingIssue(true);
    try {
      await apiClient.post('/hr/issues', issueForm);
      setIssueSuccess(true);
      setIssueForm({ title: '', description: '', category: '', severity: 'medium', imageBase64: '' });
      setShowIssueForm(false);
      setTimeout(() => setIssueSuccess(false), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi gửi báo cáo sự cố');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const completedCount = checklists.filter(t => t.isCompleted).length;
  const totalCount = checklists.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isAllChecked = totalCount > 0 && completedCount === totalCount;
  const canGoToPOS = attendance && isAllChecked;

  const nowStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <div>Đang tải dữ liệu ca làm việc...</div>
    </div>
  );

  return (
    <div className="attendance-page">
      {/* Header Bar */}
      <div className="att-topbar">
        <div className="att-topbar-brand">
          <span className="brand-icon">🍞</span>
          <span className="brand-name">Zon Zon</span>
        </div>
        <div className="att-topbar-date">{nowStr}</div>
        <button className="btn-logout" onClick={onLogout}>🚪 Đăng xuất</button>
      </div>

      <div className="attendance-body">
        {/* Left Panel - Status Overview */}
        <div className="att-left-panel">
          <div className="att-hero">
            <div className="att-avatar">👨‍🍳</div>
            <h2 className="att-greeting">Xin chào!</h2>
            <p className="att-date-sub">Hãy bắt đầu ca làm việc của bạn</p>
          </div>

          {/* Status Cards */}
          <div className="status-cards">
            <div className={`status-card ${attendance ? 'done' : 'pending'}`}>
              <div className="status-card-icon">{attendance ? '✅' : '⏳'}</div>
              <div className="status-card-info">
                <div className="status-card-label">Chấm công</div>
                <div className="status-card-value">
                  {attendance ? new Date(attendance.checkInTime).toLocaleTimeString('vi-VN') : 'Chưa chấm'}
                </div>
              </div>
            </div>

            <div className={`status-card ${isAllChecked ? 'done' : 'pending'}`}>
              <div className="status-card-icon">{isAllChecked ? '✅' : '📋'}</div>
              <div className="status-card-info">
                <div className="status-card-label">Checklist</div>
                <div className="status-card-value">{completedCount}/{totalCount} việc</div>
              </div>
            </div>

            <div className={`status-card ${issues.length > 0 ? 'warning' : 'done'}`}>
              <div className="status-card-icon">{issues.length > 0 ? '⚠️' : '✅'}</div>
              <div className="status-card-info">
                <div className="status-card-label">Sự cố</div>
                <div className="status-card-value">{issues.length} báo cáo</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            className={`btn-pos-cta ${!canGoToPOS ? 'locked' : ''}`}
            onClick={() => canGoToPOS && navigate('/pos')}
          >
            {canGoToPOS ? (
              <><span>🛒</span> Vào Màn Hình POS</>
            ) : (
              <><span>🔒</span> Hoàn thành checklist để mở POS</>
            )}
          </button>

          {issueSuccess && (
            <div className="success-toast">✅ Báo cáo sự cố đã được gửi thành công!</div>
          )}
        </div>

        {/* Right Panel - Tabs */}
        <div className="att-right-panel">
          {/* Tab Navigation */}
          <div className="att-tabs">
            <button className={`att-tab ${activeTab === 'shift' ? 'active' : ''}`} onClick={() => setActiveTab('shift')}>
              📋 Ca Làm Việc
            </button>
            <button className={`att-tab ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>
              🚨 Báo Cáo Sự Cố
              {issues.length > 0 && <span className="tab-badge">{issues.length}</span>}
            </button>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          {/* Tab: Ca làm việc */}
          {activeTab === 'shift' && (
            <div className="tab-content">
              {/* Section 1: Chấm công */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-num">1</div>
                  <h3>Chấm Công Wifi</h3>
                  {attendance && <span className="section-badge done">✓ Hoàn thành</span>}
                </div>

                {attendance ? (
                  <div className="checkin-confirmed">
                    <div className="checkin-icon">📍</div>
                    <div>
                      <div className="checkin-main">Đã xác nhận vị trí</div>
                      <div className="checkin-time">Lúc {new Date(attendance.checkInTime).toLocaleTimeString('vi-VN')} • Wifi Zon Zon</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="section-desc">Đảm bảo bạn đang kết nối đúng Wifi của quán để xác nhận vị trí.</p>
                    <button className="btn-checkin" onClick={handleCheckIn}>
                      📍 Chấm Công Ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Section 2: Checklist */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-num">2</div>
                  <h3>Checklist Mở Ca</h3>
                  {isAllChecked && <span className="section-badge done">✓ Hoàn thành</span>}
                </div>

                {/* Progress Bar */}
                <div className="progress-wrap">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="progress-label">{completedCount}/{totalCount}</span>
                </div>

                {checklists.map((task) => (
                  <div key={task.id} className={`task-row ${task.isCompleted ? 'task-done' : ''}`}>
                    <div className="task-row-left">
                      <div className={`task-check ${task.isCompleted ? 'checked' : ''}`}>
                        {task.isCompleted ? '✓' : ''}
                      </div>
                      <span className="task-name">{task.taskName}</span>
                    </div>
                    {!task.isCompleted && (
                      <button className="btn-task-done" onClick={() => handleCompleteTask(task.id)}>
                        Hoàn thành
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Báo cáo sự cố */}
          {activeTab === 'issues' && (
            <div className="tab-content">
              <div className="issues-header">
                <h3>Báo Cáo Sự Cố Ca Làm Việc</h3>
                <button className="btn-new-issue" onClick={() => setShowIssueForm(!showIssueForm)}>
                  {showIssueForm ? '✕ Hủy' : '+ Tạo Báo Cáo Mới'}
                </button>
              </div>

              {/* Issue Form */}
              {showIssueForm && (
                <form className="issue-form" onSubmit={handleSubmitIssue}>
                  <div className="form-group">
                    <label>Tiêu đề sự cố *</label>
                    <input
                      type="text"
                      placeholder="VD: Máy pha cà phê bị hỏng..."
                      value={issueForm.title}
                      onChange={e => setIssueForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phân loại *</label>
                    <div className="category-grid">
                      {CATEGORY_OPTIONS.map(cat => (
                        <div
                          key={cat.value}
                          className={`category-card ${issueForm.category === cat.value ? 'selected' : ''}`}
                          onClick={() => setIssueForm(f => ({ ...f, category: cat.value }))}
                        >
                          <div className="cat-label">{cat.label}</div>
                          <div className="cat-desc">{cat.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Mức độ nghiêm trọng</label>
                    <div className="severity-row">
                      {SEVERITY_OPTIONS.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          className={`severity-btn ${issueForm.severity === s.value ? 'active' : ''}`}
                          style={{ '--sev-color': s.color }}
                          onClick={() => setIssueForm(f => ({ ...f, severity: s.value }))}
                        >
                          {s.emoji} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Mô tả chi tiết *</label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả cụ thể sự cố xảy ra, thời điểm, ảnh hưởng..."
                      value={issueForm.description}
                      onChange={e => setIssueForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Ảnh minh chứng (tùy chọn)</label>
                    <div className="photo-upload" onClick={() => fileInputRef.current.click()}>
                      {issueForm.imageBase64 ? (
                        <img src={issueForm.imageBase64} alt="Preview" className="photo-preview" />
                      ) : (
                        <div className="photo-placeholder">
                          <span>📷</span>
                          <span>Chụp ảnh hoặc chọn từ máy</span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      style={{ display: 'none' }}
                    />
                  </div>

                  <button type="submit" className="btn-submit-issue" disabled={submittingIssue}>
                    {submittingIssue ? '⏳ Đang gửi...' : '🚨 Gửi Báo Cáo Sự Cố'}
                  </button>
                </form>
              )}

              {/* Issues List */}
              {issues.length === 0 ? (
                <div className="empty-issues">
                  <span>🎉</span>
                  <p>Không có sự cố nào trong ca này.</p>
                </div>
              ) : (
                <div className="issues-list">
                  {issues.map(issue => {
                    const sev = SEVERITY_OPTIONS.find(s => s.value === issue.severity) || SEVERITY_OPTIONS[1];
                    const cat = CATEGORY_OPTIONS.find(c => c.value === issue.category);
                    return (
                      <div key={issue.id} className="issue-card">
                        <div className="issue-card-header">
                          <span className="issue-title">{issue.title}</span>
                          <span className="issue-sev" style={{ color: sev.color }}>{sev.emoji} {sev.label}</span>
                        </div>
                        <div className="issue-meta">
                          <span>{cat?.label || issue.category}</span>
                          <span>•</span>
                          <span>{new Date(issue.createdAt).toLocaleTimeString('vi-VN')}</span>
                          <span>•</span>
                          <span className={`issue-status status-${issue.status}`}>
                            {issue.status === 'open' ? '🔴 Chờ xử lý' : issue.status === 'in_progress' ? '🟡 Đang xử lý' : '🟢 Đã giải quyết'}
                          </span>
                        </div>
                        <p className="issue-desc">{issue.description}</p>
                        {issue.imageBase64 && (
                          <img src={issue.imageBase64} alt="Ảnh sự cố" className="issue-img" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffAttendance;
