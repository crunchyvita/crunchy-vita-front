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
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (blogId) fetchBlog();
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch blog");
      const result = await response.json();
      const blog = result.data;

      setFormData({
        title: blog.title,
        content: blog.content,
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      if (!formData.title || !formData.content) throw new Error("All fields are required");
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);

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
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("Failed to update blog post");
      setSuccess("Blog post updated successfully!");
      setTimeout(() => router.push("/admin/blogs"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#556622]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="w-full px-4 py-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/admin/blogs" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-2 transition w-fit">
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Blog Post</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/blogs" className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition text-sm font-medium">
              Cancel
            </Link>
            <button
              type="submit"
              form="edit-blog-form"
              disabled={submitting}
              className="px-5 py-2.5 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium shadow-sm"
              style={{ backgroundColor: "#556622" }}
            >
              {submitting ? "Saving..." : "Save Post"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3 mb-6">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form
          id="edit-blog-form"
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Post Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter post title"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#556622] focus:border-transparent outline-none transition text-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Content Body <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Start writing your article..."
                    rows={18}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#556622] focus:border-transparent outline-none transition resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                  <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6">
                    <label className="block text-sm font-bold text-gray-700 mb-4">
                      Featured Image
                    </label>

                    {images[0]?.url ? (
                      <div className="relative group aspect-video rounded-xl overflow-hidden shadow-md">
                        <img src={images[0].url} alt="Featured preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImageAtIndex(0)}
                          className="absolute top-2 right-2 bg-black/50 hover:bg-red-600 text-white px-2 py-1 rounded-full text-xs transition"
                        >
                          x
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-white hover:border-[#556622] transition-all group">
                        <ImageIcon className="h-10 w-10 text-gray-400 group-hover:text-[#556622] mb-2" />
                        <p className="text-sm font-medium text-gray-600">Click to upload</p>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}

                    <p className="mt-4 text-xs text-gray-500 leading-tight">
                      This image will appear at the top of your blog post and in list views.
                    </p>

                    {images.length > 1 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {images.slice(1).map((image, index) => (
                          <div key={`${image.url}-${index + 1}`} className="relative w-full aspect-square rounded-md overflow-hidden">
                            <img src={image.url} alt={`Preview ${index + 2}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImageAtIndex(index + 1)}
                              className="absolute top-1 right-1 bg-black/50 hover:bg-red-600 text-white w-5 h-5 rounded-full text-xs"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="mt-4 inline-flex items-center justify-center w-full px-3 py-2 text-xs border border-gray-300 rounded-lg cursor-pointer hover:bg-white transition">
                      Add more images
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
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}