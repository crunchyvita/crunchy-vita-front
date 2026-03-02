"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import AdminHeader from "@/components/admin/header";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CreateBlogPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    title_en: "",
    content_en: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // ✅ required FR fields
      if (!formData.title?.trim() || !formData.content?.trim()) {
        setError("Title and content are required");
        return;
      }

      const token = localStorage.getItem("token");

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("content", formData.content.trim());

      // ✅ optional EN fields
      if (formData.title_en?.trim()) formDataToSend.append("title_en", formData.title_en.trim());
      if (formData.content_en?.trim()) formDataToSend.append("content_en", formData.content_en.trim());

      if (imageFile) formDataToSend.append("image", imageFile);

      const response = await fetch(`${backendUrl}/blogs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create blog post");
      }

      setSuccess("Blog post created successfully!");
      setTimeout(() => router.push("/admin/blogs"), 1200);
    } catch (err) {
      setError(err?.message || "Failed to create blog post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminHeader />

      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        {/* Back Button */}
        <Link href="/admin/blogs">
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition">
            <ArrowLeft className="h-4 w-4" />
            Back to Blogs
          </button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Blog Post</h1>
          <p className="text-gray-600 mt-2">Add a new blog post</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3 mb-6">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-8"
        >
          {/* Title FR */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Blog Title (FR) <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter blog title (French)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

       

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Blog Image
            </label>

            <div className="flex gap-4">
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition bg-gray-50">
                  <div className="text-center">
                    <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Upload image</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-2">Image specifications:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Recommended: 1200×600</li>
                  <li>• Format: JPG, PNG</li>
                  <li>• Max size: 5MB</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Content FR */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Blog Content (FR) <span className="text-red-600">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Write your blog content here (French)..."
              rows={10}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 text-white rounded-lg transition disabled:opacity-50"
            style={{backgroundColor: '#556622'}}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#3d4617')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#556622')}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Blog Post"}
          </button>

          <Link href="/admin/blogs">
            <button
              type="button"
              disabled={loading}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              Back to Blogs
            </button>
          </Link>
        </div>
        </form>
      </div>
    </>
  );
}
