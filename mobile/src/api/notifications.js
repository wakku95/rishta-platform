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
    const res = await apiClient.post('/notifications/read-all');
    return res.data;
  },

  updatePushToken: async (push_token) => {
    const res = await apiClient.post('/user/push-token', { push_token });
    return res.data;
  },

  sendTestPush: async () => {
    const res = await apiClient.post('/user/push-token/test');
    return res.data;
  },
};
