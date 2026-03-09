"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/header";
import { productAPI, stockAPI, categoryAPI } from "@/lib/api";
import { getTranslatedProduct } from "@/lib/productTranslations";
import { 
  ArrowLeft, 
  Upload, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Type, 
  DollarSign, 
  ImageIcon, 
  Loader2,
  Save
} from "lucide-react";
import TagInput from "@/components/TagInput";

export default function EditProductPage() {
  const { id: productId } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newFiles, setNewFiles] = useState([]); 
  const [removedMediaUrls, setRemovedMediaUrls] = useState([]); 
  const objectUrlsRef = useRef([]);
  
  // Category autocomplete state
  const [categoryInput, setCategoryInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const autocompleteRef = useRef(null); 

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    width: "",
    height: "",
    depth: "",
    weight: "",
    tags: [],
    description: "",
    alertThreshold: 10,
    status: "ACTIVE",
    showInShop: true,
    categories: [],
  });

  const addCategorySelection = (categoryItem) => {
    if (!categoryItem?.name) return;

    const normalizedId = String(categoryItem.id || categoryItem.name).trim();
    const normalizedName = categoryItem.name.trim();
    if (!normalizedId || !normalizedName) return;

    setSelectedCategories((prev) => {
      const alreadyExists = prev.some(
        (item) =>
          String(item.id).toLowerCase() === normalizedId.toLowerCase() ||
          item.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (alreadyExists) return prev;
      return [...prev, { id: normalizedId, name: normalizedName }];
    });
  };

  const removeCategorySelection = (categoryId) => {
    setSelectedCategories((prev) => prev.filter((item) => String(item.id) !== String(categoryId)));
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getById(productId);
      const data = res.data || res;
      setProduct(data);
      
      const normalizedCategoryItems =
        Array.isArray(data.categoryIds) && data.categoryIds.length > 0
          ? data.categoryIds
              .map((cat) => {
                if (!cat) return null;
                if (typeof cat === 'object') {
                  const id = cat._id ? String(cat._id) : (cat.name ? String(cat.name) : '');
                  const name = cat.name ? String(cat.name) : '';
                  if (!id || !name) return null;
                  return { id, name };
                }

                const value = String(cat).trim();
                if (!value) return null;
                return { id: value, name: value };
              })
              .filter(Boolean)
          : (() => {
              const legacyCategoryId = typeof data.categoryId === 'object' && data.categoryId?._id
                ? String(data.categoryId._id)
                : (data.categoryId ? String(data.categoryId) : '');

              const legacyCategoryName = typeof data.categoryId === 'object' && data.categoryId?.name
                ? String(data.categoryId.name)
                : (data.category?.name ? String(data.category.name) : legacyCategoryId);

              if (!legacyCategoryId && !legacyCategoryName) return [];
              return [{ id: legacyCategoryId || legacyCategoryName, name: legacyCategoryName || legacyCategoryId }];
            })();
      
      setFormData({
        name: data.name || "",
        price: data.pricingHistory?.length > 0 
          ? data.pricingHistory[data.pricingHistory.length - 1].price 
          : "",
        tags: Array.isArray(data.tag) ? data.tag : (data.tag ? [data.tag] : []),
        description: data.description || "",
        width: data.width || "",
        height: data.height || "",
        depth: data.depth || "",
        weight: data.weight || "",
        alertThreshold: data.stock?.alertThreshold || 10,
        status: data.status || "ACTIVE",
        showInShop: data.showInShop !== false,
        categories: normalizedCategoryItems.map((item) => item.id),
      });
      setSelectedCategories(normalizedCategoryItems);
    } catch (err) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId]);

  // Category Search with debounce
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => url && URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saving) {
          handleSubmit(e);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saving, formData, newFiles, removedMediaUrls]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeMediaUrl = (originalUrl) => {
    if (!removedMediaUrls.includes(originalUrl)) {
      setRemovedMediaUrls((prev) => [...prev, originalUrl]);
    }
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => {
      const fileToRemove = prev[index];
      if (fileToRemove?.objectURL) {
        URL.revokeObjectURL(fileToRemove.objectURL);
        objectUrlsRef.current = objectUrlsRef.current.filter(url => url !== fileToRemove.objectURL);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Quick validation
    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError("Valid price is required");
      return;
    }

    // Immediate UI feedback
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("newPrice", formData.price);
      formDataObj.append("description", formData.description || "");
      formDataObj.append("width", formData.width || "");
      formDataObj.append("height", formData.height || "");
      formDataObj.append("depth", formData.depth || "");
      formDataObj.append("weight", formData.weight || "");
      formDataObj.append("status", formData.status);
      formDataObj.append("showInShop", String(formData.showInShop));
      
      formDataObj.append("categoryIds", JSON.stringify(selectedCategories.map((item) => item.id)));
      
      const tagsArray = Array.isArray(formData.tags) 
        ? formData.tags.filter(t => t && t.trim())
        : formData.tags.split(",").map(t => t.trim()).filter(t => t);
      
      if (tagsArray.length > 0) formDataObj.append("tags", tagsArray.join(","));
      if (removedMediaUrls.length > 0) formDataObj.append("removedMedia", JSON.stringify(removedMediaUrls));
      newFiles.forEach((file) => formDataObj.append("images", file));

      await productAPI.update(productId, formDataObj);
      
      const currentAlertThreshold = product?.stock?.alertThreshold || 10;
      if (Number(formData.alertThreshold) !== currentAlertThreshold) {
        await stockAPI.update(productId, { alertThreshold: Number(formData.alertThreshold) });
      }

      // Immediate redirect with success feedback
      router.push(`/admin/products/${productId}?updated=true`);
    } catch (err) {
      setError(err.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const displayMedia = [
    ...(product?.media || [])
      .map((item) => {
        const url = typeof item === 'string' ? item : (item.url || item);
        // Cloudinary returns full URLs - use them directly
        return { url: url, isNew: false, originalUrl: url };
      })
      .filter(item => !removedMediaUrls.includes(item.originalUrl)),
    ...newFiles.map((file, index) => {
      if (!file.objectURL) {
        file.objectURL = URL.createObjectURL(file);
        objectUrlsRef.current.push(file.objectURL);
      }
      return { url: file.objectURL, isNew: true, fileIndex: index };
    })
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Loading product data...</p>
    </div>
  );

  return (
    <>
      <AdminHeader />
      <div className="w-full p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <Link href={`/admin/products/${productId}`} className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Details
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Edit <span className="text-green-800">{getTranslatedProduct(product, "fr").name}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-all">
            Discard
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-black text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{backgroundColor: '#556622', boxShadow: '0 10px 15px rgba(85, 102, 34, 0.3)'}}
            onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#3d4617', e.target.style.boxShadow = '0 15px 25px rgba(85, 102, 34, 0.4)')}
            onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#556622', e.target.style.boxShadow = '0 10px 15px rgba(85, 102, 34, 0.3)')}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Update Product
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-500 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <CheckCircle2 size={20} />
          <span className="font-black text-sm uppercase">{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* General Information */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="p-3 bg-slate-900 text-white rounded-2xl"><Type size={24}/></div>
              <h3 className="font-black text-xl text-slate-900">General Information</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-base font-bold text-black focus:border-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Description</label>
                <textarea
                  name="description"
                  rows={8}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-base font-medium text-black focus:border-blue-500 focus:bg-white outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Alert */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
               <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl"><DollarSign size={20}/></div>
                  <h3 className="font-black text-lg text-slate-900">Pricing</h3>
               </div>
               <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-black font-black text-lg">$</span>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-12 pr-6 py-4 text-2xl font-black text-black focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
               </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
               <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl"><ShieldCheck size={20}/></div>
                  <h3 className="font-black text-lg text-slate-900">Stock Alert</h3>
               </div>
              <input
                  type="number"
                  name="alertThreshold"
                  value={formData.alertThreshold}
                  onChange={handleInputChange}
                onWheel={(e) => e.currentTarget.blur()}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-2xl font-black text-black focus:border-amber-500 focus:bg-white outline-none transition-all"
                />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-slate-100 text-slate-700 rounded-xl"><AlertTriangle size={20}/></div>
              <h3 className="font-black text-lg text-slate-900">Dimensions & Weight</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Width(cm)</label>
                <input
                  type="number"
                  name="width"
                  min="0"
                  step="0.01"
                  value={formData.width}
                  onChange={handleInputChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-base font-bold text-black focus:border-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Height(cm)</label>
                <input
                  type="number"
                  name="height"
                  min="0"
                  step="0.01"
                  value={formData.height}
                  onChange={handleInputChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-base font-bold text-black focus:border-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Depth(cm)</label>
                <input
                  type="number"
                  name="depth"
                  min="0"
                  step="0.01"
                  value={formData.depth}
                  onChange={handleInputChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-base font-bold text-black focus:border-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Weight(kg)</label>
                <input
                  type="number"
                  name="weight"
                  min="0"
                  step="0.01"
                  value={formData.weight}
                  onChange={handleInputChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-base font-bold text-black focus:border-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Media Gallery */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl"><ImageIcon size={24}/></div>
                <h3 className="font-black text-xl text-slate-900">Media Gallery</h3>
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{displayMedia.length} Photos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              <label className="flex cursor-pointer flex-col items-center justify-center aspect-square rounded-3xl border-4 border-dashed border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                <Upload className="text-slate-300 group-hover:text-emerald-500 transition-all" size={32} />
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleMediaChange} />
              </label>

              {displayMedia.map((item, idx) => (
                <div key={idx} className="group relative aspect-square rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-slate-100">
                  <img src={item.url} alt="Product" className="h-full w-full object-cover" />
                  {item.isNew && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-[8px] font-black text-white rounded-md uppercase">New</div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => item.isNew ? removeNewFile(item.fileIndex) : removeMediaUrl(item.originalUrl)}
                      className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-xl"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR AREA */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl space-y-10">
            <h3 className="font-black text-white text-xs uppercase tracking-[0.3em] border-b border-white/10 pb-4">Settings</h3>

            {/* Status */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Product Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-5 py-3.5 text-sm font-bold text-white focus:bg-white/10 focus:border-blue-500 outline-none transition-all"
              >
                <option value="ACTIVE" className="text-slate-900">Active</option>
                <option value="INACTIVE" className="text-slate-900">Inactive</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Shop Visibility</label>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.showInShop)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      showInShop: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-emerald-500"
                />
                <span className="text-sm font-bold text-white">Show this product in Shop</span>
              </label>
            </div>

            {/* Category Search */}
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
                    if (e.key === 'Enter' && categoryInput.trim() && suggestions.length === 0) {
                      e.preventDefault();
                      addCategorySelection({ id: categoryInput.trim(), name: categoryInput.trim() });
                      setFormData((prev) => ({
                        ...prev,
                        categories: [...new Set([...prev.categories, categoryInput.trim()])],
                      }));
                      setCategoryInput('');
                      setSuggestions([]);
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
                            addCategorySelection({ id: cat._id, name: cat.name });
                            setFormData((prev) => ({
                              ...prev,
                              categories: [...new Set([...prev.categories, String(cat._id)])],
                            }));
                            setCategoryInput('');
                            setSuggestions([]);
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

              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedCategories.map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-3 py-1 text-xs font-black text-white"
                    >
                      {cat.name}
                      <button
                        type="button"
                        onClick={() => {
                          removeCategorySelection(cat.id);
                          setFormData((prev) => ({
                            ...prev,
                            categories: prev.categories.filter((id) => String(id) !== String(cat.id)),
                          }));
                        }}
                        className="rounded-full bg-white/20 p-0.5 hover:bg-white/30"
                        aria-label={`Remove ${cat.name}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">SEO Tags</label>
              <TagInput
                value={formData.tags}
                onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
                placeholder="Add tags..."
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-600 rounded-3xl p-6 flex gap-4 items-start shadow-lg">
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
