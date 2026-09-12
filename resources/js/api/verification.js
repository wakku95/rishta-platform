import api from './client';

export const verificationApi = {
  // Get user's verification overview
  getStatus: () => api.get('/verifications').then(r => r.data.data),

  // Submit Identity (CNIC Front & Back)
  submitIdentity: (formData) => api.post('/verifications/identity', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),

  // Submit Education (Degree/Diploma/Transcript)
  submitEducation: (formData) => api.post('/verifications/education', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),

  // Withdraw pending verification
  withdraw: (id) => api.delete(`/verifications/${id}`).then(r => r.data),
};
