"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/navigation";
import { useParams, useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/header";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { 
  ArrowLeft, Check, Loader2, Pencil, Plus, Search, Trash2, X, 
  Package, Home, Truck, BadgePercent, Globe 
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { normalizeCountryEntry } from "@/lib/shippingZonePricing";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const zoneIdentifier = (zone) => String(zone?._id ?? zone?.id ?? "");

const parseIsoInput = (raw) => {
  const t = String(raw || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(t)) return t;
  return "";
};

const parseCurrencyInput = (raw) => {
  const t = String(raw || "").trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(t)) return t;
  return "";
};

function dedupeCountries(list) {
  const seen = new Set();
  const out = [];
  for (const c of list) {
    const e = normalizeCountryEntry(c);
    if (!e || seen.has(e.iso)) continue;
    seen.add(e.iso);
    out.push(e);
  }
  return out;
}

function countryDisplayLabel(row, displayNames) {
  if (row.label) return row.label;
  return displayNames?.of(row.iso) || row.iso;
}

export default function AdminShippingZoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params?.zoneId ? decodeURIComponent(String(params.zoneId)) : "";
  const t = useTranslations("admin.shippingDetail");
  const tcom = useTranslations("admin.common");
  const locale = useLocale();

  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale === "fr" ? "fr" : "en"], { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zones, setZones] = useState([]);
  const [zone, setZone] = useState(null);

  const [newCountryLabel, setNewCountryLabel] = useState("");
  const [newCountryIso, setNewCountryIso] = useState("");
  const [newCountryCurrency, setNewCountryCurrency] = useState("");
  const [submittingCountry, setSubmittingCountry] = useState(false);
  const [countryFormError, setCountryFormError] = useState("");
  const [search, setSearch] = useState("");

  const [editingIso, setEditingIso] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editIso, setEditIso] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [countryToDelete, setCountryToDelete] = useState(null);
  const [deletingIso, setDeletingIso] = useState("");
  const [editingZoneName, setEditingZoneName] = useState(false);
  const [zoneNameDraft, setZoneNameDraft] = useState("");
  const [promoBadgeZoneId, setPromoBadgeZoneId] = useState(null);
  const inputBaseClass =
    "block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#556822] focus:ring-2 focus:ring-[#556822]/20";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/settings`, { credentials: "include" });
      const data = await res.json();
      const list = data?.data?.shippingSettings?.zones;
      if (!data.success || !Array.isArray(list)) {
        toast.error(t("loadError"));
        return;
      }
      setZones(list);
      setPromoBadgeZoneId(data?.data?.promoBadgeZoneId ?? null);
      const found = list.find((z) => zoneIdentifier(z) === String(zoneId));
      if (found) {
        const countries = dedupeCountries(found.countries || []);
        setZone({ ...JSON.parse(JSON.stringify(found)), countries });
      } else {
        setZone(null);
      }
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [zoneId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const sanitizeZone = (z) => ({
    ...z,
    name: String(z.name || "").trim() || "Zone",
    countries: dedupeCountries(Array.isArray(z.countries) ? z.countries : []),
  });

  const persistZones = async (nextZones, nextPromoBadgeZoneId = promoBadgeZoneId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error(t("unauth"));
      return false;
    }
    const res = await fetch(`${API_URL}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        shippingSettings: { zones: nextZones },
        promoBadgeZoneId: nextPromoBadgeZoneId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      toast.error(data.error || t("saveError"));
      return false;
    }
    const list = data.data?.shippingSettings?.zones;
    if (Array.isArray(list)) {
      setZones(list);
      setPromoBadgeZoneId(data?.data?.promoBadgeZoneId ?? nextPromoBadgeZoneId ?? null);
      const found = list.find((z) => zoneIdentifier(z) === String(zoneId));
      if (found) {
        const countries = dedupeCountries(found.countries || []);
        setZone({ ...JSON.parse(JSON.stringify(found)), countries });
      } else {
        setZone(null);
      }
    }
    return true;
  };

  const persistCurrentZone = async (nextZone) => {
    const sanitized = sanitizeZone(nextZone);
    const nextZones = zones.map((z) => (zoneIdentifier(z) === zoneIdentifier(sanitized) ? sanitized : z));
    return persistZones(nextZones, promoBadgeZoneId);
  };

  const handleSavePricing = async () => {
    if (!zone) return;
    setSaving(true);
    try {
      const ok = await persistCurrentZone(zone);
      if (ok) {
        toast.success(t("saved"));
        router.replace("/admin/shipping");
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredCountries = useMemo(() => {
    const rows = Array.isArray(zone?.countries) ? zone.countries : [];
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const label = countryDisplayLabel(row, displayNames).toLowerCase();
      const iso = String(row.iso || "").toLowerCase();
      return label.includes(q) || iso.includes(q);
    });
  }, [zone?.countries, search, displayNames]);

  const handleAddCountry = async (e) => {
    e.preventDefault();
    const iso = parseIsoInput(newCountryIso);
    if (!iso) {
      setCountryFormError(t("invalidCountry"));
      toast.error(t("invalidCountry"));
      return;
    }
    const label = newCountryLabel.trim();
    if (!zone) return;
    const cur = dedupeCountries(zone.countries || []);
    if (cur.some((c) => c.iso === iso)) {
      setCountryFormError(t("duplicateCountry"));
      toast.error(t("duplicateCountry"));
      return;
    }
    const existsInOtherZone = zones.some((z) => {
      if (zoneIdentifier(z) === zoneIdentifier(zone)) return false;
      const list = dedupeCountries(Array.isArray(z?.countries) ? z.countries : []);
      return list.some((c) => c.iso === iso);
    });
    if (existsInOtherZone) {
      setCountryFormError(t("duplicateCountryGlobal"));
      toast.error(t("duplicateCountryGlobal"));
      return;
    }
    const currencyRaw = parseCurrencyInput(newCountryCurrency);
    if (!currencyRaw) {
      setCountryFormError(t("invalidCurrency"));
      toast.error(t("invalidCurrency"));
      return;
    }
    setCountryFormError("");
    setSubmittingCountry(true);
    try {
      const ok = await persistCurrentZone({
        ...zone,
        countries: [...cur, { iso, label, currency: currencyRaw }],
      });
      if (ok) {
        setNewCountryLabel("");
        setNewCountryIso("");
        setNewCountryCurrency("");
      } else {
        setCountryFormError(t("saveError"));
      }
    } finally {
      setSubmittingCountry(false);
    }
  };

  const startEdit = (row) => {
    setEditingIso(row.iso);
    setEditLabel(row.label || "");
    setEditIso(row.iso);
    setEditCurrency(String(row.currency || "").trim().toUpperCase());
  };

  const cancelEdit = () => {
    setEditingIso("");
    setEditLabel("");
    setEditIso("");
    setEditCurrency("");
    setSavingEdit(false);
  };

  const handleSaveEdit = async () => {
    const iso = parseIsoInput(editIso);
    if (!iso) {
      toast.error(t("invalidCountry"));
      return;
    }
    const label = editLabel.trim();
    if (!zone || !editingIso) return;
    const cur = dedupeCountries(zone.countries || []);
    const others = cur.filter((c) => c.iso !== editingIso);
    if (others.some((c) => c.iso === iso)) {
      toast.error(t("duplicateCountry"));
      return;
    }
    const existsInOtherZone = zones.some((z) => {
      if (zoneIdentifier(z) === zoneIdentifier(zone)) return false;
      const list = dedupeCountries(Array.isArray(z?.countries) ? z.countries : []);
      return list.some((c) => c.iso === iso);
    });
    if (existsInOtherZone) {
      toast.error(t("duplicateCountryGlobal"));
      return;
    }
    const currencyRaw = parseCurrencyInput(editCurrency);
    if (!currencyRaw) {
      toast.error(t("invalidCurrency"));
      return;
    }
    setSavingEdit(true);
    try {
      const ok = await persistCurrentZone({
        ...zone,
        countries: [...others, { iso, label, currency: currencyRaw }],
      });
      if (ok) cancelEdit();
    } finally {
      setSavingEdit(false);
    }
  };

  const openDeleteModal = (row) => {
    setCountryToDelete(row);
  };

  const closeDeleteModal = () => {
    setCountryToDelete(null);
  };

  const confirmDeleteCountry = async () => {
    if (!countryToDelete || !zone || deletingIso) return;
    const iso = countryToDelete.iso;
    setDeletingIso(iso);
    try {
      const cur = dedupeCountries(zone.countries || []);
      const next = cur.filter((c) => c.iso !== iso);
      const ok = await persistCurrentZone({ ...zone, countries: next });
      if (ok) closeDeleteModal();
    } finally {
      setDeletingIso("");
    }
  };

  const startEditZoneName = () => {
    setZoneNameDraft(String(zone?.name || ""));
    setEditingZoneName(true);
  };

  const cancelEditZoneName = () => {
    setEditingZoneName(false);
    setZoneNameDraft("");
  };

  const applyZoneName = () => {
    if (!zone) return;
    const nextName = String(zoneNameDraft || "").trim() || "Zone";
    setZone((prev) => (prev ? { ...prev, name: nextName } : prev));
    setEditingZoneName(false);
    setZoneNameDraft("");
  };

  const updateNested = (section, key, value) => {
    setZone((prev) => {
      if (!prev) return prev;
      const n = value === "" ? "" : Number(value);
      return {
        ...prev,
        [section]: {
          ...(prev[section] || {}),
          [key]: n,
        },
      };
    });
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[#556822]" />
        </div>
      </>
    );
  }

  if (!zone) return null;

  const countryRows = Array.isArray(zone.countries) ? zone.countries : [];

  return (
    <>
      <AdminHeader />
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="w-full p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
        
        {/* Top Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-8">
          <div>
            <Link href="/admin/shipping" className="group mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {t("backToList")}
            </Link>
            <div className="flex items-center gap-3">
              {editingZoneName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={zoneNameDraft}
                    onChange={(e) => setZoneNameDraft(e.target.value)}
                    className="h-11 w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 text-xl font-black text-slate-900 outline-none transition focus:border-[#556822] focus:ring-2 focus:ring-[#556822]/20"
                    autoFocus
                  />
                  <button
                    onClick={applyZoneName}
                    className="rounded-lg bg-[#556622] p-2 text-white transition hover:bg-[#3d4617]"
                  >
                    <Check className="h-5 w-5"/>
                  </button>
                  <button
                    onClick={cancelEditZoneName}
                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
                  >
                    <X className="h-5 w-5"/>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black tracking-tight text-slate-900">{zone.name}</h1>
                  <button
                    onClick={startEditZoneName}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={t("editZone")}
                  >
                    <Pencil className="h-4 w-4"/>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/shipping" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-all">
              {tcom("cancel")}
            </Link>
            <button onClick={handleSavePricing} disabled={saving} className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-black text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: "#556622", boxShadow: "0 10px 15px rgba(85, 102, 34, 0.3)" }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? tcom("loading") : tcom("save")}
            </button>
          </div>
        </div>

        {/* 2-Column Main Content */}
        <div className="grid gap-8 lg:grid-cols-5">
          
          {/* LEFT SIDE:  Pays List */}
          <div className="space-y-6 lg:col-span-3">

            {/* List Pays (top Left) */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Globe className="h-5 w-5 text-[#556822]" />
                  {t("countriesTitle")}
                </h2>
                <span className="rounded-full bg-[#556822]/10 px-2.5 py-0.5 text-xs font-bold text-[#556822]">
                  {countryRows.length}
                </span>
              </div>
              
              <div className="border-b border-slate-200 px-6 py-4">
                <form onSubmit={handleAddCountry} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <input
                    type="text"
                    value={newCountryLabel}
                    onChange={(e) => {
                      setNewCountryLabel(e.target.value);
                      if (countryFormError) setCountryFormError("");
                    }}
                    placeholder={t("countryNamePlaceholder")}
                    className={`lg:col-span-1 ${inputBaseClass}`}
                  />
                  <input
                    type="text"
                    value={newCountryIso}
                    onChange={(e) => {
                      setNewCountryIso(e.target.value);
                      if (countryFormError) setCountryFormError("");
                    }}
                    placeholder={t("isoPlaceholder")}
                    maxLength={2}
                    className={`${inputBaseClass} uppercase`}
                  />
                  <input
                    type="text"
                    value={newCountryCurrency}
                    onChange={(e) => {
                      setNewCountryCurrency(e.target.value.toUpperCase().slice(0, 3));
                      if (countryFormError) setCountryFormError("");
                    }}
                    placeholder={t("currencyPlaceholder")}
                    maxLength={3}
                    className={`${inputBaseClass} font-mono uppercase`}
                    aria-label={t("currencyColumn")}
                    required
                  />
                  <button
                    type="submit"
                    disabled={submittingCountry}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#556822] px-4 text-sm font-semibold text-white transition hover:bg-[#4c611e] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 lg:col-span-1"
                  >
                    {submittingCountry ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {t("addCountry")}
                  </button>
                </form>
                {countryFormError ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{countryFormError}</p>
                ) : null}
              </div>

              <div className="p-6">
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("searchCountriesPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`${inputBaseClass} pl-10`}
                  />
                </div>
                <div className="max-h-125 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">{t("countryNameColumn")}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">{t("isoCodeColumn")}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">{t("currencyColumn")}</th>
                        <th className="px-4 py-3 text-right" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredCountries.map((row) => (
                        <tr key={row.iso} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">
                            {editingIso === row.iso ? (
                              <input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className={inputBaseClass}
                              />
                            ) : countryDisplayLabel(row, displayNames)}
                          </td>
                          <td className="px-4 py-3">
                             {editingIso === row.iso ? (
                              <input
                                value={editIso}
                                onChange={(e) => setEditIso(e.target.value)}
                                className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm uppercase text-slate-800 outline-none focus:border-[#556822] focus:ring-2 focus:ring-[#556822]/20"
                                maxLength={2}
                              />
                            ) : <span className="text-slate-500 font-mono">{row.iso}</span>}
                          </td>
                          <td className="px-4 py-3">
                            {editingIso === row.iso ? (
                              <input
                                value={editCurrency}
                                onChange={(e) => setEditCurrency(e.target.value.toUpperCase().slice(0, 3))}
                                className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-sm uppercase text-slate-800 outline-none focus:border-[#556822] focus:ring-2 focus:ring-[#556822]/20"
                                maxLength={3}
                                aria-label={t("currencyColumn")}
                              />
                            ) : (
                              <span className="font-mono text-slate-600">
                                {String(row.currency || "").toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                             {editingIso === row.iso ? (
                               <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={handleSaveEdit}
                                  className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                                >
                                  <Check className="h-4 w-4"/>
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100"
                                >
                                  <X className="h-4 w-4"/>
                                </button>
                               </div>
                             ) : (
                               <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => startEdit(row)}
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                  <Pencil className="h-4 w-4"/>
                                </button>
                                <button
                                  onClick={() => openDeleteModal(row)}
                                  className="rounded-md p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4"/>
                                </button>
                               </div>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Livraison à domicile + Point Relais */}
          <div className="space-y-6 lg:col-span-2">

            {/* General Settings (Top Right) */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <BadgePercent className="h-5 w-5 text-[#556822]" />
                  {t("generalSettings")}
                </h3>
              </div>
              <div className="p-6">
                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="block font-semibold text-slate-900">{t("promoBadgeZoneLabel")}</span>
                      <span className="text-sm text-slate-500">{t("promoBadgeZoneDesc")}</span>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={String(promoBadgeZoneId || "") === String(zoneIdentifier(zone) || zoneId)}
                        onChange={(e) => setPromoBadgeZoneId(e.target.checked ? String(zoneIdentifier(zone) || zoneId) : null)}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#556822] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#556822]/30"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Livraison à domicile (Top Right) */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Home className="h-5 w-5 text-emerald-500" />
                  {t("homeCard")}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#64748b]">{t("homeReducedThreshold")}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={zone.home?.discountedShipping ?? ""}
                      onChange={(e) => updateNested("home", "discountedShipping", e.target.value)}
                      className={inputBaseClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#64748b]">{t("homeFreeThreshold")}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={zone.home?.freeShipping ?? ""}
                      onChange={(e) => updateNested("home", "freeShipping", e.target.value)}
                      className={inputBaseClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">{t("homeBelowReduced")}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={zone.home?.StandardShippingFee ?? ""}
                    onChange={(e) => updateNested("home", "StandardShippingFee", e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">{t("homeBetween")}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={zone.home?.discountedShippingFee ?? ""}
                    onChange={(e) => updateNested("home", "discountedShippingFee", e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
                <div >
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">{t("expressAddon")}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={zone.home?.express ?? ""}
                      onChange={(e) => updateNested("home", "express", e.target.value)}
                      className={inputBaseClass} 
                    />
                </div>
              </div>
            </div>

            {/* Point Relais (Bottom Right) */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Package className="h-5 w-5 text-blue-500" />
                  {t("relayCard")}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">{t("relayFreeThreshold")}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={zone.relay?.freeShipping ?? ""}
                    onChange={(e) => updateNested("relay", "freeShipping", e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">{t("relayBelowPrice")}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={zone.relay?.StandarShippingFee ?? ""}
                    onChange={(e) => updateNested("relay", "StandarShippingFee", e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!countryToDelete}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCountry}
        title={t("deleteCountryTitle")}
        itemName={countryToDelete ? `${countryDisplayLabel(countryToDelete, displayNames)} (${countryToDelete.iso})` : undefined}
        isDeleting={!!deletingIso}
        cancelButtonLabel={tcom("cancel")}
      />
    </>
  );
}