"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
  ShoppingBag,
  Info,
  Star,
  RotateCcw,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import PromoBadge from "@/components/PromoBadge";
import { useAuth } from "@/context/AuthContext";
import { usePackStorage } from "@/hooks/usePackStorage";

// --- BRAND COLOR PALETTE ---
const COLORS = {
  pistachio: "#B3C800", // Bright accent / Progress
  grass: "#556822",     // Primary brand / Main buttons
  nightNight: "#005085", // Secondary / Pricing / Final CTA
  bubbleGum: "#EF8EB8",  // Highlights
  beige: "#F8F9F2",      // Page Background
  white: "#FFFFFF",
};

// --- UTILS ---
const getProductImageUrl = (product) => {
  if (!product) return null;
  const url = product.imageUrl ||
    (product.media?.[0]?.url || product.media?.[0]) ||
    product.productImage ||
    product.image;
  return (!url || url === "undefined") ? null : url;
};

const getProductPrice = (product) => {
  if (!product) return 0;
  const history = product.pricingHistory;
  const price = (history && history.length > 0)
    ? history[history.length - 1]?.price
    : product.price;
  return Number(price) || 0;
};

// Vérification de stock inspirée de la logique du détail produit
const getAvailableStock = (product) => {
  if (!product) return 0;

  if (product.availableQuantity !== undefined && product.availableQuantity !== null) {
    return Number(product.availableQuantity) || 0;
  }

  if (product.stock?.availableQuantity !== undefined && product.stock?.availableQuantity !== null) {
    return Number(product.stock.availableQuantity) || 0;
  }

  if (product.stock?.quantity !== undefined && product.stock?.quantity !== null) {
    const reserved = Number(product.stock?.reservedQuantity || 0);
    return Math.max(0, Number(product.stock.quantity || 0) - reserved);
  }

  if (product.stockQuantity !== undefined && product.stockQuantity !== null) {
    return Number(product.stockQuantity) || 0;
  }

  if (product.stock !== undefined && product.stock !== null) {
    return Number(product.stock) || 0;
  }

  return 0;
};

const isProductOutOfStock = (product) => getAvailableStock(product) <= 0;

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
  const [fixedItems, setFixedItems] = useState([]);
  const [isRestoringFromStorage, setIsRestoringFromStorage] = useState(false);
  const [showStockAlerts, setShowStockAlerts] = useState({});

  // Initialize pack storage hook
  const {
    savePackConfig,
    loadPackConfig,
    clearPackConfig,
    hasStoredConfig,
    isStorageReady
  } = usePackStorage(packageId);

  useEffect(() => {
    const fetchPackageData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

        const pkgResponse = await fetch(`${API_URL}/packages/${packageId}`, {
          next: { revalidate: 30 },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!pkgResponse.ok) throw new Error("Échec du chargement du pack");

        const pkgResult = await pkgResponse.json();
        const pkgData = pkgResult.data;
        setPackageData(pkgData);

        if (pkgData?.packageType === "FIXED") {
          setFixedItems(pkgData.products || []);
          setProducts([]);
          setSelectedProducts([]);
          setQuantities({});
          return;
        }

        const prodResponse = await fetch(`${API_URL}/packages/${packageId}/available-products`, {
          next: { revalidate: 30 },
        });

        if (!prodResponse.ok) throw new Error("Échec du chargement des produits");

        const prodResult = await prodResponse.json();

        // Get all products without filtering by stock
        const productsData = Array.isArray(prodResult.data) ? prodResult.data : (prodResult?.data || []);

        setProducts(productsData);

        const initialQuantities = {};
        productsData.forEach((product) => { initialQuantities[product._id] = 1; });
        setQuantities(initialQuantities);

        // Restore pack configuration from storage if available
        if (isStorageReady) {
          const storedConfig = loadPackConfig();
          if (storedConfig) {
            setIsRestoringFromStorage(true);

            // Validate that stored products still exist and are available
            const validProductIds = productsData.map(p => p._id);
            const validSelectedProducts = storedConfig.selectedProducts?.filter(
              id => validProductIds.includes(id)
            ) || [];

            // Restore quantities only for valid products
            const validQuantities = {};
            Object.keys(storedConfig.quantities || {}).forEach(productId => {
              if (validProductIds.includes(productId)) {
                validQuantities[productId] = storedConfig.quantities[productId];
              }
            });

            if (validSelectedProducts.length > 0) {
              setSelectedProducts(validSelectedProducts);
              setQuantities(prev => ({ ...prev, ...validQuantities }));
            }

            setIsRestoringFromStorage(false);
          }
        }
      } catch (err) {
        setError(err.message || "Échec du chargement");
      } finally {
        setLoading(false);
      }
    };
    if (packageId) fetchPackageData();
  }, [packageId, isStorageReady, loadPackConfig]);

  // Auto-save pack configuration to localStorage when it changes
  useEffect(() => {
    if (
      !isRestoringFromStorage &&
      isStorageReady &&
      packageData &&
      packageData.packageType !== "FIXED" &&
      selectedProducts.length > 0
    ) {
      const configToSave = {
        selectedProducts,
        quantities,
        packageData: {
          id: packageData._id,
          name: packageData.name,
          maxProducts: packageData.maxProducts,
          allowMultipleQuantities: packageData.allowMultipleQuantities,
          discountPercentage: packageData.discountPercentage,
        },
      };
      savePackConfig(configToSave);
    }
  }, [selectedProducts, quantities, packageData, isStorageReady, savePackConfig, isRestoringFromStorage]);

  const handleProductSelect = useCallback((productId) => {
    // Trouver le produit
    const product = products.find(p => p._id === productId);

    // Vérifier si le produit est en rupture de stock
    if (product && isProductOutOfStock(product)) {
      setError("Ce produit est en rupture de stock et ne peut pas être ajouté.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSelectedProducts((prev) => {
      const isSelected = prev.includes(productId);
      if (isSelected) return prev.filter((id) => id !== productId);

      const maxProducts = packageData?.maxProducts || 5;
      if (prev.length >= maxProducts) {
        setError(`Limite atteinte : Maximum ${maxProducts} produits.`);
        setTimeout(() => setError(""), 3000);
        return prev;
      }
      return [...prev, productId];
    });
  }, [packageData?.maxProducts, products]);

  const handleQuantityChange = useCallback((productId, newQuantity) => {
    if (packageData?.allowMultipleQuantities === false) return;
    if (newQuantity >= 1) {
      setQuantities((prev) => ({ ...prev, [productId]: newQuantity }));
    }
  }, [packageData?.allowMultipleQuantities]);

  const triggerStockAlert = useCallback((productId) => {
    setShowStockAlerts((prev) => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setShowStockAlerts((prev) => ({ ...prev, [productId]: false }));
    }, 3000);
  }, []);

  const totalPrice = useMemo(() => {
    return selectedProducts.reduce((total, id) => {
      const product = products.find((p) => p._id === id);
      const qty = packageData?.allowMultipleQuantities === false ? 1 : (quantities[id] || 0);
      return total + (getProductPrice(product) * qty);
    }, 0);
  }, [selectedProducts, products, packageData, quantities]);

  const fixedTotalPrice = useMemo(() => {
    return fixedItems.reduce((total, item) => {
      const product = item.productId || {};
      const qty = item.quantity || 1;
      return total + (getProductPrice(product) * qty);
    }, 0);
  }, [fixedItems]);

  const discountPercentage = packageData?.discountPercentage || 0;

  const { discountedPrice, totalSavings } = useMemo(() => {
    const discounted = totalPrice * (1 - discountPercentage / 100);
    return {
      discountedPrice: discounted,
      totalSavings: totalPrice - discounted
    };
  }, [totalPrice, discountPercentage]);

  const { discountedFixedPrice, totalFixedSavings } = useMemo(() => {
    const discounted = fixedTotalPrice * (1 - discountPercentage / 100);
    return {
      discountedFixedPrice: discounted,
      totalFixedSavings: fixedTotalPrice - discounted
    };
  }, [fixedTotalPrice, discountPercentage]);

  const handleClearPack = useCallback(() => {
    setSelectedProducts([]);
    const resetQuantities = {};
    products.forEach((product) => { resetQuantities[product._id] = 1; });
    setQuantities(resetQuantities);
    clearPackConfig();
  }, [products, clearPackConfig]);

  const handleAddToCart = async () => {
    if (selectedProducts.length === 0) {
      setError("Sélectionnez au moins un produit.");
      return;
    }

    // Vérifier si des produits sont en rupture de stock
    const outOfStockProducts = selectedProducts.filter(productId => {
      const product = products.find(p => p._id === productId);
      return product && isProductOutOfStock(product);
    });

    if (outOfStockProducts.length > 0) {
      setError("Certains produits de votre sélection sont en rupture de stock.");
      return;
    }

    if (!user) { router.push("/auth/login"); return; }

    try {
      const cartData = {
        packageId: packageData._id,
        packageName: packageData.name,
        selectedProducts: selectedProducts.map((productId) => ({
          productId,
          quantity: packageData.allowMultipleQuantities === false ? 1 : (quantities[productId] || 1),
        })),
        discountPercentage,
        totalPrice,
        discountedPrice,
      };

      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      cart.push(cartData);
      localStorage.setItem("cart", JSON.stringify(cart));

      // Clear the pack configuration from storage after adding to cart
      clearPackConfig();

      setSuccess("Ajouté au panier !");
      setTimeout(() => router.push("/cart"), 1200);
    } catch (err) { setError("Erreur lors de l'ajout."); }
  };

  const handleAddFixedToCart = async () => {
    if (!user) { router.push("/auth/login"); return; }
    try {
      const selected = fixedItems.map((item) => ({
        productId: item.productId?._id || item.productId,
        quantity: item.quantity || 1,
      }));

      const cartData = {
        packageId: packageData._id,
        packageName: packageData.name,
        selectedProducts: selected,
        discountPercentage,
        totalPrice: fixedTotalPrice,
        discountedPrice: discountedFixedPrice,
      };

      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      cart.push(cartData);
      localStorage.setItem("cart", JSON.stringify(cart));

      setSuccess("Ajouté au panier !");
      setTimeout(() => router.push("/cart"), 1200);
    } catch (err) {
      setError("Erreur lors de l'ajout.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  if (packageData?.packageType === "FIXED") {
    return (
      <div style={{ backgroundColor: COLORS.beige }} className="min-h-screen">
        <Header />
        <PromoBadge />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.back()}
                style={{ color: COLORS.grass }}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-all"
              >
                <ArrowLeft size={16} /> Retour à la boutique
              </button>
            </div>
            <h1 className="text-4xl font-black font-[agrandir] text-gray-900 uppercase">
              Votre <span style={{ color: COLORS.grass }}>{packageData?.name}</span>
            </h1>
            <p className="text-gray-500 mt-2 max-w-xl font-[Maison Neue]">
              {packageData?.description || "Un coffret fixe, prêt à être ajouté au panier."}
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {fixedItems.map((item) => {
                  const product = item.productId || {};
                  return (
                    <div
                      key={item._id || item.productId?._id || item.productId}
                      className="bg-white rounded-[24px] border shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-square bg-gray-50 m-2 rounded-[18px] overflow-hidden">
                        {getProductImageUrl(product) ? (
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag size={32} />
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold font-[agrandir] text-[#556822] text-lg leading-tight truncate">{product.name || "Produit"}</h3>
                        <p className="text-sm text-gray-500 mt-1">Quantité : {item.quantity || 1}</p>
                        <p className="text-2xl font-black mt-auto text-[#E10c69]">
                          €{(getProductPrice(product) * (item.quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white rounded-[32px] p-8 sticky top-24 shadow-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-8">
                  <ShoppingBag style={{ color: COLORS.grass }} />
                  <h2 className="text-xl font-black uppercase tracking-tight">Aperçu</h2>
                </div>

                <div className="space-y-4 border-t border-dashed pt-6 mb-8">
                  <div className="flex justify-between text-sm font-bold text-gray-400 uppercase tracking-widest">
                    <span>Total Brut</span>
                    <span>€{fixedTotalPrice.toFixed(2)}</span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.grass }}>
                      <span>Remise Pack ({discountPercentage}%)</span>
                      <span>-€{totalFixedSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-black uppercase">À Payer</span>
                    <span className="text-3xl font-black text-[#E10C69]">
                      €{discountedFixedPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddFixedToCart}
                  style={{ backgroundColor: "#556822" }}
                  className="text-white w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Ajouter au panier <ShoppingCart size={18} />
                </button>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 p-3 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase flex items-center gap-2"
                    >
                      <AlertCircle size={14} /> {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 rounded-xl bg-green-50 text-green-600 text-[10px] font-black uppercase flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} /> {success}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: COLORS.beige }} className="min-h-screen">
      <Header />
      <PromoBadge />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Navigation & Title */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              style={{ color: COLORS.grass }}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-all"
            >
              <ArrowLeft size={16} /> Retour à la boutique
            </button>
          </div>
          <h1 className="text-4xl font-black font-[agrandir] text-gray-900 uppercase">
            Votre <span style={{ color: COLORS.grass }}>{packageData?.name}</span>
          </h1>
          <p className="text-gray-500 mt-2 max-w-xl font-[Maison Neue]">
            {packageData?.description || "Sélectionnez vos produits préférés et profitez de votre remise exclusive."}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* PRODUCT LIST */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => {
                const isSelected = selectedProducts.includes(product._id);
                const qty = quantities[product._id] || 1;
                const avgRating = product.ratings?.length
                  ? product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / product.ratings.length
                  : null;
                const availableStock = getAvailableStock(product);
                const isOutOfStock = availableStock <= 0;

                return (
                  <motion.div
                    key={product._id}
                    initial={false}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    style={{ borderColor: isSelected ? COLORS.pistachio : "transparent" }}
                    className={`bg-white rounded-[24px] border-2 shadow-sm overflow-hidden flex flex-col transition-all`}
                  >
                    <div className="relative aspect-square bg-gray-50 m-2 rounded-[18px] overflow-hidden">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {isSelected && !isOutOfStock && (
                        <div className="absolute top-3 right-3 shadow-lg">
                          <CheckCircle2 size={24} fill={COLORS.pistachio} color="white" />
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="mb-2">
                        {avgRating && (
                          <div className="flex items-center gap-1 mb-4">
                            <div className="flex items-center gap-0.5">
                              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tighter mr-2">
                                {avgRating.toFixed(1)}
                              </span>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                                />
                              ))}
                            </div>
                            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tighter ml-2">
                              ({product.ratings.length})
                            </span>
                          </div>
                        )}
                        <h3 className="font-bold font-[agrandir] text-[#556822] text-lg leading-tight truncate">{product.name}</h3>

                      </div>

                      <div className="mt-auto">
                        <p className="text-2xl font-black mb-4 text-[#E10c69]" >
                          €{(getProductPrice(product) * (packageData?.allowMultipleQuantities === false ? 1 : qty)).toFixed(2)}
                        </p>

                        <div className="flex flex-col gap-2">
                          {showStockAlerts[product._id] && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-[12px] font-black ">
                              <AlertCircle size={14} />
                              Quantité maximale atteinte pour ce produit</div>
                          )}
                          {packageData?.allowMultipleQuantities !== false && !isOutOfStock && (
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1 border">
                              <button
                                onClick={() => handleQuantityChange(product._id, qty - 1)}
                                disabled={qty <= 1}
                                className="p-2 hover:bg-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="font-bold text-sm">{qty}</span>
                              <button
                                onClick={() => {
                                  if (availableStock > 0 && qty >= availableStock) {
                                    triggerStockAlert(product._id);
                                  } else {
                                    handleQuantityChange(product._id, qty + 1);
                                  }
                                }}
                                className="p-2 hover:bg-white rounded-lg transition-all"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => !isOutOfStock && handleProductSelect(product._id)}
                            disabled={isOutOfStock}
                            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md
                                ${isOutOfStock
                                ? "bg-[#9CA3AF] text-white cursor-not-allowed opacity-90"
                                : isSelected
                                  ? "bg-red-50 text-red-500 cursor-pointer"
                                  : "bg-[#556822] text-white cursor-pointer"
                              }`}

                          >
                            {isOutOfStock ? "Rupture de stock" : (isSelected ? "Retirer" : "Ajouter au pack")}
                          </button>

                          <Link
                            href={`/shop/${product._id}?packageId=${packageId}`}
                            className="block w-full py-3 rounded-xl bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-widest text-center hover:bg-gray-100 transition-all"
                          >
                            Voir détails
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR SUMMARY */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[32px] p-8 sticky top-24 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <ShoppingBag style={{ color: COLORS.grass }} />
                  <h2 className="text-xl font-black uppercase tracking-tight ">Aperçu</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#E10C69] text-white" >
                    {selectedProducts.length} Produits
                  </span>
                  {selectedProducts.length > 0 && (
                    <button
                      onClick={handleClearPack}
                      title="Réinitialiser"
                      className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-200 group"
                    >
                      <RotateCcw size={16} className="text-gray-500 group-hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <span>Capacité du pack</span>
                  <span>{selectedProducts.length} / {packageData?.maxProducts || 5}</span>
                </div>

                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (selectedProducts.length / (packageData?.maxProducts || 5)) }}
                    transition={{ duration: 0.3 }}
                    style={{ transformOrigin: "left" }}
                    className="h-full bg-[#556822]"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 border-t border-dashed pt-6 mb-8">
                <div className="flex justify-between text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <span>Total Brut</span>
                  <span>€{totalPrice.toFixed(2)}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.grass }}>
                    <span>Remise Pack ({discountPercentage}%)</span>
                    <span>-€{totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-black uppercase">À Payer</span>
                  <span className="text-3xl font-black text-[#E10C69]" >
                    €{discountedPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={
                  selectedProducts.length === 0 ||
                  (packageData?.minProducts && selectedProducts.length < packageData.minProducts)
                }
                style={{
                  backgroundColor: (
                    selectedProducts.length === 0 ||
                    (packageData?.minProducts && selectedProducts.length < packageData.minProducts)
                  ) ? "#9CA3AF" : "#556822"
                }}
                className="text-white w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Valider ma sélection <ShoppingCart size={18} />
              </button>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-3 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase flex items-center gap-2"
                  >
                    <AlertCircle size={14} /> {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl bg-green-50 text-green-600 text-[10px] font-black uppercase flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} /> {success}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}