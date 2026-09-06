import axios from 'axios';

/**
 * Pre-configured Axios instance for Laravel Sanctum SPA Cookie Authentication.
 * 
 * Rules:
 * - withCredentials: true sends HttpOnly session cookies automatically
 * - withXSRFToken: true handles Laravel's XSRF-TOKEN cookie for CSRF protection
 * - Standardized JSON error response extraction
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
});

/**
 * Initialize CSRF cookie before authentication operations.
 */
export const getCsrfCookie = () => {
  return axios.get('/sanctum/csrf-cookie', { withCredentials: true });
};

// Response Interceptor for centralized API handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized handler
    if (error.response?.status === 401) {
      // Dispatch custom event if needed for state reset
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default api;
