"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/header";
import { 
  Plus, 
  Upload, 
  ArrowLeft, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  DollarSign, 
  Package, 
  LayoutGrid,
  Info,
  Type
} from "lucide-react";
import { productAPI, categoryAPI } from "@/lib/api";
import TagInput from "@/components/TagInput";

export default function CreateProductPage() {
  const router = useRouter();

  // States
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Autocomplete state
  const [categoryInput, setCategoryInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    tags: [],
    description: "",
  });

  // Previews logic
  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      return;
    }
    const objectUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(objectUrls);
    return () => objectUrls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  // Category Search
  useEffect(() => {
    const searchCategories = async () => {
      if (!categoryInput.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await categoryAPI.search(categoryInput);
        setSuggestions(res.data || []);
      } catch (err) {
        console.error("Search error:", err);
      }
    };
    const timeoutId = setTimeout(searchCategories, 300);
    return () => clearTimeout(timeoutId);
  }, [categoryInput]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category || categoryInput,
        tags: Array.isArray(form.tags) ? form.tags.join(", ") : form.tags,
        files,
      };
      await productAPI.create(payload);
      router.push("/admin/products");
    } catch (err) {
      setError(err?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="w-full p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <Link href="/admin/products" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Catalog
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create New Product</h1>
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
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-8 py-3 text-sm font-black text-white hover:bg-emerald-800 shadow-xl shadow-emerald-200 transition-all disabled:opacity-50 active:scale-95"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save & Publish
          </button>
        </div>
      </div>

      {/* --- MAIN GRID --- */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT & CENTER: Content (3/4 of screen) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Section: Basic Info */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="p-3 bg-slate-900 text-white rounded-2xl"><Type size={24}/></div>
              <div>
                <h3 className="font-black text-xl text-slate-900">Product Content</h3>
                <p className="text-sm text-slate-500">Define the core information of your item</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Product Title *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Enter product name..."
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-base font-bold text-black placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-0 transition-all outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Full Description</label>
                <textarea
                  rows={8}
                  value={form.description}
                  onChange={handleChange("description")}
                  placeholder="Describe your product features, materials, and benefits..."
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-base font-medium text-black placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Finance & Stock */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl"><DollarSign size={24}/></div>
              <h3 className="font-black text-xl text-slate-900">Inventory & Pricing</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Sale Price </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-black font-black text-lg">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={handleChange("price")}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-12 pr-6 py-4 text-xl font-black text-black focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Initial Stock Quantity</label>
                <div className="relative">
                  <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.stock}
                    onChange={handleChange("stock")}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-14 pr-6 py-4 text-xl font-black text-black focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Media Gallery */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl"><ImageIcon size={24}/></div>
                <h3 className="font-black text-xl text-slate-900">Visual Media</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">{files.length} images uploaded</span>
            </div>

            <div className="space-y-6">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-4 border-dashed border-slate-100 bg-slate-50 px-10 py-16 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
                <div className="h-16 w-16 rounded-2xl bg-white text-emerald-600 flex items-center justify-center mb-4 shadow-md group-hover:rotate-12 transition-transform">
                  <Upload size={28} />
                </div>
                <span className="text-lg font-black text-slate-900">Drag and drop product images</span>
                <span className="text-sm text-slate-500 mt-2 font-medium">PNG, JPG or WebP (Max 10MB per file)</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>

              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {previews.map((url, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                      <img src={url} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-xl scale-50 group-hover:scale-100"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="flex cursor-pointer items-center justify-center aspect-square rounded-3xl border-4 border-dashed border-slate-100 text-slate-300 hover:text-emerald-500 hover:border-emerald-200 transition-all">
                    <Plus size={40} />
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDEBAR (1/4 of screen) --- */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl space-y-10">
            <h3 className="font-black text-white text-xs uppercase tracking-[0.3em] border-b border-white/10 pb-4">Classification</h3>

            {/* Category */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Product Category</label>
              <div className="relative" ref={autocompleteRef}>
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => {
                    setCategoryInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && categoryInput.trim() && suggestions.length === 0) {
                      // Create new category on Enter if no matches
                      setForm(p => ({...p, category: categoryInput}));
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder="Start typing..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-5 py-3.5 text-sm font-bold text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-emerald-500 outline-none transition-all"
                />
                {showSuggestions && categoryInput && suggestions.length > 0 && (
                  <div className="absolute z-50 mt-3 w-full rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
                    <ul className="max-h-60 overflow-auto py-2">
                      {suggestions.map((cat) => (
                        <li
                          key={cat._id}
                          onClick={() => {
                            setCategoryInput(cat.name);
                            setForm(p => ({...p, category: cat._id}));
                            setShowSuggestions(false);
                          }}
                          className="px-5 py-3 text-sm text-slate-900 hover:bg-emerald-50 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
                        >
                          {cat.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Discovery Tags</label>
              <TagInput
                value={form.tags}
                onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
                placeholder="SEO Keywords..."
              />
            </div>
          </div>

         
          {error && (
            <div className="bg-red-600 rounded-3xl p-6 flex gap-4 items-start shadow-lg animate-bounce">
              <X className="h-6 w-6 text-white shrink-0" />
              <p className="text-sm font-black text-white">{error}</p>
            </div>
          )}
        </div>
      </form>
    </div>
    </>
  );
}
