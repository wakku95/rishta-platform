import api from './client';

/**
 * Fetch paginated list of shortlisted candidate profiles.
 *
 * @param {Object} params - Query parameters (e.g. page, per_page)
 * @returns {Promise<Object>} API response with data and pagination meta
 */
export const getShortlists = async (params = {}) => {
  const response = await api.get('/shortlists', { params });
  return response.data;
};

/**
 * Shortlist a candidate profile.
 *
 * @param {string} profileCode - Unique profile code (e.g. 'RK-7F4K92')
 * @returns {Promise<Object>}
 */
export const addToShortlist = async (profileCode) => {
  const response = await api.post('/shortlists', { profile_code: profileCode });
  return response.data;
};

/**
 * Remove a candidate profile from shortlist.
 *
 * @param {string} profileCode - Unique profile code
 * @returns {Promise<Object>}
 */
export const removeFromShortlist = async (profileCode) => {
  const response = await api.delete(`/shortlists/${profileCode}`);
  return response.data;
};
