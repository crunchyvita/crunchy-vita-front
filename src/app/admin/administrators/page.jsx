"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { adminManagementAPI } from "@/lib/api";
import { Shield, Plus, RefreshCw, Power, Search, Trash2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const INITIAL_CREATE_FORM = {
  email: "",
};

function AdministratorManagementPageContent() {
  const PAGE_SIZE = 6;
  const ta = useTranslations("admin.administrators");
  const tcom = useTranslations("admin.common");
  const locale = useLocale();
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
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const loadAdmins = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminManagementAPI.listAdmins();
      const list = response?.data || [];
      setAdmins(list);
      setPage(1);
    } catch (err) {
      setError(err.message || ta("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
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
        const lowerTerm = term.toLowerCase();
        const filtered = allClients
          .filter((client) => {
            const email = String(client.email || '').toLowerCase();
            const name = String(client.name || '').toLowerCase();
            return email.includes(lowerTerm) || name.includes(lowerTerm);
          })
          .slice(0, 8);
        setClientSuggestions(filtered);
      } catch (err) {
        setClientSuggestions([]);
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
      setError(err.message || ta("assignError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    setUpdatingId(adminId);
    try {
      const newStatus = !currentStatus;
      await adminManagementAPI.updateAdminStatus(adminId, newStatus);
      // Local state update (no whole page reload)
      setAdmins((prev) =>
        prev.map((a) => (a.id === adminId ? { ...a, isActive: newStatus } : a))
      );
    } catch (err) {
      setError(err.message || ta("updateError"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete?.id) return;
    setIsDeletingAdmin(true);
    try {
      // Remove admin access (account returns to client role)
      await adminManagementAPI.downgradeAdmin(adminToDelete.id);
      setAdmins((prev) => prev.filter((a) => a.id !== adminToDelete.id));
      setIsDeleteModalOpen(false);
      setAdminToDelete(null);
    } catch (err) {
      setError(err.message || ta("removeError"));
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(admins.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const paginatedAdmins = admins.slice(start, start + PAGE_SIZE);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              {ta("title")}
              <span className="rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
                {tcom("adminsCount", { count: admins.length })}
              </span>
            </div>
            <p className="text-sm text-slate-500">{ta("subtitle")}</p>
          </div>
        </div>

        {/* Assign admin */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 gap-3 rounded-md border border-slate-100 bg-slate-50/50 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder={ta("searchPlaceholder")}
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                onFocus={() => createForm.email.trim() && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-[#556622] transition-all"
                required
              />
              {showSuggestions && (
                <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {searchLoading ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400">{ta("searching")}</div>
                  ) : clientSuggestions.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400">{ta("noClientsFound")}</div>
                  ) : (
                    <ul className="max-h-56 overflow-auto">
                      {clientSuggestions.map((client) => (
                        <li key={client.id} className="border-b border-slate-50 last:border-none">
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              // Prevent the input from losing focus before we select
                              // (the input `onBlur` hides the dropdown).
                              e.preventDefault();
                              setCreateForm({ email: client.email });
                              setShowSuggestions(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                          >
                            <p className="text-sm font-medium text-slate-800">{client.email}</p>
                            <p className="text-[10px] uppercase text-slate-400">{client.name || tcom("client")}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: "#556622" }}
              className="flex items-center justify-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? ta("assigning") : ta("assignAdmin")}
            </button>
          </form>
        </section>

        {/* Admin Table Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
              {ta("loading")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">{ta("administrator")}</th>
                    <th className="px-3 py-2 font-medium">{tcom("role")}</th>
                    <th className="px-3 py-2 font-medium">{tcom("status")}</th>
                    <th className="px-3 py-2 font-medium">{tcom("updated")}</th>
                    <th className="px-3 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAdmins.map((admin) => (
                    <tr key={admin.id} className="text-slate-700 hover:bg-slate-50/30">
                      <td className="px-3 py-4 align-middle">
                        <p className="font-medium text-slate-900">{admin.name || "-"}</p>
                        <p className="text-xs text-slate-500">{admin.email}</p>
                      </td>
                      <td className="px-3 py-4 align-middle">
                        <span className="text-xs font-mono text-slate-500">{admin.role || "ADMIN"}</span>
                      </td>
                      <td className="px-3 py-4 align-middle">
                        <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wider ${
                          admin.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {admin.isActive !== false ? tcom("active") : tcom("inactive")}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-middle text-slate-700">{formatDate(admin.updatedAt)}</td>
                      <td className="px-3 py-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={updatingId === admin.id}
                            onClick={() => handleToggleStatus(admin.id, admin.isActive !== false)}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                              admin.isActive !== false ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {updatingId === admin.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                            {admin.isActive !== false ? ta("deactivate") : ta("activate")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(admin)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {ta("remove")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {!loading && admins.length > 0 && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>{tcom("pageOf", { page: safePage, total: totalPages })}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm bg-white"
              >
                {tcom("previous")}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm bg-white"
              >
                {tcom("next")}
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeletingAdmin && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={ta("deleteTitle")}
        confirmMessage={ta("deleteConfirm", {
          email: adminToDelete?.email || ta("thisAdmin"),
        })}
        description={ta("deleteDescription")}
        isDeleting={isDeletingAdmin}
        confirmButtonLabel={ta("confirmRemove")}
        confirmLoadingLabel={ta("confirmRemoving")}
        cancelButtonLabel={tcom("cancel")}
      />
    </>
  );
}

export default function AdministratorManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
      <AdministratorManagementPageContent />
    </ProtectedRoute>
  );
}