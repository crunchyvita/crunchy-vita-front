"use client";

import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/header";
import { shippingBoxAPI } from "@/lib/api";
import { useTranslations } from "next-intl";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Eye, Loader2, MoreVertical, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const defaultForm = {
  code: "",
  width: "",
  height: "",
  depth: "",
  emptyWeight: "",
};

const toNumericPayload = (form) => ({
  code: String(form.code || "").trim().toUpperCase(),
  width: Number(form.width),
  height: Number(form.height),
  depth: Number(form.depth),
  emptyWeight: Number(form.emptyWeight),
});

const isDuplicateBoxCodeError = (error) =>
  Number(error?.status) === 409 ||
  /shipping box code already exists/i.test(String(error?.message || ""));

export default function AdminBoxesPage() {
  const t = useTranslations("admin.boxes");
  const tcom = useTranslations("admin.common");

  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);

  const [formMode, setFormMode] = useState("create");
  const [editingId, setEditingId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [boxToDelete, setBoxToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBoxes = async () => {
    setLoading(true);
    try {
      const result = await shippingBoxAPI.list({ page: 1, limit: 100 });
      setBoxes(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      toast.error(error.message || t("loadError"));
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
      setMenuOpenId(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuOpenId]);

  const filteredBoxes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return boxes;
    return boxes.filter((box) =>
      String(box?.code || "").toLowerCase().includes(q)
    );
  }, [boxes, search]);

  const resetFormState = () => {
    setForm(defaultForm);
    setEditingId("");
    setFormError("");
    setSaving(false);
  };

  const openCreate = () => {
    resetFormState();
    setFormMode("create");
    setFormOpen(true);
  };

  const openEdit = (box) => {
    setFormMode("edit");
    setEditingId(box._id);
    setForm({
      code: String(box.code || ""),
      width: String(box.width ?? ""),
      height: String(box.height ?? ""),
      depth: String(box.depth ?? ""),
      emptyWeight: String(box.emptyWeight ?? ""),
    });
    setFormError("");
    setFormOpen(true);
  };

  const openDetails = async (id) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetails(null);
    try {
      const result = await shippingBoxAPI.getById(id);
      setDetails(result?.data || null);
    } catch (error) {
      toast.error(error.message || t("detailsError"));
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = toNumericPayload(form);
      setFormError("");
      if (!payload.code) {
        throw new Error(t("validationCode"));
      }
      const numericFields = ["width", "height", "depth", "emptyWeight"];
      for (const key of numericFields) {
        if (!Number.isFinite(payload[key]) || payload[key] <= 0) {
          throw new Error(t("validationNumeric"));
        }
      }

      if (formMode === "create") {
        await shippingBoxAPI.create(payload);
        toast.success(t("createSuccess"));
      } else {
        await shippingBoxAPI.update(editingId, payload);
        toast.success(t("updateSuccess"));
      }

      setFormOpen(false);
      resetFormState();
      await loadBoxes();
    } catch (error) {
      if (isDuplicateBoxCodeError(error)) {
        setFormError(t("duplicateCodeError"));
        return;
      }
      toast.error(error.message || t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteBox = async () => {
    if (!boxToDelete?._id || deleting) return;
    setDeleting(true);
    try {
      await shippingBoxAPI.remove(boxToDelete._id);
      toast.success(t("deleteSuccess"));
      setBoxToDelete(null);
      await loadBoxes();
    } catch (error) {
      toast.error(error.message || t("deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex items-center justify-between gap-3">
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
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition"
            style={{ backgroundColor: "#556622" }}
          >
            <Plus className="h-4 w-4" />
            {t("add")}
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">{tcom("loading")}</div>
          ) : filteredBoxes.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">{t("empty")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700">
                    <th className="px-4 py-3 font-semibold">{t("colCode")}</th>
                    <th className="px-4 py-3 font-semibold">{t("colWidth")} (cm) </th>
                    <th className="px-4 py-3 font-semibold">{t("colHeight")} (cm)</th>
                    <th className="px-4 py-3 font-semibold">{t("colDepth")} (cm)</th>
                    <th className="px-4 py-3 font-semibold">{t("colWeight")} (kg)</th>
                    <th className="px-4 py-3 text-right font-semibold">{tcom("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBoxes.map((box) => (
                    <tr key={box._id} className="text-slate-700">
                      <td className="px-4 py-3 font-semibold text-slate-900">{box.code}</td>
                      <td className="px-4 py-3">{box.width}</td>
                      <td className="px-4 py-3">{box.height}</td>
                      <td className="px-4 py-3">{box.depth}</td>
                      <td className="px-4 py-3">{box.emptyWeight}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block text-left" data-box-menu-root>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#7f95b2] hover:bg-slate-200"
                            onClick={() => setMenuOpenId((id) => (id === box._id ? null : box._id))}
                            aria-label={tcom("actions")}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {menuOpenId === box._id ? (
                            <div className="absolute right-0 top-10 z-30 min-w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  openDetails(box._id);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="h-4 w-4" />
                                {t("viewDetails")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  openEdit(box);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Pencil className="h-4 w-4" />
                                {t("edit")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setBoxToDelete(box);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
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

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {formMode === "create" ? t("createTitle") : t("editTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("colCode")}
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(event) => {
                    setFormError("");
                    setForm((prev) => ({ ...prev, code: event.target.value }));
                  }}
                  placeholder={t("codePlaceholder")}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#556622] focus:ring-2 focus:ring-[#556622]/20"
                />
                {formError ? <p className="mt-1 text-xs font-medium text-red-600">{formError}</p> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("colWidth")} (cm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.width}
                    onChange={(event) => setForm((prev) => ({ ...prev, width: event.target.value }))}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#556622] focus:ring-2 focus:ring-[#556622]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("colHeight")} (cm)   
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.height}
                    onChange={(event) => setForm((prev) => ({ ...prev, height: event.target.value }))}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#556622] focus:ring-2 focus:ring-[#556622]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("colDepth")} (cm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.depth}
                    onChange={(event) => setForm((prev) => ({ ...prev, depth: event.target.value }))}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#556622] focus:ring-2 focus:ring-[#556622]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("colWeight")} (kg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={form.emptyWeight}
                    onChange={(event) => setForm((prev) => ({ ...prev, emptyWeight: event.target.value }))}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#556622] focus:ring-2 focus:ring-[#556622]/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {tcom("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                  style={{ backgroundColor: "#556622" }}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {formMode === "create" ? t("createAction") : t("updateAction")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{t("detailsTitle")}</h2>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">{tcom("loading")}</div>
            ) : details ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">{t("colCode")}:</span> {details.code}</p>
                <p><span className="font-semibold">{t("colWidth")}:</span> {details.width}</p>
                <p><span className="font-semibold">{t("colHeight")}:</span> {details.height}</p>
                <p><span className="font-semibold">{t("colDepth")}:</span> {details.depth}</p>
                <p><span className="font-semibold">{t("colWeight")}:</span> {details.emptyWeight}</p>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">{t("detailsError")}</div>
            )}
          </div>
        </div>
      ) : null}

      <DeleteConfirmationModal
        isOpen={!!boxToDelete}
        onClose={() => setBoxToDelete(null)}
        onConfirm={confirmDeleteBox}
        title={t("deleteTitle")}
        itemName={boxToDelete?.code}
        isDeleting={deleting}
        cancelButtonLabel={tcom("cancel")}
      />
    </>
  );
}
