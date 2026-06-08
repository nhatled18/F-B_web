import apiClient from '../API/apiClient';

export const historyService = {
getAll: (params = {}) => apiClient.get('/history', { params }),

getById: (id) => apiClient.get(`/history/${id}`),

getByType: (type, params = {}) => apiClient.get(`/history/type/${type}`, { params }),

getByUser: (userId, params = {}) => apiClient.get(`/history/user/${userId}`, { params }),

export: (params = {}) => apiClient.get('/history/export', { params }),
};
