import apiClient from './client';

export const requestsApi = {
  // Proposals
  getRequests: async (type = 'all', status = null) => {
    const params = status ? { status } : {};
    if (type === 'received') {
      const res = await apiClient.get('/requests/received', { params });
      return res.data;
    }
    if (type === 'sent') {
      const res = await apiClient.get('/requests/sent', { params });
      return res.data;
    }
    const res = await apiClient.get('/requests', { params });
    return res.data;
  },

  getReceivedRequests: async (params = {}) => {
    const res = await apiClient.get('/requests/received', { params });
    return res.data;
  },

  getSentRequests: async (params = {}) => {
    const res = await apiClient.get('/requests/sent', { params });
    return res.data;
  },

  getRequestCounts: async () => {
    const res = await apiClient.get('/requests/counts');
    return res.data;
  },

  getMyAssistedInquiries: async (params = {}) => {
    const res = await apiClient.get('/listings/my-inquiries', { params });
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

  respondToRequest: async (requestId, action, payload = {}) => {
    // action: 'accept' or 'decline'
    const body = typeof payload === 'string' ? { reason: payload } : payload;
    const res = await apiClient.post(`/requests/${requestId}/${action}`, body);
    return res.data;
  },

  // Cancel a sent pending request
  cancelRequest: async (requestCode) => {
    const res = await apiClient.post(`/requests/${requestCode}/cancel`);
    return res.data;
  },

  // Edit initial proposal when admin requested revision
  editProposal: async (requestCode, payload = {}) => {
    const res = await apiClient.post(`/requests/${requestCode}/edit`, payload);
    return res.data;
  },

  // Sender answers receiver's counter-questions
  replyToQuestions: async (requestCode, senderAnswers) => {
    const res = await apiClient.post(`/requests/${requestCode}/reply`, {
      sender_answers: senderAnswers,
    });
    return res.data;
  },

  // Legacy alias
  answerCounterQuestions: async (requestId, answers) => {
    const res = await apiClient.post(`/requests/${requestId}/reply`, { sender_answers: answers });
    return res.data;
  },

  // Phase 5: Mutual OTP verification & Contact details unlock
  getUnlockStatus: async (requestCode) => {
    const res = await apiClient.get(`/requests/${requestCode}/unlock/status`);
    return res.data;
  },

  sendUnlockOtp: async (requestCode, phone) => {
    const res = await apiClient.post(`/requests/${requestCode}/otp/send`, { phone });
    return res.data;
  },

  verifyUnlockOtp: async (requestCode, otp) => {
    const res = await apiClient.post(`/requests/${requestCode}/otp/verify`, { otp });
    return res.data;
  },

  getUnlockedContact: async (requestCode) => {
    const res = await apiClient.get(`/requests/${requestCode}/contact`);
    return res.data;
  },
};
