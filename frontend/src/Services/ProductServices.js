import apiClient from '../API/apiClient';

export const productService = {
getAll: (params = {}) => apiClient.get('/products', { params }),

getById: (id) => apiClient.get(`/products/${id}`),

create: (data) => apiClient.post('/products', data),

update: (id, data) => apiClient.put(`/products/${id}`, data),

delete: (id) => apiClient.delete(`/products/${id}`),

search: (keyword) => apiClient.get('/products/search', {
params: { q: keyword },
}),

//getCategories: () => apiClient.get('/products/categories'),
};
