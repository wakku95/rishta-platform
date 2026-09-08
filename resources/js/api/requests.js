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
