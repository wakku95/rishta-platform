import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';

/**
 * Global Axios Client for Mobile.
 * Configured with automatic Authorization header injection and 401 handling.
 */
const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 20000,
});

// Interceptor to inject Sanctum Bearer token into outgoing requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token = await SecureStore.getItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN);
      if (token && token !== 'session_cookie_active') {
        if (token.startsWith('Bearer ')) {
          token = token.substring(7);
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Failed to read auth token from SecureStore:', err);
    }

    // Allow native multipart boundary to be computed automatically for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle responses and unauthenticated redirects
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only purge credentials on explicit authentication checks, not arbitrary feed actions
    if (
      error.response &&
      error.response.status === 401 &&
      error.config?.url?.includes('/auth/me')
    ) {
      try {
        await SecureStore.deleteItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(Config.STORAGE_KEYS.USER_DATA);
      } catch (e) {
        // Ignore cleanup failure
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
