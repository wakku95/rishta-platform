import apiClient from './client';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';

export const verificationApi = {
  getStatus: async () => {
    const res = await apiClient.get('/verifications');
    return res.data;
  },

  submitIdentity: async (formData) => {
    let token = await SecureStore.getItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN);
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    const headers = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };
    if (token && token !== 'session_cookie_active') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Use native fetch for multipart/form-data to guarantee proper boundary generation in React Native
    const response = await fetch(`${Config.API_BASE_URL}/verifications/identity`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { message: responseText };
    }

    if (!response.ok) {
      const err = new Error(data.message || `Upload failed with status ${response.status}`);
      err.response = { data, status: response.status };
      throw err;
    }

    return data;
  },

  submitEducation: async (formData) => {
    let token = await SecureStore.getItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN);
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    const headers = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };
    if (token && token !== 'session_cookie_active') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${Config.API_BASE_URL}/verifications/education`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { message: responseText };
    }

    if (!response.ok) {
      const err = new Error(data.message || `Education upload failed with status ${response.status}`);
      err.response = { data, status: response.status };
      throw err;
    }

    return data;
  },

  withdraw: async (id) => {
    const res = await apiClient.delete(`/verifications/${id}`);
    return res.data;
  },
};
