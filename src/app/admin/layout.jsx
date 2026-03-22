"use client";

import AdminSideBarMenu from "@/components/admin/side-bar-menu";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayoutProvider } from "@/context/AdminLayoutContext";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}>
      <AdminLayoutProvider>
        <div className="flex min-h-screen bg-white">
          <AdminSideBarMenu />
          <main className="flex-1 bg-white px-8 pb-10 pt-8">
            {children}
          </main>
        </div>
      </AdminLayoutProvider>
    </ProtectedRoute>
  );
}
