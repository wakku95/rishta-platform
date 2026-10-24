import apiClient from './client';

export const profilesApi = {
  // Discovery & Search
  search: async (params = {}) => {
    const res = await apiClient.get('/discovery/profiles', { params });
    return res.data;
  },

  getDetail: async (profileCode) => {
    const res = await apiClient.get(`/discovery/profiles/${profileCode}`);
    return res.data;
  },

  // Assisted Listings
  getAssistedListings: async (params = {}) => {
    const res = await apiClient.get('/listings', { params });
    return res.data;
  },

  getAssistedDetail: async (listingCode) => {
    const res = await apiClient.get(`/listings/${listingCode}`);
    return res.data;
  },

  submitAssistedInterest: async (listingCode, data) => {
    const res = await apiClient.post(`/listings/${listingCode}/interest`, data);
    return res.data;
  },

  // Shortlists
  getShortlist: async () => {
    const res = await apiClient.get('/shortlists');
    return res.data;
  },

  addToShortlist: async (profileCode) => {
    const res = await apiClient.post('/shortlists', { profile_code: profileCode });
    return res.data;
  },

  removeFromShortlist: async (profileCode) => {
    const res = await apiClient.delete(`/shortlists/${profileCode}`);
    return res.data;
  },

  // Hide / Ignore Profiles
  hideProfile: async (profileCode) => {
    const res = await apiClient.post(`/discovery/profiles/${profileCode}/hide`);
    return res.data;
  },

  unhideProfile: async (profileCode) => {
    const res = await apiClient.delete(`/discovery/profiles/${profileCode}/hide`);
    return res.data;
  },

  getHiddenProfiles: async () => {
    const res = await apiClient.get('/discovery/hidden-profiles');
    return res.data;
  },

  // User Profile Management (/api/profile)
  getMyProfile: async () => {
    const res = await apiClient.get('/profile');
    return res.data;
  },

  getProfileOptions: async () => {
    const res = await apiClient.get('/profile/options');
    return res.data;
  },

  saveProfile: async (data) => {
    const res = await apiClient.post('/profile', data);
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await apiClient.put('/profile', data);
    return res.data;
  },

  getPreferences: async () => {
    const res = await apiClient.get('/profile/preferences');
    return res.data;
  },

  updatePreferences: async (data) => {
    const res = await apiClient.put('/profile/preferences', data);
    return res.data;
  },

  activateSelfProfile: async () => {
    const res = await apiClient.post('/profile/activate');
    return res.data;
  },

  hideSelfProfile: async () => {
    const res = await apiClient.post('/profile/hide');
    return res.data;
  },

  getProfilePreview: async () => {
    const res = await apiClient.get('/profile/preview');
    return res.data;
  },
};
