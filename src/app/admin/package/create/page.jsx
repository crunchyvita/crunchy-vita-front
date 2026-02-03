"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import AdminHeader from "@/components/admin/header";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Package, 
  Percent, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Type,
  LayoutGrid,
  Settings,
  Upload,
  X,
  Image as ImageIcon
} from "lucide-react";

export default function CreateEditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const packageId = params?.id;
  const isEditing = !!packageId;
  
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minProducts: 1,
    maxProducts: 5,
    allowMultipleQuantities: false,
    isActive: true,
    discountPercentage: 0
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggleMultipleQuantities = () => {
    setFormData(prev => ({
      ...prev,
      allowMultipleQuantities: !prev.allowMultipleQuantities
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to create a package");
      }

      // Prepare FormData for multipart/form-data submission
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("discountPercentage", formData.discountPercentage);
      formDataToSend.append("maxProducts", formData.maxProducts);
      formDataToSend.append("allowAllProducts", false); // Always false as per requirements
      formDataToSend.append("allowMultipleQuantities", formData.allowMultipleQuantities);
      formDataToSend.append("isActive", formData.isActive);

      // Add image if user selected one
      if (fileInputRef.current?.files?.[0]) {
        formDataToSend.append("image", fileInputRef.current.files[0]);
      }

      const response = await fetch("http://localhost:5000/api/packages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create package");
      }

      const result = await response.json();
      setSuccess("Package created successfully!");
      
      // Redirect after success
      setTimeout(() => {
        router.push("/admin/package");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  // Load package data if editing
  useEffect(() => {
    if (isEditing) {
      const loadPackage = async () => {
        setLoading(true);
        try {
          // Load package data from API
          // const packageData = await fetchPackage(packageId);
          // setFormData(packageData);
        } catch (err) {
          setError("Failed to load package");
        } finally {
          setLoading(false);
        }
      };
      loadPackage();
    }
  }, [isEditing, packageId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <AdminHeader />
      <div className="w-full p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-8">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Packages
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {isEditing ? "Edit Package" : "Create New Package"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="package-form"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-700 px-8 py-3 text-sm font-black text-white hover:bg-emerald-800 shadow-xl shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? "Update Package" : "Save & Publish"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <form id="package-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Package className="h-4 w-4 text-slate-500" />
                  Basic Information
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">
                    Package Name
                  </label>
                  <div className="relative">
                    <Type className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Summer Bundle"
                      className="block w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe the package benefits..."
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Configuration Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Settings className="h-4 w-4 text-slate-500" />
                  Configuration & Rules
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900">
                      Minimum Products
                    </label>
                    <input
                      type="number"
                      name="minProducts"
                      value={formData.minProducts}
                      onChange={handleInputChange}
                      onWheel={(e) => e.currentTarget.blur()}
                      min="1"
                      className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900">
                      Maximum Products
                    </label>
                    <input
                      type="number"
                      name="maxProducts"
                      value={formData.maxProducts}
                      onChange={handleInputChange}
                      onWheel={(e) => e.currentTarget.blur()}
                      min="1"
                      className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowMultipleQuantities}
                      onChange={handleToggleMultipleQuantities}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="block text-sm font-medium text-slate-900">Allow Multiple Quantities</span>
                      <span className="block text-xs text-slate-500 mt-1">
                        If enabled, customers can buy more than 1 of the same item within the package.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Sidebar */}
          <div className="space-y-8">
            {/* Status Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">Status</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Active Status</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input 
                      type="checkbox" 
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="peer sr-only" 
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20"></div>
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {formData.isActive 
                    ? "This package is visible to customers." 
                    : "This package is hidden from the store."}
                </p>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Percent className="h-4 w-4 text-slate-500" />
                  Pricing
                </h2>
              </div>
              <div className="p-6">
                <label className="mb-2 block text-sm font-medium text-slate-900">
                  Discount Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    min="0"
                    max="100"
                    className="block w-full rounded-lg border border-slate-200 py-2.5 pr-8 pl-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-medium">%</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Applied to all products in the bundle.</p>
              </div>
            </div>

            {/* Image Upload Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <ImageIcon className="h-4 w-4 text-slate-500" />
                  Media
                </h2>
              </div>
              <div className="p-6">
                {!imagePreview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-emerald-500 hover:bg-emerald-50/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="mb-2 h-8 w-8 text-slate-400 group-hover:text-emerald-500" />
                      <p className="mb-1 text-sm text-slate-500 font-medium">Click to upload</p>
                      <p className="text-xs text-slate-400">SVG, PNG, JPG</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1.5 text-slate-600 shadow-sm backdrop-blur hover:bg-white hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <img
                      src={imagePreview}
                      alt="Package preview"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Package Template</h3>
                  <p className="mt-1 text-xs text-blue-700 leading-relaxed">
                    You are creating a template. Customers will use this to build their own bundles based on the constraints you define here.
                  </p>
                </div>
              </div>
            </div>
          </div>

         
        </form>
      </div>
    </div>
  );
}