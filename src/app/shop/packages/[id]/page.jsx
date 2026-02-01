"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Minus,
  LayoutDashboard,
  ShoppingBag,
  Info,
  Star,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import PromoBadge from "@/components/PromoBadge";
import { useAuth } from "@/context/AuthContext";

// Optimize these functions outside component to prevent recreation
const getProductImageUrl = (product) => {
  if (!product) return null;
  const url = product.imageUrl ||
    (product.media?.[0]?.url || product.media?.[0]) ||
    product.productImage ||
    product.image;

  if (!url || url === "undefined") return null;
  return url;
};

const getProductPrice = (product) => {
  if (!product) return 0;
  const history = product.pricingHistory;
  const price = (history && history.length > 0)
    ? history[history.length - 1]?.price
    : product.price;
  return Number(price) || 0;
};

export default function PackageCustomizationPage() {
  const router = useRouter();
  const params = useParams();
  const packageId = params?.id;
  const { user } = useAuth();

  const [packageData, setPackageData] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const fetchPackageData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");

        const pkgResponse = await fetch(`/api/packages/${packageId}`, {
          next: { revalidate: 30 },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!pkgResponse.ok) throw new Error("Failed to load package");

        const pkgResult = await pkgResponse.json();
        setPackageData(pkgResult.data);

        let prodResponse = await fetch("/api/products", {
          next: { revalidate: 30 }
        });
        if (!prodResponse.ok) throw new Error("Failed to load products");
        
        const prodResult = await prodResponse.json();
        const productsData = Array.isArray(prodResult) ? prodResult : (prodResult?.data || []);

        setProducts(productsData);

        const initialQuantities = {};
        productsData.forEach((product) => {
          initialQuantities[product._id] = 1;
        });
        setQuantities(initialQuantities);
      } catch (err) {
        setError(err.message || "Failed to load package details");
      } finally {
        setLoading(false);
      }
    };

    if (packageId) fetchPackageData();
  }, [packageId]);

  const handleProductSelect = (productId) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.includes(productId);
      if (isSelected) {
        return prev.filter((id) => id !== productId);
      } else {
        const maxProducts = packageData?.maxProducts || 5;
        if (prev.length >= maxProducts) {
          setError(`Limit reached: Maximum ${maxProducts} products allowed.`);
          setTimeout(() => setError(""), 3000);
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (packageData?.allowMultipleQuantities === false) {
      return;
    }
    if (newQuantity >= 1) {
      setQuantities((prev) => ({ ...prev, [productId]: newQuantity }));
    }
  };

  // Memoize expensive calculations
  const totalPrice = useMemo(() => {
    return selectedProducts.reduce((total, id) => {
      const product = products.find((p) => p._id === id);
      const quantity = packageData?.allowMultipleQuantities === false ? 1 : (quantities[id] || 0);
      return total + (getProductPrice(product) * quantity);
    }, 0);
  }, [selectedProducts, products, packageData, quantities]);

  const discountPercentage = packageData?.discountPercentage || 0;
  const discountedPrice = totalPrice * (1 - discountPercentage / 100);
  const totalSavings = totalPrice - discountedPrice;

  const getTotalPrice = () => totalPrice;
  const getDiscountPercentage = () => discountPercentage;
  const getDiscountedPrice = () => discountedPrice;
  const getTotalSavings = () => totalSavings;

  const handleAddToCart = async () => {
    if (selectedProducts.length === 0) {
      setError("Please select at least one product to continue.");
      return;
    }
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const cartData = {
        packageId: packageData._id,
        packageName: packageData.name,
        selectedProducts: selectedProducts.map((productId) => ({
          productId,
          quantity: packageData.allowMultipleQuantities === false ? 1 : (quantities[productId] || 1),
        })),
        discountPercentage: getDiscountPercentage(),
        totalPrice: getTotalPrice(),
        discountedPrice: getDiscountedPrice(),
      };

      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      cart.push(cartData);
      localStorage.setItem("cart", JSON.stringify(cart));

      setSuccess("Added to cart! Redirecting...");
      setTimeout(() => router.push("/cart"), 1500);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  if (loading) return (
    <>
      <Header />
      <div className="min-h-screen bg-[#fafafa] pb-24">
        <div className="max-w-400 mx-auto px-6 lg:px-8 pt-12">
          <div className="space-y-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Header />
      
      {/* 🎁 PROMO BADGE */}
      <PromoBadge />
      
      <div className="min-h-screen bg-[#fafafa] pb-24">
        <div className="max-w-400 mx-auto px-6 lg:px-8 pt-12">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-8">
            <div>
              <button onClick={() => router.back()} className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-green-900 transition-colors mb-4">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
              </button>
              <h1 className="text-3xl  font-black text-gray-900 uppercase leading-none">
               BUILD YOUR {packageData?.name || "Custom Crunchy Vita Pack"}
              </h1>
              <p className="text-gray-500 mt-3 max-w-2xl text-xl">
                {packageData?.description || "Curate your perfect selection and enjoy exclusive pack discounts."}
              </p>
            </div>
          
          </div>

          

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Products Grid */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {products.map((product) => {
                  const isSelected = selectedProducts.includes(product._id);
                  const qty = quantities[product._id] || 0;
                  const avgRating = product.ratings?.length
                    ? product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / product.ratings.length
                    : null;
                  return (
                    <div key={product._id} className={`group relative bg-white rounded-[32px] border-2 transition-all duration-300 overflow-hidden ${isSelected ? 'border-green-900 ring-4 ring-green-900/5' : 'border-transparent shadow-sm hover:shadow-xl'}`}>
                      <div className="relative aspect-square bg-gray-100">
                        <img 
                          src={getProductImageUrl(product)} 
                          alt={product.name} 
                          className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-105' : 'group-hover:scale-110'}`} 
                        />
                        {isSelected && (
                          <div className="absolute top-4 right-4 bg-green-900 text-white p-1.5 rounded-full shadow-lg">
                            <CheckCircle2 size={18} />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-900 truncate">{product.name}</h3>
                        {avgRating && (
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex items-center gap-1 text-yellow-500">
                              <span className="text-sm text-gray-600 ml-2">{avgRating.toFixed(1)}</span>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.round(avgRating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-2"> ({product.ratings.length})</span>
                          </div>
                        )}
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-gray-900">${(getProductPrice(product) * (packageData?.allowMultipleQuantities === false ? 1 : (quantities[product._id] || 1))).toFixed(2)}</span>
                        </div>
                        
                        <div className="mt-5 flex items-center gap-3">
                          {packageData?.allowMultipleQuantities !== false ? (
                            <div className="flex items-center bg-gray-100 rounded-xl p-1.5">
                              <button onClick={() => handleQuantityChange(product._id, Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all" disabled={qty <= 1}><Minus size={16}/></button>
                              <span className="w-10 text-center font-bold text-base">{qty}</span>
                              <button onClick={() => handleQuantityChange(product._id, qty + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all"><Plus size={16}/></button>
                            </div>
                          ) : (
                            <div className="flex items-center bg-green-50 text-green-800 rounded-xl px-4 py-2.5 border border-green-200">
                              <Info size={16} className="mr-2" />
                              <span className="text-xs font-bold uppercase tracking-wide">Qty: 1 Only</span>
                            </div>
                          )}
                          <button 
                            onClick={() => handleProductSelect(product._id)}
                            className={`flex-1 py-3 rounded-xl font-bold text-s   transition-all ${isSelected ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-900 text-white hover:bg-green-800'}`}
                          >
                            {isSelected ? 'Remove' : 'Add to Pack'}
                          </button>
                        </div>
                      </div>
                      <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl p-10 sticky top-24">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 flex items-center gap-3">
                    <ShoppingBag size={26} className="text-green-900" /> Your Selection
                  </h2>
                  <span className="bg-gray-100 text-gray-500 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                    {selectedProducts.length} Items
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-10">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                    <span>Pack Capacity</span>
                    <span>{selectedProducts.length} / {packageData?.maxProducts || 5}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-900 transition-all duration-700 ease-out"
                      style={{ width: `${(selectedProducts.length / (packageData?.maxProducts || 5)) * 100}%` }}
                    />
                  </div>
                </div>



                {/* Pricing Calculation */}
                <div className="border-t border-gray-100 pt-8 space-y-4">
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-gray-400 uppercase tracking-widest">total</span>
                    <span className="font-bold text-gray-900">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  {getDiscountPercentage() > 0 && (
                    <div className="flex justify-between text-base">
                      <span className="font-bold text-green-600 uppercase tracking-widest">Pack Discount ({getDiscountPercentage()}%)</span>
                      <span className="font-bold text-green-600">-${getTotalSavings().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-3">
                    <span className="text-xl font-black uppercase tracking-tighter text-gray-900">Amount to Pay</span>
                    <span className="text-3xl font-black text-gray-900 tracking-tighter">${getDiscountedPrice().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={selectedProducts.length === 0}
                  className="w-full mt-10 bg-green-900 hover:bg-black disabled:bg-gray-100 disabled:text-gray-300 text-white py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] shadow-xl shadow-green-900/10 flex items-center justify-center gap-3"
                >
                  Confirm & Add to Cart <ShoppingCart size={18} />
                </button>

                {error && <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse"><AlertCircle size={14}/> {error}</div>}
                {success && <div className="mt-4 p-3 rounded-xl bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={14}/> {success}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
      `}</style>
    </>
  );
}