import api from './client';

/**
 * Send a new Rishta request to a candidate.
 *
 * @param {string} profileCode - Target candidate profile code
 * @returns {Promise<Object>}
 */
export const sendRishtaRequest = async (profileCode) => {
  const response = await api.post('/requests', { profile_code: profileCode });
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
 * Accept a received request.
 *
 * @param {string} requestCode
 * @returns {Promise<Object>}
 */
export const acceptRequest = async (requestCode) => {
  const response = await api.post(`/requests/${requestCode}/accept`);
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

/*
|--------------------------------------------------------------------------
| Phase 5: Payment & Contact Unlock APIs
|--------------------------------------------------------------------------
*/

/**
 * Initiate contact unlock fee payment (Rs. 300 PKR) for accepted request.
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
