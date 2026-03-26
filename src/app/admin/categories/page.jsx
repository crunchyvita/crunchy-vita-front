"use client";

import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/header";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { categoryAPI } from "@/lib/api";
import { FolderTree, Plus, Search, Trash2, Loader2, Pencil, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CategoriesPage() {
  const tx = useTranslations("admin.categories");
  const tcom = useTranslations("admin.common");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await categoryAPI.list();
      const list = Array.isArray(res) ? res : res?.data || [];
      setCategories(list);
    } catch (err) {
      setError(err?.message || tx("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim().toLowerCase();
    return categories.filter((category) =>
      (category.name || "").toLowerCase().includes(q)
    );
  }, [categories, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      await categoryAPI.create({ name: name.trim() });
      setName("");
      await loadCategories();
    } catch (err) {
      setError(err?.message || tx("createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (category) => {
    setCategoryToDelete(category);
    setError("");
  };

  const closeDeleteModal = () => {
    setCategoryToDelete(null);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete || deletingId) return;

    const id = categoryToDelete._id;
    setDeletingId(id);
    setError("");

    try {
      await categoryAPI.remove(id);
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
      closeDeleteModal();
    } catch (err) {
      setError(err?.message || tx("deleteError"));
    } finally {
      setDeletingId("");
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setEditingName(category.name || "");
    setError("");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditingName("");
    setSavingEdit(false);
  };

  const handleSaveEdit = async (id) => {
    if (!id || !editingName.trim() || savingEdit) return;

    setSavingEdit(true);
    setError("");

    try {
      const res = await categoryAPI.update(id, { name: editingName.trim() });
      const updated = res?.data;

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === id
            ? {
                ...cat,
                name: updated?.name || editingName.trim(),
              }
            : cat
        )
      );
      cancelEdit();
    } catch (err) {
      setError(err?.message || tx("updateError"));
      setSavingEdit(false);
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              {tx("title")}
              <span className="rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
                {categories.length}
              </span>
            </div>
            <p className="text-sm text-slate-500">{tx("subtitle")}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tx("newPlaceholder")}
              className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#556622" }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {tx("add")}
            </button>
          </form>

          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={tx("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">{tx("loading")}</div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FolderTree className="mx-auto h-10 w-10" />
              <p className="mt-2 text-sm font-semibold">{tx("empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">{tcom("name")}</th>
                    <th className="px-3 py-2 font-medium">{tx("linkedProducts")}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((category) => (
                    <tr key={category._id} className="text-slate-700">
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {editingId === category._id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full max-w-sm rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500"
                          />
                        ) : (
                          category.name
                        )}
                      </td>
                      <td className="px-3 py-3">{Array.isArray(category.products) ? category.products.length : 0}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {editingId === category._id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(category._id)}
                                disabled={savingEdit || !editingName.trim()}
                                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              >
                                {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                {tcom("save")}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={savingEdit}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                              >
                                <X className="h-3.5 w-3.5" />
                                {tcom("cancel")}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {tx("edit")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openDeleteModal(category)}
                            disabled={deletingId === category._id || (editingId === category._id && savingEdit)}
                            className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            {deletingId === category._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            {tcom("delete")}
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
      </div>

      <DeleteConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={tx("deleteTitle")}
        itemName={categoryToDelete?.name}
        warningMessage={
          categoryToDelete?.products?.length > 0
            ? tx("deleteWarning", { count: categoryToDelete.products.length })
            : null
        }
        isDeleting={!!deletingId}
        cancelButtonLabel={tcom("cancel")}
      />
    </>
  );
}
