import apiClient from './client';

export const notificationsApi = {
  getNotifications: async () => {
    const res = await apiClient.get('/notifications');
    return res.data;
  },

  markAsRead: async (id) => {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await apiClient.post('/notifications/mark-all-read');
    return res.data;
  },
};
