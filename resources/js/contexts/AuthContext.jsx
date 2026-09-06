import React, { createContext, useState, useEffect, useCallback } from 'react';
import api, { getCsrfCookie } from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user from Sanctum session
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
      return response.data.data;
    } catch (error) {
      setUser(null);
      return null;
    }
  }, []);

  // Initial session check on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshUser();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to global 401 unauthorized event from api client
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshUser]);

  // Login handler
  const login = async ({ email, password, remember = false }) => {
    await getCsrfCookie();
    const response = await api.post('/auth/login', { email, password, remember });
    setUser(response.data.data);
    return response.data;
  };

  // Register handler
  const register = async ({ name, email, password, password_confirmation }) => {
    await getCsrfCookie();
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    setUser(response.data.data);
    return response.data;
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  // Resend verification email handler
  const resendVerification = async () => {
    const response = await api.post('/auth/email/verification-notification');
    return response.data;
  };

  const value = {
    user,
    loading,
    authenticated: !!user,
    emailVerified: !!user?.email_verified,
    login,
    register,
    logout,
    refreshUser,
    resendVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
