import apiClient from '../API/apiClient';

export const dashboardService = {
getOverview: () => apiClient.get('/dashboard/overview'),
getLowStockProducts: () => apiClient.get('/dashboard/low-stock'),
getRecentActivities: (limit = 10) =>
apiClient.get(`/dashboard/activities?limit=${limit}`),
};
