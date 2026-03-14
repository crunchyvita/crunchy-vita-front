"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import AdminHeader from "@/components/admin/header";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CreateBlogPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
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
      if (!formData.title?.trim() || !formData.content?.trim()) {
        throw new Error("Title and content are required");
      }

      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("content", formData.content.trim());

      if (imageFile) formDataToSend.append("image", imageFile);

      const response = await fetch(`${backendUrl}/blogs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="w-full px-4 py-6 sm:px-8 lg:px-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/admin/blogs" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-2 transition w-fit">
              <ArrowLeft className="h-4 w-4" /> Back to Blogs
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create Blog Post</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <Link href="/admin/blogs" className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition text-sm font-medium">
                Cancel
             </Link>
             <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2.5 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium shadow-sm"
                style={{backgroundColor: '#556622'}}
             >
                {loading ? "Publishing..." : "Publish Post"}
             </button>
          </div>
        </div>

        {/* Alerts */}
        <div className="mb-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Main Content Column */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Blog Title <span className="text-red-500">*</span></label>
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">Content <span className="text-red-500">*</span></label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Start writing your article..."
                    rows="18"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#556622] focus:border-transparent outline-none transition resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Sidebar Column */}
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
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}

                   
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