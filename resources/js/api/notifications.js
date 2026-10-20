import api from './client';

export const notificationApi = {
  getNotifications: () => api.get('/notifications').then(r => r.data),
  markAsRead: (id) => api.post(`/notifications/${id}/read`).then(r => r.data),
  markAllAsRead: () => api.post('/notifications/read-all').then(r => r.data),
};
