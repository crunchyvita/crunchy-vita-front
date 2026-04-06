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
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const normalizeRole = (role) => String(role || '').trim().toUpperCase();
  const normalizeToken = (value) => String(value || '').replace(/^Bearer\s+/i, '').trim();
  const isLikelyJwt = (value) => {
    const token = normalizeToken(value);
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    return parts.every((part) => /^[A-Za-z0-9_-]{8,}$/.test(part));
  };

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
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    setHasToken(false);
    setUser(null);
  };

  const syncTokenState = () => {
    if (typeof window === 'undefined') {
      setHasToken(false);
      return false;
    }
    const local = String(localStorage.getItem(TOKEN_STORAGE_KEY) || '').trim();
    const session = String(sessionStorage.getItem(TOKEN_STORAGE_KEY) || '').trim();
    const present = isLikelyJwt(local) || isLikelyJwt(session);
    setHasToken(present);
    return present;
  };

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      console.warn('[Auth] Received unauthorized API event, clearing auth state');
      clearSession();
      router.push('/auth/login?error=session_expired');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', onUnauthorized);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:unauthorized', onUnauthorized);
      }
    };
  }, [router]);

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

      const token = String(localStorage.getItem(TOKEN_STORAGE_KEY) || '').trim();
      if (!isLikelyJwt(token)) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
        setHasToken(false);
        setLoading(false);
        return;
      }

      setHasToken(true);

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
      syncTokenState();
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (!isLikelyJwt(response?.token)) {
        clearSession();
        return { success: false, error: 'Invalid authentication token. Please login again.' };
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      setHasToken(true);
      
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
      if (!isLikelyJwt(response?.token)) {
        clearSession();
        return { success: false, error: 'Invalid authentication token. Please login again.' };
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      setHasToken(true);
      
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

    // Use a hard redirect fallback to avoid SPA routing races.
    if (typeof window !== 'undefined') {
      try {
        router.replace('/');
      } finally {
        setTimeout(() => {
          if (window.location.pathname !== '/') {
            window.location.assign('/');
          }
        }, 0);
      }
      return;
    }

    router.replace('/');
  };

  const setUserData = (userData, token) => {
    const normalizedToken = normalizeToken(token);
    if (normalizedToken && isLikelyJwt(normalizedToken)) {
      localStorage.setItem(TOKEN_STORAGE_KEY, normalizedToken);
      setHasToken(true);
    } else {
      if (token && typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      syncTokenState();
    }
    
    // Normalize user data (trim and uppercase role)
    const normalizedUser = normalizeUser(userData);
    console.log('[Auth] setUserData user:', normalizedUser);
    setUser(normalizedUser);
    saveUserToStorage(normalizedUser);
    // Keep cart state in sync after OAuth callback login (same behavior as email/password).
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cartNeedsReload'));
    }
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
    isAuthenticated: !!user && hasToken,
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

