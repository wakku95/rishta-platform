import api from './client';

/**
 * Search active matrimonial candidate profiles with filters and pagination.
 *
 * @param {Object} params - Query parameters (gender, min_age, max_age, city, religion, sect, etc.)
 * @returns {Promise<Object>} API response with data and pagination meta
 */
export const searchProfiles = async (params = {}) => {
  const response = await api.get('/discovery/profiles', { params });
  return response.data;
};

/**
 * Fetch a single public candidate profile by its unique profile code.
 *
 * @param {string} profileCode - Unique public profile code (e.g. 'RK-7F4K92')
 * @returns {Promise<Object>} API response with public candidate data
 */
export const getPublicProfile = async (profileCode) => {
  const response = await api.get(`/discovery/profiles/${profileCode}`);
  return response.data;
};

/**
 * Privately hide a candidate profile from the user's discovery feed.
 */
export const hideProfile = async (profileCode) => {
  const response = await api.post(`/discovery/profiles/${profileCode}/hide`);
  return response.data;
};

/**
 * Unhide a candidate profile.
 */
export const unhideProfile = async (profileCode) => {
  const response = await api.delete(`/discovery/profiles/${profileCode}/hide`);
  return response.data;
};

/**
 * Fetch all candidate profiles and listings hidden by the user.
 */
export const getHiddenProfiles = async () => {
  const response = await api.get('/discovery/hidden-profiles');
  return response.data;
};

/**
 * Submit an agent-assisted direct inquiry for a candidate profile.
 */
export const submitProfileInquiry = async (profileCode, payload) => {
  const response = await api.post(`/discovery/profiles/${profileCode}/inquire`, payload);
  return response.data;
};

