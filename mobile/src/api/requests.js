import apiClient from './client';

export const requestsApi = {
  // Proposals
  getRequests: async (status = null) => {
    const params = status ? { status } : {};
    const res = await apiClient.get('/requests', { params });
    return res.data;
  },

  sendRequest: async (payload, maybeMessage = '') => {
    let body;
    if (typeof payload === 'object' && payload !== null) {
      body = {
        profile_code: payload.profile_code,
        sender_intro: (payload.sender_intro || payload.message || '').trim() || null,
        sender_questions: (payload.sender_questions || '').trim() || null,
      };
    } else {
      body = {
        profile_code: payload,
        sender_intro: String(maybeMessage || '').trim() || null,
        sender_questions: null,
      };
    }
    const res = await apiClient.post('/requests', body);
    return res.data;
  },

  respondToRequest: async (requestId, action, reason = '') => {
    // action: 'accept' or 'decline'
    const res = await apiClient.post(`/requests/${requestId}/${action}`, { reason });
    return res.data;
  },

  answerCounterQuestions: async (requestId, answers) => {
    const res = await apiClient.post(`/requests/${requestId}/answers`, { answers });
    return res.data;
  },

  // Contact Unlock & OTP
  initiateUnlock: async (requestId) => {
    const res = await apiClient.post(`/requests/${requestId}/unlock/initiate`);
    return res.data;
  },

  verifyOtp: async (requestId, otp) => {
    const res = await apiClient.post(`/requests/${requestId}/unlock/verify-otp`, { otp });
    return res.data;
  },

  getUnlockedContact: async (requestId) => {
    const res = await apiClient.get(`/requests/${requestId}/unlocked-contact`);
    return res.data;
  },
};
