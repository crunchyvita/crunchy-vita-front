"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { Link } from "@/navigation";
import AdminHeader from "@/components/admin/header";
import { useTranslations } from "next-intl";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CreateBlogPage() {
  const t = useTranslations("admin.blogsForm");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const topic = searchParams.get("topic");

    if (topic === "lyophilisation") {
      setFormData((prev) => ({
        ...prev,
        title: prev.title || "La lyophilisation",
      }));
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = Math.max(0, 10 - imageFiles.length);
    if (remainingSlots === 0) {
      setError(t("maxImages"));
      e.target.value = "";
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);

    setImageFiles((prev) => [...prev, ...filesToAdd]);

    const previewPromises = filesToAdd.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result || null);
          reader.readAsDataURL(file);
        })
    );

    const previews = (await Promise.all(previewPromises)).filter(Boolean);
    setImagePreviews((prev) => [...prev, ...previews]);

    e.target.value = "";
  };

  const removeImageAtIndex = (indexToRemove) => {
    setImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!formData.title?.trim() || !formData.content?.trim()) {
        throw new Error(t("titleContentRequired"));
      }

      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("content", formData.content.trim());

      // ✅ optional EN fields
      if (formData.title_en?.trim()) formDataToSend.append("title_en", formData.title_en.trim());
      if (formData.content_en?.trim()) formDataToSend.append("content_en", formData.content_en.trim());

      imageFiles.forEach((file) => {
        formDataToSend.append("images", file);
      });

      const response = await fetch(`${backendUrl}/blogs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create blog post");
      }

      setSuccess(t("createSuccess"));
      setTimeout(() => router.push("/admin/blogs"), 1200);
    } catch (err) {
      setError(err?.message || t("createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="w-full px-4 py-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/admin/blogs" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-2 transition w-fit">
              <ArrowLeft className="h-4 w-4" />
              {t("backToBlogs")}
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t("createTitle")}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/blogs" className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition text-sm font-medium">
              {t("cancel")}
            </Link>
            <button
              type="submit"
              form="create-blog-form"
              disabled={loading}
              className="px-5 py-2.5 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium shadow-sm"
              style={{ backgroundColor: "#556622" }}
            >
              {loading ? t("publishing") : t("publishPost")}
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
          id="create-blog-form"
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t("postTitle")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder={t("placeholderTitle")}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#556622] focus:border-transparent outline-none transition text-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t("contentBody")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder={t("placeholderContent")}
                    rows={18}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#556622] focus:border-transparent outline-none transition resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                  <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6">
                    <label className="block text-sm font-bold text-gray-700 mb-4">
                      {t("featuredImage")}
                    </label>

                    {imagePreviews[0] ? (
                      <div className="relative group aspect-video rounded-xl overflow-hidden shadow-md">
                        <img src={imagePreviews[0]} alt={t("featuredAlt")} className="w-full h-full object-cover" />
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
                        <p className="text-sm font-medium text-gray-600">{t("clickUpload")}</p>
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
                      {t("imageHint")}
                    </p>

                    {imagePreviews.length > 1 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {imagePreviews.slice(1).map((preview, index) => (
                          <div key={`${preview}-${index + 1}`} className="relative w-full aspect-square rounded-md overflow-hidden">
                            <img src={preview} alt={`Preview ${index + 2}`} className="w-full h-full object-cover" />
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

                    {imagePreviews[0] && (
                      <label className="mt-4 inline-flex items-center justify-center w-full px-3 py-2 text-xs border border-gray-300 rounded-lg cursor-pointer hover:bg-white transition">
                        {t("addMoreImages")}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
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