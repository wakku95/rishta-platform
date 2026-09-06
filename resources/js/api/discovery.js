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
