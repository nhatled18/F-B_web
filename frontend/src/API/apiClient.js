// API/apiClient.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

// ✅ Public Client - KHÔNG CÓ TOKEN (cho login, register)
export const publicClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ✅ API Client - CÓ TOKEN (cho các API khác)
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// CHỈ apiClient mới có interceptor thêm token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi 401 (token hết hạn)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export cả 2
export default apiClient;