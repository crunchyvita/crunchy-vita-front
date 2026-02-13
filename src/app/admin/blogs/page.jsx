"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/header";
import { Trash2, Edit, Plus, AlertCircle } from "lucide-react";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BlogsPage() {
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
        throw new Error("Failed to fetch blogs");
      }

      const result = await response.json();
      setBlogs(result.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch blogs");
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
        throw new Error("Failed to delete blog");
      }

      setBlogs(blogs.filter((blog) => blog._id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || "Failed to delete blog");
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
          <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-gray-600 mt-2">Manage your blog posts</p>
        </div>
        <Link href="/admin/blogs/create">
          <button className="text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
            style={{backgroundColor: '#556622'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#3d4617'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#556622'}>
            <Plus className="h-4 w-4" />
            Create Blog Post
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
            <p className="text-gray-600 mb-4">No blog posts yet</p>
            <Link href="/admin/blogs/create">
              <button className="text-white px-4 py-2 rounded-lg transition"
                style={{backgroundColor: '#556622'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#3d4617'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#556622'}>
                Create your first blog post
              </button>
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Author</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Publication Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{blog.title}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {blog.authorId?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(blog.publicationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        blog.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {blog.isPublished ? "Published" : "Draft"}
                    </span>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-xl bg-white p-6 shadow-2xl max-w-md mx-4 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Delete Blog Post?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete this blog post? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 shadow-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
