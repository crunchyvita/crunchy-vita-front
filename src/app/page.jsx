'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect based on role if authenticated
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'CLIENT') {
        router.push('/client/shop');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Welcome to CrunchyVita
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Your healthy lifestyle marketplace
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className="flex h-12 items-center justify-center rounded-md bg-green-600 px-6 text-sm font-semibold text-white hover:bg-green-500"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="flex h-12 items-center justify-center rounded-md border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
