"use client";

import { useEffect, useState, useMemo } from "react";
import AdminHeader from "@/components/admin/header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { adminManagementAPI } from "@/lib/api";
import { Users, RefreshCw, Power, Search, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

function ClientsManagementPageContent() {
  const PAGE_SIZE = 5;
  const tc = useTranslations("admin.customers");
  const tcom = useTranslations("admin.common");
  const locale = useLocale();
  const { user } = useAuth();
  const canManageClientStatus = user?.role === "SUPERADMIN" || user?.role === "ADMIN";
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null); // Track specific row update

  const loadClients = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminManagementAPI.listClients();
      const list = response?.data || [];
      setClients(list);
    } catch (err) {
      setError(err.message || tc("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.trim().toLowerCase();
    return clients.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const handleToggleStatus = async (clientId, currentStatus) => {
    if (!canManageClientStatus) return;
    
    setUpdatingId(clientId); // Set local loading for this button only
    try {
      const newStatus = !currentStatus;
      await adminManagementAPI.updateClientStatus(clientId, newStatus);
      
      // Update local state directly so we DON'T trigger loadClients() and a full page reload
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, isActive: newStatus } : c))
      );
    } catch (err) {
      setError(err.message || tc("updateError"));
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const paginatedClients = filteredClients.slice(start, start + PAGE_SIZE);

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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              {tc("title")}
              <span className="rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
                {tcom("clientsCount", { count: clients.length })}
              </span>
            </div>
            <p className="text-sm text-slate-500">{tc("subtitle")}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={tcom("search")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
              {tc("loading")}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-2">
                <Users className="h-10 w-10 text-slate-200" />
                <p className="font-bold text-slate-400">{tc("empty")}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">{tcom("name")}</th>
                    <th className="px-3 py-2 font-medium">{tcom("created")}</th>
                    <th className="px-3 py-2 font-medium">{tcom("status")}</th>
                    {canManageClientStatus && <th className="px-3 py-2 text-right font-medium">{tcom("actions")}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedClients.map((client) => (
                    <tr key={client.id} className="text-slate-700">
                      <td className="px-3 py-4 align-middle font-medium text-slate-900">
                        <div className="flex flex-col gap-1">
                          <span>{client.name || "-"}</span>
                          <span className="text-[11px] text-slate-500 break-all">{client.email || "-"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-middle text-slate-700">{formatDate(client.createdAt)}</td>
                      <td className="px-3 py-4 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            client.isActive !== false
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {client.isActive !== false ? tcom("active") : tcom("inactive")}
                        </span>
                      </td>
                      {canManageClientStatus && (
                        <td className="px-3 py-4 align-middle text-right">
                          <button
                            type="button"
                            disabled={updatingId === client.id}
                            onClick={() => handleToggleStatus(client.id, client.isActive !== false)}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                              client.isActive !== false
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {updatingId === client.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Power className="h-3.5 w-3.5" />
                            )}
                            {client.isActive !== false ? tc("deactivate") : tc("activate")}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && filteredClients.length > 0 && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>{tcom("pageOf", { page: safePage, total: totalPages })}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
              >
                {tcom("previous")}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
              >
                {tcom("next")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function ClientsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}>
      <ClientsManagementPageContent />
    </ProtectedRoute>
  );
}