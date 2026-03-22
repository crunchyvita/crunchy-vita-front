'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { authAPI } from '@/lib/api';

const AuthContext = createContext();
const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'auth_user';

export function AuthProvider({ children }) {
  // Keep initial render identical between server and client to avoid hydration mismatch.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const normalizeRole = (role) => String(role || '').trim().toUpperCase();

  // Helper to normalize user data
  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      role: normalizeRole(userData.role),
    };
  };

  const saveUserToStorage = (userData) => {
    if (typeof window === 'undefined') return;
    try {
      if (!userData) {
        localStorage.removeItem(USER_STORAGE_KEY);
      } else {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      }
    } catch {
      // Ignore storage errors and keep in-memory state
    }
  };

  const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const rawUser = localStorage.getItem(USER_STORAGE_KEY);
      if (!rawUser) return null;
      return normalizeUser(JSON.parse(rawUser));
    } catch {
      return null;
    }
  };

  const clearSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    setUser(null);
  };

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Keep session in sync: if account is deactivated server-side, force logout quickly.
  // But use a longer interval (60s) and be more resilient to network errors
  useEffect(() => {
    const hasToken = () => typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_STORAGE_KEY);

    const revalidateIfNeeded = async () => {
      if (!hasToken()) return;
      
      try {
        const response = await authAPI.getMe();
        if (response?.user) {
          // User still valid, update user data to catch any changes (with normalization)
          const normalizedUser = normalizeUser(response.user);
          setUser(normalizedUser);
        }
      } catch (error) {
        const isDeactivated = error?.message?.toLowerCase().includes('deactivated');
        const isUnauthorized = error?.status === 401;
        
        if (isDeactivated || isUnauthorized) {
          console.warn('[Auth] Session invalid, clearing auth state');
          clearSession();
          if (isDeactivated) {
            router.push('/auth/deactivated');
          }
          return;
        }

        // If API is temporarily unavailable, keep the existing user if present.
        if (!user) {
          const cachedUser = getStoredUser();
          if (cachedUser) {
            setUser(cachedUser);
          }
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        revalidateIfNeeded();
      }
    };

    window.addEventListener('focus', revalidateIfNeeded);
    document.addEventListener('visibilitychange', onVisibilityChange);
    
    // Increased interval from 30s to 60s to reduce unnecessary revalidations
    const intervalId = setInterval(revalidateIfNeeded, 60000);

    return () => {
      window.removeEventListener('focus', revalidateIfNeeded);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(intervalId);
    };
  }, [router, user]);

  const checkAuth = async () => {
    try {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
        setLoading(false);
        return;
      }

      const cachedUser = getStoredUser();

      const response = await authAPI.getMe();
      if (response?.user) {
        const normalizedUser = normalizeUser(response.user);
        console.log('[Auth] checkAuth user:', normalizedUser);
        setUser(normalizedUser);
        saveUserToStorage(normalizedUser);
      } else if (cachedUser) {
        // Keep cached user when backend returns an unexpected shape.
        setUser(cachedUser);
      }
    } catch (error) {
      console.error('[Auth] checkAuth error:', error.message);

      const isDeactivated = error?.message?.toLowerCase().includes('deactivated');
      const isUnauthorized = error?.status === 401;

      if (isDeactivated || isUnauthorized) {
        clearSession();
        if (isDeactivated) {
          router.push('/auth/deactivated');
        }
        return;
      }

      const cachedUser = getStoredUser();
      if (cachedUser) {
        setUser(cachedUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      
      // Normalize user data (trim and uppercase role)
      const normalizedUser = normalizeUser(response.user);
      console.log('[Auth] login user:', normalizedUser);
      setUser(normalizedUser);
      saveUserToStorage(normalizedUser);
      
      // Reload cart after login (merged guest cart will be available)
      // Dispatch custom event so useCart hook can reload
      window.dispatchEvent(new CustomEvent('cartNeedsReload'));
      
      return { success: true, user: normalizedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      
      // Normalize user data (trim and uppercase role)
      const normalizedUser = normalizeUser(response.user);
      console.log('[Auth] register user:', normalizedUser);
      setUser(normalizedUser);
      saveUserToStorage(normalizedUser);
      
      // Reload cart after register (merged guest cart will be available)
      // Dispatch custom event so useCart hook can reload
      window.dispatchEvent(new CustomEvent('cartNeedsReload'));
      
      return { success: true, user: normalizedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    clearSession();
    router.push('/auth/login');
  };

  const setUserData = (userData, token) => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    
    // Normalize user data (trim and uppercase role)
    const normalizedUser = normalizeUser(userData);
    console.log('[Auth] setUserData user:', normalizedUser);
    setUser(normalizedUser);
    saveUserToStorage(normalizedUser);
    setLoading(false); // Ensure loading is set to false after setting user
  };

  const updateUser = (userData) => {
    // Normalize user data (trim and uppercase role)
    const normalizedUser = normalizeUser(userData);
    console.log('[Auth] updateUser user:', normalizedUser);
    setUser(normalizedUser);
    saveUserToStorage(normalizedUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    setUserData,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

