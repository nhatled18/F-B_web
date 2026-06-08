// services/authService.js
import apiClient, { publicClient } from '../API/apiClient';

export const authService = {
  // ✅ Login dùng publicClient (không gửi token cũ)
  login: async (credentials) => {
    const response = await publicClient.post('/auth/login', credentials);
    
    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  // ✅ Register dùng publicClient
  register: (data) => publicClient.post('/auth/register', data),

  // ✅ Các API khác dùng apiClient (có token)
  logout: () => {
    localStorage.removeItem('authToken');
  },

  getCurrentUser: () => apiClient.get('/auth/me'),

  changePassword: (data) => apiClient.post('/auth/change-password', data),
};

