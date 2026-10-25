import apiClient from './client';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';

export const verificationApi = {
  getStatus: async () => {
    const res = await apiClient.get('/verifications');
    return res.data;
  },

  submitIdentity: async (formData) => {
    const res = await apiClient.post('/verifications/identity', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => data,
    });
    return res.data;
  },

  submitEducation: async (formData) => {
    const res = await apiClient.post('/verifications/education', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => data,
    });
    return res.data;
  },

  withdraw: async (id) => {
    const res = await apiClient.delete(`/verifications/${id}`);
    return res.data;
  },
};
