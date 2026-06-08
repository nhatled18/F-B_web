import apiClient from '../API/apiClient';

export const stocktakeService = {
  getAll: () => apiClient.get('/stocktake'),
  create: (data) => apiClient.post('/stocktake', data),
  updateItem: (itemId, data) => apiClient.put(`/stocktake/items/${itemId}`, data),
  complete: (id) => apiClient.post(`/stocktake/${id}/complete`),
};
