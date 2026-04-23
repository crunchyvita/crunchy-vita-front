"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, Loader2, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/header";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { shippingBoxAPI } from "@/lib/api";

const EMPTY_FORM = {
  code: "",
  label: "",
  internalWidth: "",
  internalHeight: "",
  internalDepth: "",
  emptyWeight: "",
};

const toDisplayNumber = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(2);
};

function ShippingBoxFormModal({
  open,
  mode,
  form,
  onChange,
  onClose,
  onSubmit,
  saving,
  t,
}) {
  if (!open) return null;

  const title = mode === "create" ? t("createTitle") : t("editTitle");

  const numericFields = [
    { key: "internalWidth", label: t("fields.internalWidth") },
    { key: "internalHeight", label: t("fields.internalHeight") },
    { key: "internalDepth", label: t("fields.internalDepth") },
    { key: "emptyWeight", label: t("fields.emptyWeight") },
  ];

  const withUnit = (fieldKey, label) => {
    if (fieldKey === "emptyWeight") return `${label} (kg)`;
    return `${label} (cm)`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{t("formHint")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t("cancel")}
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("fields.code")}
              </label>
              <input
                required
                maxLength={20}
                value={form.code}
                onChange={(event) => onChange("code", event.target.value.toUpperCase())}
                placeholder="S"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#556622] focus:ring-2 focus:ring-[#556622]/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("fields.label")}
              </label>
              <input
                required
                maxLength={120}
                value={form.label}
                onChange={(event) => onChange("label", event.target.value)}
                placeholder={t("labelPlaceholder")}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#556622] focus:ring-2 focus:ring-[#556622]/20"
              />
            </div>
            {numericFields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {withUnit(field.key, field.label)}
                </label>
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={form[field.key]}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#556622] focus:ring-2 focus:ring-[#556622]/20"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "#556622" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "create" ? t("create") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BoxDetailModal({ open, box, onClose, t }) {
  if (!open || !box) return null;

  const rows = [
    [t("fields.code"), box.code],
    [t("fields.label"), box.label],
    [t("fields.internalWidth"), toDisplayNumber(box.internalWidth)],
    [t("fields.internalHeight"), toDisplayNumber(box.internalHeight)],
    [t("fields.internalDepth"), toDisplayNumber(box.internalDepth)],
    [t("fields.emptyWeight"), toDisplayNumber(box.emptyWeight)],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{t("detailsTitle")}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t("close")}
          </button>
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td className="w-1/2 bg-slate-50 px-4 py-2 font-medium text-slate-700">{label}</td>
                  <td className="px-4 py-2 text-slate-900">{value || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminBoxesPage() {
  const t = useTranslations("admin.shippingBoxes");
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState("");

  const [formMode, setFormMode] = useState("create");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);

  const [detailBox, setDetailBox] = useState(null);
  const [deleteBox, setDeleteBox] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBoxes = async () => {
    setLoading(true);
    try {
      const response = await shippingBoxAPI.list();
      setBoxes(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      toast.error(error?.message || t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoxes();
  }, []);

  useEffect(() => {
    if (!menuOpenId) return undefined;
    const onPointerDown = (event) => {
      const root = event.target?.closest?.("[data-box-menu-root]");
      if (root) return;
      setMenuOpenId("");
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuOpenId]);

  const filteredBoxes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return boxes
      .filter((box) => {
        if (!q) return true;
        return (
          String(box.code || "").toLowerCase().includes(q) ||
          String(box.label || "").toLowerCase().includes(q)
        );
      });
  }, [boxes, search]);

  const resetFormState = () => {
    setForm(EMPTY_FORM);
    setEditingId("");
    setFormMode("create");
    setSaving(false);
  };

  const openCreate = () => {
    resetFormState();
    setFormOpen(true);
  };

  const openEdit = (box) => {
    setFormMode("edit");
    setEditingId(box._id);
    setForm({
      code: box.code || "",
      label: box.label || "",
      internalWidth: String(box.internalWidth ?? ""),
      internalHeight: String(box.internalHeight ?? ""),
      internalDepth: String(box.internalDepth ?? ""),
      emptyWeight: String(box.emptyWeight ?? ""),
    });
    setFormOpen(true);
  };

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = () => ({
    code: String(form.code || "").trim().toUpperCase(),
    label: String(form.label || "").trim(),
    internalWidth: Number(form.internalWidth),
    internalHeight: Number(form.internalHeight),
    internalDepth: Number(form.internalDepth),
    emptyWeight: Number(form.emptyWeight),
  });

  const submitForm = async () => {
    const payload = buildPayload();
    if (!payload.code || !payload.label) {
      toast.error(t("validation.required"));
      return;
    }

    if (
      !Number.isFinite(payload.internalWidth) ||
      !Number.isFinite(payload.internalHeight) ||
      !Number.isFinite(payload.internalDepth) ||
      !Number.isFinite(payload.emptyWeight)
    ) {
      toast.error(t("validation.invalidNumeric"));
      return;
    }

    setSaving(true);
    try {
      if (formMode === "create") {
        const response = await shippingBoxAPI.create(payload);
        setBoxes((prev) => [response.data, ...prev]);
        toast.success(t("createSuccess"));
      } else {
        const response = await shippingBoxAPI.update(editingId, payload);
        setBoxes((prev) => prev.map((item) => (item._id === editingId ? response.data : item)));
        toast.success(t("updateSuccess"));
      }
      setFormOpen(false);
      resetFormState();
    } catch (error) {
      toast.error(error?.message || t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmHardDelete = async () => {
    if (!deleteBox?._id) return;
    setDeleting(true);
    try {
      await shippingBoxAPI.remove(deleteBox._id);
      setBoxes((prev) => prev.filter((item) => item._id !== deleteBox._id));
      setDeleteBox(null);
      toast.success(t("deleteSuccess"));
    } catch (error) {
      toast.error(error?.message || t("deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              {t("title")}
              <span className="rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
                {t("countBadge", { count: boxes.length })}
              </span>
            </div>
            <p className="text-sm text-slate-500">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "#556622" }}
          >
            <Plus className="h-4 w-4" />
            {t("create")}
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full max-w-lg items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">{t("loading")}</div>
          ) : filteredBoxes.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">{t("empty")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                    <th className="px-3 py-2 font-medium">{t("fields.code")}</th>
                    <th className="px-3 py-2 font-medium">{t("fields.label")}</th>
                    <th className="px-3 py-2 font-medium">{t("fields.internalWidth")}</th>
                    <th className="px-3 py-2 font-medium">{t("fields.internalHeight")}</th>
                    <th className="px-3 py-2 font-medium">{t("fields.internalDepth")}</th>
                    <th className="px-3 py-2 font-medium">{t("fields.emptyWeight")}</th>
                    <th className="w-12 px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBoxes.map((box) => (
                    <tr key={box._id} className="text-slate-700 hover:bg-slate-50">
                      <td className="px-3 py-3 font-semibold text-slate-900">{box.code}</td>
                      <td className="px-3 py-3">{box.label}</td>
                      <td className="px-3 py-3">{toDisplayNumber(box.internalWidth)}</td>
                      <td className="px-3 py-3">{toDisplayNumber(box.internalHeight)}</td>
                      <td className="px-3 py-3">{toDisplayNumber(box.internalDepth)}</td>
                      <td className="px-3 py-3">{toDisplayNumber(box.emptyWeight)}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="relative inline-block text-left" data-box-menu-root>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#7f95b2] hover:bg-slate-200"
                            onClick={() => setMenuOpenId((prev) => (prev === box._id ? "" : box._id))}
                            aria-expanded={menuOpenId === box._id}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {menuOpenId === box._id ? (
                            <div className="absolute right-0 top-10 z-30 min-w-48 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                  setMenuOpenId("");
                                  setDetailBox(box);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                {t("viewDetails")}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                  setMenuOpenId("");
                                  openEdit(box);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                {t("edit")}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setMenuOpenId("");
                                  setDeleteBox(box);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("deletePermanently")}
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

      <ShippingBoxFormModal
        open={formOpen}
        mode={formMode}
        form={form}
        onChange={handleFormChange}
        onClose={() => {
          setFormOpen(false);
          resetFormState();
        }}
        onSubmit={submitForm}
        saving={saving}
        t={t}
      />

      <BoxDetailModal
        open={!!detailBox}
        box={detailBox}
        onClose={() => setDetailBox(null)}
        t={t}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteBox}
        onClose={() => setDeleteBox(null)}
        onConfirm={confirmHardDelete}
        title={t("deleteTitle")}
        itemName={deleteBox?.label || deleteBox?.code}
        warningMessage={t("deleteWarning")}
        isDeleting={deleting}
        confirmButtonLabel={t("deletePermanently")}
        confirmLoadingLabel={t("deleting")}
        cancelButtonLabel={t("cancel")}
      />
    </>
  );
}
