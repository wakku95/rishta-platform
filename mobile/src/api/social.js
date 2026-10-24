import apiClient from './client';

export const socialApi = {
  getLatestRequest: async () => {
    const res = await apiClient.get('/social-media-publication-requests/latest');
    return res.data;
  },

  submitRequest: async (platforms, consentGiven = true) => {
    const res = await apiClient.post('/social-media-publication-requests', {
      requested_platforms: platforms,
      consent_given: consentGiven,
    });
    return res.data;
  },

  removeRequest: async (id) => {
    const res = await apiClient.post(`/social-media-publication-requests/${id}/remove`);
    return res.data;
  },
};
