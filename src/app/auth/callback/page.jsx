'use client';

import { useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const { setUserData } = useAuth();
  const hasHandledAuthRef = useRef(false);

  const normalizeRole = (role) => String(role || '').trim().toUpperCase();

  const parseUserParam = (value) => {
    if (!value) return null;

    try {
      // URLSearchParams already decodes values in most cases.
      return JSON.parse(value);
    } catch {
      try {
        // Fallback for cases where value is still encoded.
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return null;
      }
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchCurrentUserWithRetry = async (maxAttempts = 3) => {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await authAPI.getMe();
        if (response?.user) {
          return response.user;
        }
        throw new Error('Authenticated user not found in response');
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await delay(350 * attempt);
        }
      }
    }

    throw lastError || new Error('Unable to fetch authenticated user');
  };

  const redirectNow = (path, hardTimeout) => {
    clearTimeout(hardTimeout);
    if (typeof window !== 'undefined') {
      window.location.replace(path);
    }
  };

  const resolveTargetPath = (role) => {
    const normalizedRole = normalizeRole(role);
    if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPERADMIN') return '/admin/dashboard';
    if (normalizedRole === 'CLIENT') return '/shop';
    return '/';
  };

  useEffect(() => {
    if (hasHandledAuthRef.current) {
      return;
    }

    hasHandledAuthRef.current = true;

    const hardTimeout = setTimeout(() => {
      console.warn('[Auth] Hard timeout reached (9s), redirecting to login');
      redirectNow('/auth/login?error=authentication_timeout', hardTimeout);
    }, 9000);

    const handleAuth = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const roleParam = searchParams.get('role');

      if (!token) {
        redirectNow('/auth/login?error=authentication_failed', hardTimeout);
        return;
      }

      try {
        // Persist token as soon as possible for subsequent requests.
        localStorage.setItem('token', token);

        // Use callback role immediately to avoid misrouting while /auth/me is still resolving.
        if (roleParam) {
          setUserData(
            {
              id: 'oauth-pending',
              name: 'Google User',
              email: '',
              role: roleParam,
            },
            token
          );

          const callbackTarget = resolveTargetPath(roleParam);
          console.log('[Auth] Redirect target from callback role:', callbackTarget, 'role:', roleParam);
          redirectNow(callbackTarget, hardTimeout);
          return;
        }

        // Legacy path: older backend callback may still provide user payload.
        let user = parseUserParam(userParam);

        // Main path: resolve user from API with retries (required for role updates).
        if (!user) {
          user = await fetchCurrentUserWithRetry(3);
        }

        if (!user) {
          throw new Error('Unable to resolve authenticated user');
        }

        setUserData(user, token);

        const targetPath = resolveTargetPath(user.role);
        console.log('[Auth] Redirect target:', targetPath, 'role:', user.role);
        redirectNow(targetPath, hardTimeout);
      } catch (error) {
        console.error('Error processing authentication:', error);
        if (String(error?.message || '').toLowerCase().includes('deactivated')) {
          redirectNow('/auth/deactivated', hardTimeout);
          return;
        }

        // If role is known from callback, route user safely instead of forcing login loop.
        if (roleParam) {
          setUserData(
            {
              id: 'oauth-pending',
              name: 'Google User',
              email: '',
              role: roleParam,
            },
            token
          );
          const fallbackTarget = resolveTargetPath(roleParam);
          redirectNow(fallbackTarget, hardTimeout);
          return;
        }

        localStorage.removeItem('token');
        redirectNow('/auth/login?error=authentication_failed', hardTimeout);
      }
    };

    handleAuth();

    return () => clearTimeout(hardTimeout);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

