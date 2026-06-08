import apiClient from '../API/apiClient';

export const posService = {
  checkout: (data) => apiClient.post('/pos/checkout', data),
};
