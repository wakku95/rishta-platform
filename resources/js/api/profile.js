import api from './client';

/**
 * Fetch authenticated user's matrimonial profile with preferences.
 */
export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

/**
 * Create or update authenticated user's matrimonial biodata.
 */
export const saveProfile = async (profileData) => {
  const response = await api.post('/profile', profileData);
  return response.data;
};

/**
 * Fetch partner preferences.
 */
export const getPreferences = async () => {
  const response = await api.get('/profile/preferences');
  return response.data;
};

/**
 * Save partner preferences.
 */
export const savePreferences = async (preferencesData) => {
  const response = await api.put('/profile/preferences', preferencesData);
  return response.data;
};

/**
 * Activate the user's matrimonial profile.
 */
export const activateProfile = async () => {
  const response = await api.post('/profile/activate');
  return response.data;
};

/**
 * Hide the user's matrimonial profile from discovery.
 */
export const hideProfile = async () => {
  const response = await api.post('/profile/hide');
  return response.data;
};
