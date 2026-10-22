import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';
import { Config } from '../constants/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app launch from SecureStore
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN);
        const savedUserStr = await SecureStore.getItemAsync(Config.STORAGE_KEYS.USER_DATA);
        const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;

        // Immediately purge any legacy mock/zombie tokens from previous dev builds
        const isZombieToken =
          !savedToken ||
          savedToken.startsWith('auth_token_') ||
          savedToken === 'auth_logged_in';

        if (isZombieToken) {
          if (savedToken) {
            await SecureStore.deleteItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN);
          }
          if (savedUser) {
            await SecureStore.deleteItemAsync(Config.STORAGE_KEYS.USER_DATA);
          }
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Token or session active
        setToken(savedToken);
        if (savedUser) {
          setUser(savedUser);
        }

        // Validate token against backend /auth/me only if real token
        if (savedToken !== 'session_cookie_active') {
          try {
            const userData = await authApi.me();
            const freshUser = userData.user || userData.data || userData;
            if (freshUser && (freshUser.id || freshUser.email)) {
              setUser(freshUser);
              await SecureStore.setItemAsync(Config.STORAGE_KEYS.USER_DATA, JSON.stringify(freshUser));
            }
          } catch (e) {
            console.warn('Profile sync notice:', e.message);
            // If server explicitly reports 401 Unauthenticated, the token is revoked/expired
            if (e.response?.status === 401) {
              await SecureStore.deleteItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN);
              await SecureStore.deleteItemAsync(Config.STORAGE_KEYS.USER_DATA);
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('Auth bootstrapping failed:', err);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (credentials) => {
    const payload = {
      email: (credentials.email || credentials.login || '').trim(),
      login: (credentials.email || credentials.login || '').trim(),
      password: credentials.password,
    };
    const res = await authApi.login(payload);
    const receivedUser = res.user || res.data?.user || (res.data?.id ? res.data : null);
    const receivedToken =
      res.token ||
      res.access_token ||
      res.data?.token ||
      res.data?.access_token ||
      null;

    if (receivedToken) {
      await SecureStore.setItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN, receivedToken);
      setToken(receivedToken);
    } else {
      // Fallback: If server hasn't yet deployed Sanctum token return, persist session cookie state
      await SecureStore.setItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN, 'session_cookie_active');
      setToken('session_cookie_active');
    }

    if (receivedUser) {
      await SecureStore.setItemAsync(Config.STORAGE_KEYS.USER_DATA, JSON.stringify(receivedUser));
      setUser(receivedUser);
    }
    return res;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    const receivedUser = res.user || res.data?.user || (res.data?.id ? res.data : null);
    const receivedToken =
      res.token ||
      res.access_token ||
      res.data?.token ||
      res.data?.access_token;

    if (receivedToken) {
      await SecureStore.setItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN, receivedToken);
      setToken(receivedToken);
    }
    if (receivedUser) {
      await SecureStore.setItemAsync(Config.STORAGE_KEYS.USER_DATA, JSON.stringify(receivedUser));
      setUser(receivedUser);
    }
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore
    } finally {
      await SecureStore.deleteItemAsync(Config.STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(Config.STORAGE_KEYS.USER_DATA);
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.me();
      const freshUser = userData.user || userData.data || userData;
      if (freshUser && (freshUser.id || freshUser.email)) {
        setUser(freshUser);
        await SecureStore.setItemAsync(Config.STORAGE_KEYS.USER_DATA, JSON.stringify(freshUser));
      }
      return freshUser;
    } catch (e) {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authenticated: !!user,
        loading,
        hasProfile: !!user?.has_profile,
        isIdentityVerified: !!user?.is_identity_verified,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
