import apiClient from '../API/apiClient';

export const exportService = {
getAll: (params = {}) => apiClient.get('/exports', { params }),

getById: (id) => apiClient.get(`/exports/${id}`),

create: (data) => apiClient.post('/exports', data),

update: (id, data) => apiClient.put(`/exports/${id}`, data),

delete: (id) => apiClient.delete(`/exports/${id}`),

approve: (id) => apiClient.post(`/exports/${id}/approve`),
};