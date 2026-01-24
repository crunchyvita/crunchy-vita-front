'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authAPI.getMe();
      
      // Handle photo URL construction for local uploads
      let userData = response.user;
      if (userData?.photo && !userData.photo.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        userData = {
          ...userData,
          photo: `${cleanBaseUrl}${userData.photo}`
        };
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem('token', response.token);
      
      // Handle photo URL construction for local uploads
      let userData = response.user;
      if (userData?.photo && !userData.photo.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        userData = {
          ...userData,
          photo: `${cleanBaseUrl}${userData.photo}`
        };
      }
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);
      localStorage.setItem('token', response.token);
      
      // Handle photo URL construction for local uploads
      let userData = response.user;
      if (userData?.photo && !userData.photo.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        userData = {
          ...userData,
          photo: `${cleanBaseUrl}${userData.photo}`
        };
      }
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/auth/login');
  };

  const setUserData = (userData, token) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    
    // Handle photo URL construction for local uploads
    if (userData?.photo && !userData.photo.startsWith('http')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
      userData = {
        ...userData,
        photo: `${cleanBaseUrl}${userData.photo}`
      };
    }
    
    setUser(userData);
  };

  const updateUser = (userData) => {
    // Handle photo URL construction for local uploads
    if (userData?.photo && !userData.photo.startsWith('http')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
      userData = {
        ...userData,
        photo: `${cleanBaseUrl}${userData.photo}`
      };
    }
    setUser(userData);
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

