"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { adminManagementAPI } from "@/lib/api";
import { Shield, Plus, RefreshCw, Power, Search, Trash2 } from "lucide-react";

const INITIAL_CREATE_FORM = {
  email: "",
};

function AdministratorManagementPageContent() {
  const [admins, setAdmins] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminManagementAPI.listAdmins();
      const list = response?.data || [];
      setAdmins(list);
    } catch (err) {
      setError(err.message || "Failed to load administrators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();

    // Load once and filter locally for instant suggestions while typing.
    adminManagementAPI
      .listClients()
      .then((response) => setAllClients(response?.data || []))
      .catch(() => setAllClients([]));
  }, []);

  useEffect(() => {
    const term = createForm.email.trim();

    if (!term) {
      setClientSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        if (allClients.length > 0) {
          const lowerTerm = term.toLowerCase();
          const filtered = allClients
            .filter((client) => {
              const email = String(client.email || '').toLowerCase();
              const name = String(client.name || '').toLowerCase();
              return email.includes(lowerTerm) || name.includes(lowerTerm);
            })
            .slice(0, 8);
          setClientSuggestions(filtered);
        } else {
          const response = await adminManagementAPI.searchClients(term);
          setClientSuggestions(response?.data || []);
        }
      } catch (err) {
        setClientSuggestions([]);
        setError(err?.message || "Search failed. Please refresh.");
      } finally {
        setSearchLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [createForm.email, allClients]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await adminManagementAPI.promoteClientByEmail(createForm.email.trim());

      setCreateForm(INITIAL_CREATE_FORM);
      await loadAdmins();
    } catch (err) {
      setError(err.message || "Failed to promote user to administrator");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    try {
      await adminManagementAPI.updateAdminStatus(adminId, !currentStatus);
      await loadAdmins();
    } catch (err) {
      setError(err.message || "Failed to update administrator status");
    }
  };

  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete?.id) return;

    setIsDeletingAdmin(true);
    setError("");

    try {
      await adminManagementAPI.deleteAdmin(adminToDelete.id);
      await loadAdmins();
      setIsDeleteModalOpen(false);
      setAdminToDelete(null);
    } catch (err) {
      setError(err.message || "Failed to delete administrator");
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  const handleSelectSuggestion = (email) => {
    setCreateForm((prev) => ({ ...prev, email }));
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />

      <main className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                <Shield className="h-6 w-6 text-[#556622]" />
                Administrators Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                SuperAdmin only: search a CLIENT by email and promote to ADMIN.
              </p>
            </div>
            <button
              type="button"
              onClick={loadAdmins}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {error ? (
            <div className="mb-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search client email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                onFocus={() => {
                  if (createForm.email.trim()) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 120);
                }}
                className="w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-[#556622]"
                required
              />
              {showSuggestions && createForm.email.trim() ? (
                <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                  {searchLoading ? (
                    <p className="px-3 py-2 text-xs text-slate-500">Searching clients...</p>
                  ) : clientSuggestions.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-500">No client found</p>
                  ) : (
                    <ul className="max-h-56 overflow-auto py-1">
                      {clientSuggestions.map((client) => (
                        <li key={client.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectSuggestion(client.email)}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <p className="text-sm font-medium text-slate-800">{client.email}</p>
                            <p className="text-xs text-slate-500">{client.name || "Client"}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#556622] px-5 py-2 text-sm font-semibold text-white hover:bg-[#46541c] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Promoting..." : "Promote to ADMIN"}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading administrators...</div>
          ) : admins.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No administrators found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="align-top text-slate-700">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={admin.name || ""}
                          readOnly
                          className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="email"
                          value={admin.email || ""}
                          readOnly
                          className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={admin.role || ""}
                          readOnly
                          className="w-full max-w-[160px] rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            admin.isActive !== false
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {admin.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(admin.id, admin.isActive !== false)}
                            className={`inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold ${
                              admin.isActive !== false
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {admin.isActive !== false ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(admin)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (isDeletingAdmin) return;
          setIsDeleteModalOpen(false);
          setAdminToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Administrator"
        itemName={adminToDelete?.name || adminToDelete?.email || "this administrator"}
        warningMessage="This administrator account will be permanently removed."
        description="This action cannot be undone and the user will lose admin access immediately."
        isDeleting={isDeletingAdmin}
      />
    </div>
  );
}

export default function AdministratorManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
      <AdministratorManagementPageContent />
    </ProtectedRoute>
  );
}
