"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/navigation";
import AdminHeader from "@/components/admin/header";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Eye, Loader2, MapPin, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { zonesAPI } from "@/lib/api";

const defaultShippingState = () => ({
  relay: { freeShipping: 40, StandarShippingFee: 4.9 },
  home: {
    freeShipping: 60,
    discountedShipping: 40,
    StandardShippingFee: 7.9,
    discountedShippingFee: 4.9,
    express: 9.9,
  },
  zones: [],
  promoBadgeZoneId: null,
});

const zoneIdentifier = (zone) => String(zone?._id ?? zone?.id ?? "");

export default function AdminShippingZonesPage() {
  const t = useTranslations("admin.shipping");
  const tcom = useTranslations("admin.common");
  const [loading, setLoading] = useState(true);
  const [shippingSettings, setShippingSettings] = useState(defaultShippingState);
  const [search, setSearch] = useState("");
  const [newZoneName, setNewZoneName] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState("");
  const [submittingZone, setSubmittingZone] = useState(false);
  const [zoneFormError, setZoneFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await zonesAPI.list();
      if (!data.success || !Array.isArray(data.data?.zones)) {
        toast.error(t("loadError"));
        return;
      }
      setShippingSettings((prev) => ({
        ...prev,
        zones: data.data.zones,
        promoBadgeZoneId: data.data.promoBadgeZoneId ?? null,
      }));
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (menuOpenId === null) return undefined;
    const onPointerDown = (e) => {
      const root = e.target?.closest?.("[data-zone-menu-root]");
      if (root) return;
      setMenuOpenId(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuOpenId]);

  const filteredZones = useMemo(() => {
    const zones = shippingSettings.zones || [];
    const q = search.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter((z) => (z.name || "").toLowerCase().includes(q));
  }, [shippingSettings.zones, search]);

  const handleCreateZone = async (event) => {
    event?.preventDefault?.();
    const name = newZoneName.trim();
    if (!name) {
      setZoneFormError(t("nameRequired"));
      toast.error(t("nameRequired"));
      return;
    }
    const exists = (shippingSettings.zones || []).some(
      (z) => String(z?.name || "").trim().toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      setZoneFormError(t("duplicateZoneName"));
      toast.error(t("duplicateZoneName"));
      return;
    }
    setZoneFormError("");
    if (submittingZone) return;
    setSubmittingZone(true);
    try {
      const data = await zonesAPI.create(name);
      if (!data.success) {
        toast.error(data.error || t("saveError"));
        return;
      }
      setShippingSettings((prev) => ({
        ...prev,
        zones: data.data.zones,
        promoBadgeZoneId: data.data.promoBadgeZoneId ?? null,
      }));
      setNewZoneName("");
      toast.success(t("zoneCreated"));
    } catch (err) {
      toast.error(err.message || t("saveError"));
    } finally {
      setSubmittingZone(false);
    }
  };

  const confirmDeleteZone = async () => {
    if (!zoneToDelete || deletingId) return;
    const id = zoneIdentifier(zoneToDelete);
    setDeletingId(id);
    try {
      const data = await zonesAPI.remove(id);
      if (!data.success) {
        toast.error(data.error || t("saveError"));
        return;
      }
      setShippingSettings((prev) => ({
        ...prev,
        zones: data.data.zones,
        promoBadgeZoneId: data.data.promoBadgeZoneId ?? null,
      }));
      setZoneToDelete(null);
      toast.success(t("zoneDeleted"));
    } catch (err) {
      toast.error(err.message || t("saveError"));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              {t("title")}
              <span className="rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
                {(shippingSettings.zones || []).length}
              </span>
            </div>
            <p className="text-sm text-slate-500">{t("subtitle")}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <form onSubmit={handleCreateZone} className="grid gap-2 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {tcom("name")}
              </label>
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => {
                  setNewZoneName(e.target.value);
                  if (zoneFormError) setZoneFormError("");
                }}
                placeholder={t("newPlaceholder")}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#556622] focus:ring-2 focus:ring-[#556622]/20"
              />
            </div>
            <button
              type="submit"
              disabled={submittingZone}
              className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 lg:whitespace-nowrap"
              style={{ backgroundColor: "#556622" }}
            >
              {submittingZone ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t("add")}
            </button>
            <p className="min-h-5 text-xs font-medium text-red-600 lg:col-start-1" aria-live="polite">
              {zoneFormError || "\u00A0"}
            </p>
          </form>

          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">{tcom("loading")}</div>
          ) : filteredZones.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <MapPin className="mx-auto h-10 w-10" />
              <p className="mt-2 text-sm font-semibold">{t("empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">{tcom("name")}</th>
                    <th className="px-3 py-2 font-medium">{t("countriesCount")}</th>
                    <th className="px-3 py-2 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredZones.map((zone) => (
                    <tr key={zoneIdentifier(zone)} className="text-slate-700">
                      <td className="px-3 py-3 font-medium text-slate-900">
                        <Link href={`/admin/shipping/${encodeURIComponent(zoneIdentifier(zone))}`} className="hover:text-[#556622]">
                          {zone.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3">{Array.isArray(zone.countries) ? zone.countries.length : 0}</td>
                      <td className="px-3 py-3 text-right relative">
                        <div className="relative inline-block text-left" data-zone-menu-root>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md  text-[#7f95b2] hover:bg-slate-200"
                            aria-label={t("actions")}
                            aria-expanded={menuOpenId === zoneIdentifier(zone)}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMenuOpenId((id) => (id === zoneIdentifier(zone) ? null : zoneIdentifier(zone)));
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {menuOpenId === zoneIdentifier(zone) ? (
                            <div className="absolute right-0 top-10 z-30 min-w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                              <Link
                                href={`/admin/shipping/${encodeURIComponent(zoneIdentifier(zone))}`}
                                className="flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setMenuOpenId(null)}
                              >
                                <Eye className="h-4 w-4" />
                                {t("viewDetails")}
                              </Link>
                              <Link
                                href={`/admin/shipping/${encodeURIComponent(zoneIdentifier(zone))}/edit`}
                                className="flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setMenuOpenId(null)}
                              >
                                <Pencil className="h-4 w-4" />
                                {t("editZone")}
                              </Link>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setZoneToDelete(zone);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                {tcom("delete")}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!zoneToDelete}
        onClose={() => setZoneToDelete(null)}
        onConfirm={confirmDeleteZone}
        title={t("deleteTitle")}
        itemName={zoneToDelete?.name}
        isDeleting={!!deletingId}
        cancelButtonLabel={tcom("cancel")}
      />
    </>
  );
}
