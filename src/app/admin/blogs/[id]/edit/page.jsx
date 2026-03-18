"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import AdminHeader from "@/components/admin/header";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params?.id;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    publicationDate: "",
    isPublished: false,
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchBlog();
  }, [blogId]);

  const getExistingImageUrls = (blog) => {
    if (Array.isArray(blog?.imageUrls) && blog.imageUrls.length > 0) {
      return blog.imageUrls.filter(Boolean);
    }

    if (blog?.imageUrl) {
      return [blog.imageUrl];
    }

    return [];
  };

  const fetchBlog = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${backendUrl}/blogs/admin/${blogId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blog");
      }

      const result = await response.json();
      const blog = result.data;

      setFormData({
        title: blog.title,
        content: blog.content,
        publicationDate: blog.publicationDate.slice(0, 16), // Format for datetime-local
        isPublished: blog.isPublished,
      });

      const existingImages = getExistingImageUrls(blog);
      setImages(existingImages.map((url) => ({ url, isNew: false, file: null })));
    } catch (err) {
      setError(err.message || "Failed to fetch blog");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = Math.max(0, 10 - images.length);
    if (remainingSlots === 0) {
      setError("Maximum 10 images allowed");
      e.target.value = "";
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);

    const previewPromises = filesToAdd.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve({
            file,
            url: event.target?.result || null,
          });
          reader.readAsDataURL(file);
        })
    );

    const newImages = (await Promise.all(previewPromises))
      .filter((entry) => entry.url)
      .map((entry) => ({
        url: entry.url,
        file: entry.file,
        isNew: true,
      }));

    setImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const removeImageAtIndex = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (!formData.title || !formData.content || !formData.publicationDate) {
        setError("All fields are required");
        setSubmitting(false);
        return;
      }

      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);
      formDataToSend.append("publicationDate", formData.publicationDate);
      formDataToSend.append("isPublished", formData.isPublished);

      const existingImageUrls = images
        .filter((image) => !image.isNew)
        .map((image) => image.url);
      formDataToSend.append("existingImageUrls", JSON.stringify(existingImageUrls));

      images
        .filter((image) => image.isNew && image.file)
        .forEach((image) => {
          formDataToSend.append("images", image.file);
        });

      const response = await fetch(`${backendUrl}/blogs/${blogId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update blog post");
      }

      setSuccess("Blog post updated successfully!");
      setTimeout(() => {
        router.push("/admin/blogs");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to update blog post");
    } finally {
      setSubmitting(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
        <p className="text-gray-600 mt-2">Update blog post details</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3 mb-6">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8">
        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Blog Title <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter blog title"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* Publication Date */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Publication Date <span className="text-red-600">*</span>
          </label>
          <input
            type="datetime-local"
            name="publicationDate"
            value={formData.publicationDate}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Blog Images
          </label>
          <div className="flex flex-wrap gap-4">
            {images.map((image, index) => (
              <div key={`${image.url}-${index}`} className="relative w-32 h-32 rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImageAtIndex(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}

            <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition bg-gray-50">
              <div className="text-center">
                <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Upload images</p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Blog Content <span className="text-red-600">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Write your blog content here..."
            rows="12"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>

        {/* Published Status */}
        <div className="mb-6 flex items-center gap-3">
          <input
            type="checkbox"
            name="isPublished"
            id="isPublished"
            checked={formData.isPublished}
            onChange={handleInputChange}
            className="w-4 h-4 border border-gray-200 rounded cursor-pointer"
          />
          <label htmlFor="isPublished" className="text-sm text-gray-700 cursor-pointer">
            Publish this blog post
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 text-white rounded-lg transition disabled:opacity-50"
            style={{backgroundColor: '#556622'}}
            onMouseEnter={(e) => !submitting && (e.target.style.backgroundColor = '#3d4617')}
            onMouseLeave={(e) => !submitting && (e.target.style.backgroundColor = '#556622')}
            disabled={submitting}
          >
            {submitting ? "Updating..." : "Update Blog Post"}
          </button>
          <Link href="/admin/blogs">
            <button
              type="button"
              className="px-6 py-2 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
    </>
  );
}