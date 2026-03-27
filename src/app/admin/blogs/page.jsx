"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/navigation";
import AdminHeader from "@/components/admin/header";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Trash2, Edit, Plus, AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BlogsPage() {
  const tb = useTranslations("admin.blogs");
  const tcom = useTranslations("admin.common");
  const locale = useLocale();
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${backendUrl}/blogs/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(tb("fetchError"));
      }

      const result = await response.json();
      setBlogs(result.data || []);
    } catch (err) {
      setError(err.message || tb("fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${backendUrl}/blogs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(tb("deleteError"));
      }

      setBlogs(blogs.filter((blog) => blog._id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || tb("deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
    <AdminHeader />
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tb("title")}</h1>
          <p className="text-gray-600 mt-2">{tb("subtitle")}</p>
        </div>
        <Link href="/admin/blogs/create">
          <button className="text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
            style={{backgroundColor: '#556622'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#3d4617'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#556622'}>
            <Plus className="h-4 w-4" />
            {tb("create")}
          </button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{tb("empty")}</p>
            <Link href="/admin/blogs/create">
              <button className="text-white px-4 py-2 rounded-lg transition"
                style={{backgroundColor: '#556622'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#3d4617'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#556622'}>
                {tb("emptyCta")}
              </button>
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{tb("titleCol")}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{tb("authorCol")}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{tb("createdCol")}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{tb("actionsCol")}</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{blog.title}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {blog.authorId?.name || tcom("unknown")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(blog.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <Link href={`/admin/blogs/${blog._id}/edit`}>
                      <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                        <Edit className="h-4 w-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(blog._id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        title={tb("deleteTitle")}
        itemName={blogs.find(b => b._id === deleteConfirm)?.title}
        isDeleting={deleting}
        cancelButtonLabel={tcom("cancel")}
      />
    </div>
    </>
  );
}
