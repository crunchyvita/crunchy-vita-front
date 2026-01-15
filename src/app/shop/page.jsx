'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

function ClientShop() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">CrunchyVita Shop</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.name || 'Customer'}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="rounded-lg border-4 border-dashed border-gray-200 p-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                Welcome to CrunchyVita Shop
              </h2>
              <div className="space-y-4">
                <div className="rounded-lg bg-white p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-900">Your Account</h3>
                  <dl className="mt-4 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-900">Shop Categories</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 p-4 hover:border-green-500 hover:shadow-md">
                      <h4 className="font-medium text-gray-900">Healthy Snacks</h4>
                      <p className="mt-2 text-sm text-gray-500">Browse our healthy snack collection</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 hover:border-green-500 hover:shadow-md">
                      <h4 className="font-medium text-gray-900">Vitamins</h4>
                      <p className="mt-2 text-sm text-gray-500">Essential vitamins and supplements</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 hover:border-green-500 hover:shadow-md">
                      <h4 className="font-medium text-gray-900">Superfoods</h4>
                      <p className="mt-2 text-sm text-gray-500">Premium superfood selections</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 hover:border-green-500 hover:shadow-md">
                      <h4 className="font-medium text-gray-900">Wellness</h4>
                      <p className="mt-2 text-sm text-gray-500">Wellness and lifestyle products</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-green-50 p-6">
                  <p className="text-sm text-green-800">
                    This is the client shop page. Add your product catalog and shopping features here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default ClientShop;

