import apiClient from './client';

export const authApi = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  register: async (data) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Continue even if network error
    }
  },

  forgotPassword: async (email) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  resendEmailVerification: async () => {
    const res = await apiClient.post('/auth/email/verification-notification');
    return res.data;
  },
};
