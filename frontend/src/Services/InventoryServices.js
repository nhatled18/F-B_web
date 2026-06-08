// src/services/inventoryService.js
import apiClient from '../API/apiClient';

export const inventoryService = {
  // Lấy danh sách tồn kho (có phân trang)
  getAll: (params = {}) => {
    return apiClient.get('/inventory', { params });
  },

  // Lấy theo ID
  getById: (id) => {
    return apiClient.get(`/inventory/${id}`);
  },

  // Tạo mới sản phẩm
  create: (inventoryData) => {
    return apiClient.post('/inventory', inventoryData);
  },

  // Cập nhật sản phẩm
  update: (id, inventoryData) => {
    return apiClient.put(`/inventory/${id}`, inventoryData);
  },

  // Xóa một sản phẩm
  delete: (id) => {
    return apiClient.delete(`/inventory/${id}`);
  },

  // Xóa nhiều sản phẩm
  deleteMany: (ids) => {
    return apiClient.post('/inventory/delete-many', { ids });
  },

  // Import hàng loạt từ Excel
  import: (inventories) => {
    return apiClient.post('/inventory/import', { inventories });
  },

  // Export Excel
  export: (params = {}) => {
    return apiClient.get('/inventory/export', {
      params,
      responseType: 'blob' // Quan trọng để download file
    });
  },

  // Thống kê tồn kho
  getStats: () => {
    return apiClient.get('/inventory/stats');
  },

  // Tìm kiếm và lọc
  search: (searchTerm, filters = {}) => {
    return apiClient.get('/inventory', {
      params: {
        search: searchTerm,
        ...filters
      }
    });
  }
};

export default inventoryService;