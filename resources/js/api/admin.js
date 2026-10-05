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
  updateAboutApproval: (id, approved) => api.post(`/admin/profiles/${id}/about-approval`, { approved }).then(r => r.data),
  updateProfileGender: (id, gender) => api.post(`/admin/profiles/${id}/gender`, { gender }).then(r => r.data),
  deleteProfile: (id) => api.delete(`/admin/profiles/${id}`).then(r => r.data),

  // Requests
  getRequests: (params) => api.get('/admin/requests', { params }).then(r => r.data.data),
  cancelRequest: (id) => api.post(`/admin/requests/${id}/cancel`).then(r => r.data),

  // Payments & Unlocks
  getPayments: (params) => api.get('/admin/payments', { params }).then(r => r.data.data),
  approvePayment: (id) => api.post(`/admin/payments/${id}/approve`).then(r => r.data),
  rejectPayment: (id, reason) => api.post(`/admin/payments/${id}/reject`, { reason }).then(r => r.data),
  getPaymentReceiptBlob: (id) => api.get(`/admin/payments/${id}/receipt`, {
    responseType: 'blob',
  }),
  deletePaymentReceipt: (id) => api.delete(`/admin/payments/${id}/receipt`).then(r => r.data),
  getUnlocks: (params) => api.get('/admin/unlocks', { params }).then(r => r.data.data),

  // Verifications
  getVerifications: (params) => api.get('/admin/verifications', { params }).then(r => r.data.data),
  getVerification: (id) => api.get(`/admin/verifications/${id}`).then(r => r.data.data),
  approveVerification: (id) => api.post(`/admin/verifications/${id}/approve`).then(r => r.data),
  rejectVerification: (id, reason) => api.post(`/admin/verifications/${id}/reject`, { reason }).then(r => r.data),
  getDocumentUrl: (id, side = 'front') => `/api/admin/verifications/${id}/document/${side}`,
  getDocumentBlob: (id, side = 'front') => api.get(`/admin/verifications/${id}/document/${side}`, {
    responseType: 'blob',
  }),
  purgeDocuments: (days = 30) => api.post('/admin/verifications/purge', { days }).then(r => r.data),

  // Assisted Matchmaking
  createAssistedProfile: (data) => api.post('/admin/assisted/create-profile', data).then(r => r.data.data),
  getAssistedProfiles: (params) => api.get('/admin/assisted/profiles', { params }).then(r => r.data.data),
  getAssistedProfile: (id) => api.get(`/admin/assisted/profiles/${id}`).then(r => r.data.data),
  updateAssistedProfile: (id, data) => api.put(`/admin/assisted/profiles/${id}`, data).then(r => r.data.data),
  resendConfirmation: (id) => api.post(`/admin/assisted/profiles/${id}/resend-confirmation`).then(r => r.data),
  searchMatches: (id, params) => api.post(`/admin/assisted/profiles/${id}/search-matches`, params).then(r => r.data.data),
  sendProposal: (id, data) => api.post(`/admin/assisted/profiles/${id}/send-proposal`, data).then(r => r.data),
  listProposals: (id) => api.get(`/admin/assisted/profiles/${id}/proposals`).then(r => r.data.data),

  // Matchmaker Engine
  getMatchmakerCandidates: (params) => api.get('/admin/matchmaker/candidates', { params }).then(r => r.data.data),
  findMatchmakerMatches: (data) => api.post('/admin/matchmaker/matches', data).then(r => r.data.data),
  excludeMatch: (data) => api.post('/admin/matchmaker/exclude', data).then(r => r.data),

  // Communications
  sendCommunicationEmail: (formData) => api.post('/admin/communications/send-email', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  logContact: (data) => api.post('/admin/communications/log-contact', data).then(r => r.data),

  // Database Backups
  getBackupInfo: () => api.get('/admin/backup/info').then(r => r.data.data),
  createBackup: (params = {}) => api.post('/admin/backup/create', params).then(r => r.data.data),
  downloadBackupBlob: (filename) => api.get(`/admin/backup/download/${filename}`, {
    responseType: 'blob',
  }),
  deleteBackup: (filename) => api.delete(`/admin/backup/${filename}`).then(r => r.data),

  // Candidate Verification Links
  generateVerificationLink: (data) => api.post('/admin/verification-links/generate', data).then(r => r.data.data),
  getVerificationLinks: (params) => api.get('/admin/verification-links', { params }).then(r => r.data.data),
  approveVerificationLink: (id, notes) => api.post(`/admin/verification-links/${id}/approve`, { notes }).then(r => r.data),
  rejectVerificationLink: (id, reason) => api.post(`/admin/verification-links/${id}/reject`, { reason }).then(r => r.data),
  getVerificationLinkDocBlob: (id, side = 'front') => api.get(`/admin/verification-links/${id}/document/${side}`, {
    responseType: 'blob',
  }),
};
