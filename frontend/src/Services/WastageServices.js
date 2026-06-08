import apiClient from '../API/apiClient';

export const wastageService = {
  getAll: () => apiClient.get('/wastage'),
  create: (data) => apiClient.post('/wastage', data),
  approve: (id) => apiClient.post(`/wastage/${id}/approve`),
  reject: (id) => apiClient.post(`/wastage/${id}/reject`),
};
