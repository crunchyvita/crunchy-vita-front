"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { adminManagementAPI } from "@/lib/api";
import { Users, RefreshCw, Power } from "lucide-react";

function ClientsManagementPageContent() {
  const { user } = useAuth();
  const canManageClientStatus = user?.role === "SUPERADMIN" || user?.role === "ADMIN";
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClients = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminManagementAPI.listClients();
      setClients(response?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleToggleStatus = async (clientId, currentStatus) => {
    if (!canManageClientStatus) {
      return;
    }

    try {
      await adminManagementAPI.updateClientStatus(clientId, !currentStatus);
      await loadClients();
    } catch (err) {
      setError(err.message || "Failed to update client status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />

      <main className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                <Users className="h-6 w-6 text-[#556622]" />
                Clients Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {canManageClientStatus
                  ? "Admin/SuperAdmin: list all client accounts and activate/deactivate them."
                  : "List all client accounts."}
              </p>
            </div>
            <button
              type="button"
              onClick={loadClients}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No clients found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {canManageClientStatus ? (
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((client) => (
                    <tr key={client.id} className="align-top text-slate-700">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={client.name || ""}
                          readOnly
                          className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="email"
                          value={client.email || ""}
                          readOnly
                          className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={client.role || "CLIENT"}
                          readOnly
                          className="w-full max-w-[140px] rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            client.isActive !== false
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {client.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {canManageClientStatus ? (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(client.id, client.isActive !== false)}
                              className={`inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold ${
                                client.isActive !== false
                                  ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              <Power className="h-3.5 w-3.5" />
                              {client.isActive !== false ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function ClientsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}>
      <ClientsManagementPageContent />
    </ProtectedRoute>
  );
}
