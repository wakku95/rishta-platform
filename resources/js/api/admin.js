import api from './client';

export const adminApi = {
  // Metrics
  getMetrics: () => api.get('/admin/metrics').then(r => r.data.data),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }).then(r => r.data.data),
  getUser: (id) => api.get(`/admin/users/${id}`).then(r => r.data.data),
  suspendUser: (id) => api.post(`/admin/users/${id}/suspend`).then(r => r.data),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`).then(r => r.data),
  updateUserRole: (id, role) => api.post(`/admin/users/${id}/role`, { role }).then(r => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then(r => r.data),

  // Profiles
  getProfiles: (params) => api.get('/admin/profiles', { params }).then(r => r.data.data),
  getProfile: (id) => api.get(`/admin/profiles/${id}`).then(r => r.data.data),
  updateProfileStatus: (id, status) => api.post(`/admin/profiles/${id}/status`, { profile_status: status }).then(r => r.data),
  deleteProfile: (id) => api.delete(`/admin/profiles/${id}`).then(r => r.data),

  // Requests
  getRequests: (params) => api.get('/admin/requests', { params }).then(r => r.data.data),
  cancelRequest: (id) => api.post(`/admin/requests/${id}/cancel`).then(r => r.data),

  // Payments & Unlocks
  getPayments: (params) => api.get('/admin/payments', { params }).then(r => r.data.data),
  getUnlocks: (params) => api.get('/admin/unlocks', { params }).then(r => r.data.data),
};
