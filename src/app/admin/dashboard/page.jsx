'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">CrunchyVita Admin</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.name || 'Admin'}
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
                Admin Dashboard
              </h2>
              <div className="space-y-4">
                <div className="rounded-lg bg-white p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
                  <dl className="mt-4 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Role</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.role}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <button className="rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700">
                      Manage Products
                    </button>
                    <button className="rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700">
                      View Orders
                    </button>
                    <button className="rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700">
                      Manage Users
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-6">
                  <p className="text-sm text-blue-800">
                    This is the admin dashboard. Add your admin features here.
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

export default AdminDashboard;

