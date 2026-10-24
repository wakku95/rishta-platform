import api from './client';

/**
 * Send a new Rishta request / proposal to a candidate.
 *
 * @param {string|Object} payload - Target candidate profile code or payload object { profile_code, sender_intro, sender_questions }
 * @returns {Promise<Object>}
 */
export const sendRishtaRequest = async (payload) => {
  const data = typeof payload === 'string' ? { profile_code: payload } : payload;
  const response = await api.post('/requests', data);
  return response.data;
};

/**
 * Fetch paginated list of received requests.
 *
 * @param {Object} params - Query params (status, page, per_page)
 * @returns {Promise<Object>}
 */
export const getReceivedRequests = async (params = {}) => {
  const response = await api.get('/requests/received', { params });
  return response.data;
};

/**
 * Fetch paginated list of sent requests.
 *
 * @param {Object} params - Query params (status, page, per_page)
 * @returns {Promise<Object>}
 */
export const getSentRequests = async (params = {}) => {
  const response = await api.get('/requests/sent', { params });
  return response.data;
};

/**
 * Fetch single request details by public request_code.
 *
 * @param {string} requestCode
 * @returns {Promise<Object>}
 */
export const getRequestDetails = async (requestCode) => {
  const response = await api.get(`/requests/${requestCode}`);
  return response.data;
};

/**
 * Accept a received request with optional Q&A response.
 *
 * @param {string} requestCode
 * @param {Object} [payload={}] - { receiver_intro, receiver_answers, receiver_questions }
 * @returns {Promise<Object>}
 */
export const acceptRequest = async (requestCode, payload = {}) => {
  const response = await api.post(`/requests/${requestCode}/accept`, payload);
  return response.data;
};

/**
 * Sender replies to candidate's counter-questions.
 *
 * @param {string} requestCode
 * @param {Object} payload - { sender_answers }
 * @returns {Promise<Object>}
 */
export const replyRequest = async (requestCode, payload = {}) => {
  const response = await api.post(`/requests/${requestCode}/reply`, payload);
  return response.data;
};

/**
 * Decline a received request.
 *
 * @param {string} requestCode
 * @returns {Promise<Object>}
 */
export const declineRequest = async (requestCode) => {
  const response = await api.post(`/requests/${requestCode}/decline`);
  return response.data;
};

/**
 * Cancel a sent pending request.
 *
 * @param {string} requestCode
 * @returns {Promise<Object>}
 */
export const cancelRequest = async (requestCode) => {
  const response = await api.post(`/requests/${requestCode}/cancel`);
  return response.data;
};

/**
 * Edit initial proposal intro and questions if admin requested revision.
 */
export const editProposal = async (requestCode, payload = {}) => {
  const response = await api.post(`/requests/${requestCode}/edit`, payload);
  return response.data;
};

/**
 * Request Photo or CNIC verification before paying contact unlock fee.
 */
export const requestVerification = async (requestCode, type) => {
  const response = await api.post(`/requests/${requestCode}/request-verification`, { type });
  return response.data;
};

/**
 * Upload and share private photo for proposal.
 */
export const uploadProposalPhoto = async (requestCode, formData) => {
  const response = await api.post(`/requests/${requestCode}/upload-photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Fetch candidate photo blob securely.
 */
export const getProposalPhotoBlob = async (requestCode) => {
  const response = await api.get(`/requests/${requestCode}/view-photo`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Fetch own uploaded photo blob securely.
 */
export const getMyProposalPhotoBlob = async (requestCode) => {
  const response = await api.get(`/requests/${requestCode}/view-my-photo`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Initiate private photo unlock fee payment.
 */
export const initiatePhotoPayment = async (requestCode) => {
  const response = await api.post(`/requests/${requestCode}/photo/payment/initiate`);
  return response.data;
};

/**
 * Submit manual payment proof for photo unlock.
 */
export const submitManualPhotoProof = async (requestCode, formData) => {
  const response = await api.post(`/requests/${requestCode}/photo/payment/submit-proof`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Share verified CNIC badge & status with candidate.
 */
export const shareProposalNic = async (requestCode) => {
  const response = await api.post(`/requests/${requestCode}/share-nic`);
  return response.data;
};

/*
|--------------------------------------------------------------------------
| Phase 5: Payment & Contact Unlock APIs
|--------------------------------------------------------------------------
*/

/**
 * Initiate contact unlock fee payment (Rs. 2500 PKR) for accepted request.
 * Restricted to request sender.
 *
 * @param {string} requestCode
 * @returns {Promise<Object>}
 */
export const initiatePayment = async (requestCode) => {
  const response = await api.post(`/requests/${requestCode}/payment/initiate`);
  return response.data;
};

/**
 * Verify payment with gateway.
 *
 * @param {string} paymentUuid
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const verifyPayment = async (paymentUuid, payload = {}) => {
  const response = await api.post(`/payments/${paymentUuid}/verify`, payload);
  return response.data;
};

/**
 * Fetch contact unlock and phone verification status.
 *
 * @param {string} requestCode
 * @returns {Promise<Object>}
 */
export const getUnlockStatus = async (requestCode) => {
  const response = await api.get(`/requests/${requestCode}/unlock/status`);
  return response.data;
};

/**
 * Send 6-digit SMS OTP to user's mobile phone number.
 *
 * @param {string} requestCode
 * @param {string} phone
 * @returns {Promise<Object>}
 */
export const sendUnlockOtp = async (requestCode, phone) => {
  const response = await api.post(`/requests/${requestCode}/otp/send`, { phone });
  return response.data;
};

/**
 * Verify submitted OTP code.
 *
 * @param {string} requestCode
 * @param {string} otp
 * @returns {Promise<Object>}
 */
export const verifyUnlockOtp = async (requestCode, otp) => {
  const response = await api.post(`/requests/${requestCode}/otp/verify`, { otp });
  return response.data;
};

/**
 * Fetch unlocked mutual contact details.
 *
 * @param {string} requestCode
 * @returns {Promise<Object>}
 */
export const getUnlockedContact = async (requestCode) => {
  const response = await api.get(`/requests/${requestCode}/contact`);
  return response.data;
};

/**
 * Submit manual payment proof (JazzCash QR / Till ID).
 *
 * @param {string} requestCode
 * @param {FormData} formData
 * @returns {Promise<Object>}
 */
export const submitManualPaymentProof = async (requestCode, formData) => {
  const response = await api.post(`/requests/${requestCode}/payment/submit-proof`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Fetch proposal and assisted inquiry counts for current user.
 *
 * @returns {Promise<Object>}
 */
export const getRequestCounts = async () => {
  const response = await api.get('/requests/counts');
  return response.data;
};

/**
 * Fetch assisted profile inquiries submitted by the current user.
 *
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export const getMyAssistedInquiries = async (params = {}) => {
  const response = await api.get('/listings/my-inquiries', { params });
  return response.data;
};

