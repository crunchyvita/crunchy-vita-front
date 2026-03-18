"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle2, Image as ImageIcon, X } from "lucide-react";
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
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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
        publicationDate: blog.publicationDate.slice(0, 16), // Format for datetime-local
        isPublished: blog.isPublished,
      });

      const existingImages = getExistingImageUrls(blog);
      setImages(existingImages.map((url) => ({ url, isNew: false, file: null })));
      setFormData({ title: blog.title, content: blog.content });
      if (blog.imageUrl) setImagePreview(blog.imageUrl);
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
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target.result);
      reader.readAsDataURL(file);
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
      if (imageFile) formDataToSend.append("image", imageFile);

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
      
      {/* Full Width Wrapper */}
      <div className="w-full px-4 py-6 sm:px-8 lg:px-12">
        
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/admin/blogs" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-2 transition w-fit">
              <ArrowLeft className="h-4 w-4" /> Back to List
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
             <Link href="/admin/blogs" className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition text-sm font-medium">
                Cancel
             </Link>
             <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2.5 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium shadow-sm"
                style={{backgroundColor: '#556622'}}
             >
                {submitting ? "Saving Changes..." : "Save Post"}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Status Messages */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 sm:p-10">
                
                {/* Responsive Grid for Title and Image */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  
                  {/* Left Column: Title and Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Post Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. 10 Tips for Sustainable Gardening"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#556622] focus:border-transparent outline-none transition text-lg font-medium"
                      />
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
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Content Body
                      </label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Start writing your story..."
                        rows="20"
                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#556622] focus:border-transparent outline-none transition resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Right Column: Sidebar / Image Upload */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-6">
                      <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6">
                        <label className="block text-sm font-bold text-gray-700 mb-4">
                          Featured Image
                        </label>
                        
                        {imagePreview ? (
                          <div className="relative group aspect-video rounded-xl overflow-hidden shadow-md">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => { setImageFile(null); setImagePreview(null); }}
                              className="absolute top-2 right-2 bg-black/50 hover:bg-red-600 text-white p-1.5 rounded-full transition backdrop-blur-sm"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-white hover:border-[#556622] transition-all group">
                            <ImageIcon className="h-10 w-10 text-gray-400 group-hover:text-[#556622] mb-2" />
                            <p className="text-sm font-medium text-gray-600">Click to upload</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          </label>
                        )}
                        <p className="mt-4 text-xs text-gray-500 leading-tight">
                          This image will appear at the top of your blog post and in list views.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}