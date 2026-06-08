import apiClient from '../API/apiClient';

export const recipeService = {
  getAll: () => apiClient.get('/recipes'),
  getByProductId: (productId) => apiClient.get(`/recipes/${productId}`),
  createOrUpdate: (data) => apiClient.post('/recipes', data),
  delete: (id) => apiClient.delete(`/recipes/${id}`),
};
