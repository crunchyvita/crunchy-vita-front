'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserData } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const isNewUser = searchParams.get('isNew') === 'true'; // Check if user is new

      if (!token) {
        router.push('/auth/login?error=authentication_failed');
        return;
      }

      try {
        let user;

        if (userParam) {
          // User data provided in URL
          try {
            user = JSON.parse(decodeURIComponent(userParam));
            setUserData(user, token);
          } catch (parseError) {
            console.error('Error parsing user data from URL:', parseError);
            // Fall through to fetch user data
            user = null;
          }
        }

        // If user data not in URL or parsing failed, fetch it using the token
        if (!user) {
          // Store token first
          localStorage.setItem('token', token);
          
          // Fetch user data
          const response = await authAPI.getMe();
          user = response.user;
          setUserData(user, token);
        }

        // Redirect based on user role
        if (user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (user.role === 'CLIENT') {
          router.push('/client/shop');
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error processing authentication:', error);
        localStorage.removeItem('token');
        router.push('/auth/login?error=authentication_failed');
      }
    };

    handleAuth();
  }, [searchParams, router]);

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

