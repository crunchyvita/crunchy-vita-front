'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from '@/navigation';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  const normalizeRole = (role) => String(role || '').trim().toUpperCase();

  useEffect(() => {
    // Don't redirect multiple times
    if (hasRedirectedRef.current) return;

    // Still loading - don't do anything yet
    if (loading) return;

    console.log('[ProtectedRoute] Check:', { 
      isAuthenticated, 
      userRole: user?.role,
      allowedRoles,
      normalizedRole: user?.role ? normalizeRole(user.role) : null
    });

    // User is not authenticated - redirect to login
    if (!isAuthenticated) {
      console.log('[ProtectedRoute] Not authenticated, redirecting to login');
      hasRedirectedRef.current = true;
      router.push('/auth/login');
      return;
    }

    // Check role authorization if specific roles are required
    if (allowedRoles.length > 0 && user) {
      const normalizedUserRole = normalizeRole(user.role);
      const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
      const isAllowed = normalizedAllowedRoles.includes(normalizedUserRole);

      console.log('[ProtectedRoute] Role check:', {
        userRole: user.role,
        normalizedUserRole,
        allowedRoles,
        normalizedAllowedRoles,
        isAllowed
      });

      if (!isAllowed) {
        // Redirect based on user role if not authorized
        hasRedirectedRef.current = true;
        if (normalizedUserRole === 'ADMIN' || normalizedUserRole === 'SUPERADMIN') {
          console.log('[ProtectedRoute] Not authorized, redirecting to admin dashboard');
          router.push('/admin/dashboard');
        } else if (normalizedUserRole === 'CLIENT') {
          console.log('[ProtectedRoute] Not authorized, redirecting to shop');
          router.push('/shop');
        } else {
          console.log('[ProtectedRoute] Not authorized, redirecting to home');
          router.push('/');
        }
        return;
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  // While loading, show a loading spinner
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

  // Not authenticated and we've already redirected (or about to)
  if (!isAuthenticated) {
    return null;
  }

  // Check role authorization one more time before rendering
  if (allowedRoles.length > 0 && user) {
    const normalizedUserRole = normalizeRole(user.role);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      // If we're not authorized, don't render the content
      // The effect hook will handle the redirect
      return null;
    }
  }

  // User is authenticated and authorized - render children
  return <>{children}</>;
}

