"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRef } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
  ShoppingBag,
  Star,
  RotateCcw,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import PromoBadge from "@/components/PromoBadge";
import AddedToCartModal from "@/components/AddedToCartModal";
import { useAuth } from "@/context/AuthContext";
import { usePackStorage } from "@/hooks/usePackStorage";
import { useCart } from "@/hooks/useCart";
import { useLocale, useTranslations } from "next-intl";
import { getTranslatedPackage, getTranslatedProduct } from "@/lib/productTranslations";

// --- BRAND COLOR PALETTE ---
const COLORS = {
  pistachio: "#B3C800",
  grass: "#556822",
  nightNight: "#005085",
  bubbleGum: "#EF8EB8",
  beige: "#F8F9F2",
  white: "#FFFFFF",
};

// --- UTILS ---
const pickUrl = (v) => {
  if (!v || v === "undefined") return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.url || v.secure_url || null;
  return null;
};

const getProductImageUrl = (product) => {
  if (!product) return null;

  // direct
  const direct =
    pickUrl(product.imageUrl) ||
    pickUrl(product.image) ||
    pickUrl(product.productImage);

  if (direct) return direct;

  // media
  const media = product.media;
  if (Array.isArray(media) && media.length > 0) {
    const first = media[0];
    return pickUrl(first?.url) || pickUrl(first) || pickUrl(first?.secure_url) || null;
  }

  // images array (optional)
  const images = product.images;
  if (Array.isArray(images) && images.length > 0) {
    return pickUrl(images[0]?.url) || pickUrl(images[0]) || null;
  }

  return null;
};

const getProductPrice = (product) => {
  if (!product) return 0;
  const history = product.pricingHistory;
  const price =
    history && history.length > 0 ? history[history.length - 1]?.price : product.price;
  return Number(price) || 0;
};

// Stock check inspired by product detail logic
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

  const { user } = useAuth(); // keep
  const t = useTranslations("PackageDetail");
  const locale = useLocale();
  const { addToCart } = useCart();

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
  const [packageQuantity, setPackageQuantity] = useState(1);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartModalProduct, setCartModalProduct] = useState(null);
  const [cartModalQuantity, setCartModalQuantity] = useState(1);
  const addCooldownUntilRef = useRef(0);

  // ✅ Package name NOT translated (handled by getTranslatedPackage)
  const translatedPackage = useMemo(
    () => getTranslatedPackage(packageData, locale),
    [packageData, locale]
  );

  // Initialize pack storage hook
  const { savePackConfig, loadPackConfig, clearPackConfig, isStorageReady } =
    usePackStorage(packageId);

  useEffect(() => {
    const fetchPackageData = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

        const [pkgResponse, prodResponse] = await Promise.all([
          fetch(`${API_URL}/packages/${packageId}`, {
            next: { revalidate: 30 },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_URL}/packages/${packageId}/available-products`, {
            next: { revalidate: 30 },
          }),
        ]);

        if (!pkgResponse.ok) throw new Error(t("errors.loadPack"));
        if (!prodResponse.ok) throw new Error(t("errors.loadProducts"));

        const [pkgResult, prodResult] = await Promise.all([
          pkgResponse.json(),
          prodResponse.json(),
        ]);

        const pkgData = pkgResult.data;
        setPackageData(pkgData);

        if (pkgData?.packageType === "FIXED") {
          setFixedItems(pkgData.products || []);
          setProducts([]);
          setSelectedProducts([]);
          setQuantities({});
          return;
        }

        const productsData = Array.isArray(prodResult.data)
          ? prodResult.data
          : prodResult?.data || [];
        setProducts(productsData);

        const initialQuantities = {};
        productsData.forEach((product) => {
          initialQuantities[product._id] = 1;
        });
        setQuantities(initialQuantities);

        // Restore pack configuration from storage if available
        if (isStorageReady) {
          const storedConfig = loadPackConfig();
          if (storedConfig) {
            setIsRestoringFromStorage(true);

            const validProductIds = productsData.map((p) => p._id);
            const validSelectedProducts =
              storedConfig.selectedProducts?.filter((id) => validProductIds.includes(id)) || [];

            const validQuantities = {};
            Object.keys(storedConfig.quantities || {}).forEach((productId) => {
              if (validProductIds.includes(productId)) {
                validQuantities[productId] = storedConfig.quantities[productId];
              }
            });

            if (validSelectedProducts.length > 0) {
              setSelectedProducts(validSelectedProducts);
              setQuantities((prev) => ({ ...prev, ...validQuantities }));
            }

            setIsRestoringFromStorage(false);
          }
        }
      } catch (err) {
        setError(err?.message || t("errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    if (packageId) fetchPackageData();
  }, [packageId, isStorageReady, loadPackConfig, t]);

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
  }, [
    selectedProducts,
    quantities,
    packageData,
    isStorageReady,
    savePackConfig,
    isRestoringFromStorage,
  ]);

  const handleProductSelect = useCallback(
    (productId) => {
      const product = products.find((p) => p._id === productId);

      if (product && isProductOutOfStock(product)) {
        setError(t("errors.outOfStock"));
        setTimeout(() => setError(""), 3000);
        return;
      }

      setSelectedProducts((prev) => {
        const isSelected = prev.includes(productId);
        if (isSelected) return prev.filter((id) => id !== productId);

        const maxProducts = packageData?.maxProducts || 5;
        if (prev.length >= maxProducts) {
          setError(t("errors.maxProducts", { max: maxProducts }));
          setTimeout(() => setError(""), 3000);
          return prev;
        }
        return [...prev, productId];
      });
    },
    [packageData?.maxProducts, products, t]
  );

  const handleQuantityChange = useCallback(
    (productId, newQuantity) => {
      if (packageData?.allowMultipleQuantities === false) return;
      if (newQuantity >= 1) setQuantities((prev) => ({ ...prev, [productId]: newQuantity }));
    },
    [packageData?.allowMultipleQuantities]
  );

  const triggerStockAlert = useCallback((productId) => {
    setShowStockAlerts((prev) => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setShowStockAlerts((prev) => ({ ...prev, [productId]: false }));
    }, 3000);
  }, []);

  const totalPrice = useMemo(() => {
    return selectedProducts.reduce((total, id) => {
      const product = products.find((p) => p._id === id);
      const qty = packageData?.allowMultipleQuantities === false ? 1 : quantities[id] || 0;
      return total + getProductPrice(product) * qty;
    }, 0);
  }, [selectedProducts, products, packageData, quantities]);

  const fixedTotalPrice = useMemo(() => {
    return fixedItems.reduce((total, item) => {
      const product = item.productId || {};
      const qty = item.quantity || 1;
      return total + getProductPrice(product) * qty;
    }, 0);
  }, [fixedItems]);

  const discountPercentage = packageData?.discountPercentage || 0;

  const { discountedPrice, totalSavings } = useMemo(() => {
    const discounted = totalPrice * (1 - discountPercentage / 100);
    return { discountedPrice: discounted, totalSavings: totalPrice - discounted };
  }, [totalPrice, discountPercentage]);

  const { discountedFixedPrice, totalFixedSavings } = useMemo(() => {
    const discounted = fixedTotalPrice * (1 - discountPercentage / 100);
    return {
      discountedFixedPrice: discounted,
      totalFixedSavings: fixedTotalPrice - discounted,
    };
  }, [fixedTotalPrice, discountPercentage]);

  const handleClearPack = useCallback(() => {
    setSelectedProducts([]);
    const resetQuantities = {};
    products.forEach((product) => {
      resetQuantities[product._id] = 1;
    });
    setQuantities(resetQuantities);
    clearPackConfig();
  }, [products, clearPackConfig]);

  // ✅ CUSTOM PACKAGE -> ADD TO CART (STORE MULTI-IMAGES)
  const handleAddToCart = async () => {
    if (selectedProducts.length === 0) {
      setError(t("errors.selectAtLeastOne"));
      return;
    }

    const outOfStockProducts = selectedProducts.filter((productId) => {
      const product = products.find((p) => p._id === productId);
      return product && isProductOutOfStock(product);
    });
    const now = Date.now();
    if (now < addCooldownUntilRef.current) return;
    addCooldownUntilRef.current = now + 1000;

    if (outOfStockProducts.length > 0) {
      setError(t("errors.selectionOutOfStock"));
      return;
    }

    try {
      const selectedProductsPayload = selectedProducts.map((productId) => {
        const product = products.find((p) => p._id === productId);
        const img = getProductImageUrl(product);
        return {
          productId,
          product,
          name: product?.name,
          image: img, // ✅ always a string url or null
          price: getProductPrice(product),
          quantity: packageData.allowMultipleQuantities === false ? 1 : quantities[productId] || 1,
        };
      });

      // ✅ Multi-image list for cart (unique + clean)
      const packageImages = [
        ...new Set(selectedProductsPayload.map((sp) => sp.image).filter(Boolean)),
      ];

      const packageCartItem = {
        _id: `package_${packageData._id}_${Date.now()}`,
        type: "package",
        packageId: packageData._id,
        name: packageData.name,
        packageName: packageData.name,
        description: packageData.description,

        // ✅ DO NOT store package image (so cart won’t show it)
        // image: packageData?.image,

        // ✅ store multi images (cart should use this)
        packageImages,

        selectedProducts: selectedProductsPayload,
        discountPercentage,
        price: discountedPrice,
        originalPrice: totalPrice,
        totalPrice,
        discountedPrice,
      };

      const ok = await addToCart(packageCartItem, 1);
      if (!ok) {
        setError(t("errors.selectionOutOfStock"));
        return;
      }
      clearPackConfig();

      setSuccess(t("success.addedToCart"));
      
      // Show cart modal instead of redirecting
      setCartModalProduct({
        ...packageCartItem,
        name: translatedPackage.name || packageData.name,
        image: packageImages[0]
      });
      setCartModalQuantity(1);
      setShowCartModal(true);
    } catch (err) {
      setError(t("errors.addToCart"));
    }
  };

  //  ADD TO CART (STORE MULTI-IMAGES)
  const handleAddFixedToCart = async () => {
    if (packageData?.packageType === "FIXED" && !packageData.inStock) {
      setError(t("fixed.notAvailable"));
      setTimeout(() => setError(""), 4000);
      return;
    }
    const now = Date.now();
    if (now < addCooldownUntilRef.current) return;
    addCooldownUntilRef.current = now + 1000;

    try {
      const selectedProductsPayload = fixedItems.map((item) => {
        const product = item.productId || {};
        const img = getProductImageUrl(product);

        return {
          productId: product._id || item.productId,
          product,
          name: product.name,
          image: img, // ✅ always string url or null
          price: getProductPrice(product),
          quantity: item.quantity || 1,
        };
      });

      const packageImages = [
        ...new Set(selectedProductsPayload.map((sp) => sp.image).filter(Boolean)),
      ];

      const packageCartItem = {
        _id: `package_${packageData._id}_fixed`,
        type: "package",
        packageId: packageData._id,
        name: packageData.name,
        packageName: packageData.name,
        description: packageData.description,
        packageType: "FIXED",

        // ✅ DO NOT store package image
        // image: packageData?.image,

        packageImages,

        selectedProducts: selectedProductsPayload,
        discountPercentage,
        quantity: packageQuantity,
        price: discountedFixedPrice,
        originalPrice: fixedTotalPrice,
        totalPrice: fixedTotalPrice,
        discountedPrice: discountedFixedPrice,
      };

      const ok = await addToCart(packageCartItem, packageQuantity);
      if (!ok) {
        setError(t("fixed.notAvailable"));
        return;
      }

      setSuccess(t("success.addedToCart"));
      
      // Show cart modal instead of redirecting
      setCartModalProduct({
        ...packageCartItem,
        name: translatedPackage.name || packageData.name,
        image: packageImages[0]
      });
      setCartModalQuantity(packageQuantity);
      setShowCartModal(true);
    } catch (err) {
      setError(t("errors.addToCart"));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t("loading")}</div>;
  }

  // ===================== FIXED PACKAGE UI =====================
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
                <ArrowLeft size={16} /> {t("backToShop")}
              </button>
            </div>

            <h1 className="text-4xl font-black font-[agrandir] text-gray-900 uppercase">
              {t("title")} <span style={{ color: COLORS.grass }}>{translatedPackage.name}</span>
            </h1>

            <p className="text-gray-500 mt-2 max-w-xl font-[Maison Neue]">
              {translatedPackage.description || t("descriptionFallback")}
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {fixedItems.map((item) => {
                  const product = item.productId || {};
                  const translatedProduct = getTranslatedProduct(product, locale);
                  const productName = translatedProduct.name || product.name || "Produit";
                  const img = getProductImageUrl(product);
                  return (
                    <div
                      key={item._id || item.productId?._id || item.productId}
                      className="bg-white rounded-[24px] border shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-square bg-gray-50 m-2 rounded-[18px] overflow-hidden">
                        {img ? (
                          <img src={img} alt={productName} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag size={32} />
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold font-[agrandir] text-[#556822] text-lg leading-tight truncate">
                          {productName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {t("fixed.itemQuantity", { count: item.quantity || 1 })}
                        </p>
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
                  <h2 className="text-xl font-black uppercase tracking-tight">{t("summary.title")}</h2>
                </div>

                <div className="mb-8 flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                    {t("fixed.quantity")}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPackageQuantity(Math.max(1, packageQuantity - 1))}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      style={{ color: COLORS.grass }}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="font-black text-lg w-8 text-center">{packageQuantity}</span>
                    <button
                      onClick={() => setPackageQuantity(packageQuantity + 1)}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      style={{ color: COLORS.grass }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 border-t border-dashed pt-6 mb-8">
                  <div className="flex justify-between text-sm font-bold text-gray-400 uppercase tracking-widest">
                    <span>{t("summary.total")}</span>
                    <span>€{(fixedTotalPrice * packageQuantity).toFixed(2)}</span>
                  </div>

                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.grass }}>
                      <span>{t("summary.discount", { percent: discountPercentage })}</span>
                      <span>-€{(totalFixedSavings * packageQuantity).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-black uppercase">{t("summary.toPay")}</span>
                    <span className="text-3xl font-black text-[#E10C69]">
                      €{(discountedFixedPrice * packageQuantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddFixedToCart}
                  disabled={!packageData.inStock}
                  style={{ backgroundColor: packageData.inStock ? "#556822" : "#9CA3AF" }}
                  className="text-white w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {packageData.inStock ? t("fixed.addToCart") : t("buttons.outOfStock")} <ShoppingCart size={18} />
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

        {/* Added to Cart Modal */}
        <AddedToCartModal
          isOpen={showCartModal}
          onClose={() => {
            setShowCartModal(false);
            setCartModalProduct(null);
          }}
          product={cartModalProduct}
          quantity={cartModalQuantity}
        />
      </div>
    );
  }

  // ===================== CUSTOM PACKAGE UI =====================
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
              <ArrowLeft size={16} /> {t("backToShop")}
            </button>
          </div>

          <h1 className="text-4xl font-black font-[agrandir] text-gray-900 uppercase">
            {t("title")} <span style={{ color: COLORS.grass }}>{translatedPackage.name}</span>
          </h1>

          <p className="text-gray-500 mt-2 max-w-xl font-[Maison Neue]">
            {translatedPackage.description || t("descriptionFallback")}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* PRODUCT LIST */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => {
                const translatedProduct = getTranslatedProduct(product, locale);
                const productName = translatedProduct.name;
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
                    className="bg-white rounded-[24px] border-2 shadow-sm overflow-hidden flex flex-col transition-all"
                  >
                    <div className="relative aspect-square bg-gray-50 m-2 rounded-[18px] overflow-hidden">
                      {getProductImageUrl(product) ? (
                        <img
                          src={getProductImageUrl(product)}
                          alt={productName}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">
                          NO IMAGE
                        </div>
                      )}

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
                                  className={`h-4 w-4 ${
                                    i < Math.round(avgRating)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-gray-200 text-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tighter ml-2">
                              ({product.ratings.length})
                            </span>
                          </div>
                        )}

                        <h3 className="font-bold font-[agrandir] text-[#556822] text-l leading-tight truncate">
                          {productName}
                        </h3>
                      </div>

                      <div className="mt-auto">
                        <p className="text-2xl font-black mb-4 text-[#E10c69]">
                          €
                          {(
                            getProductPrice(product) *
                            (packageData?.allowMultipleQuantities === false ? 1 : qty)
                          ).toFixed(2)}
                        </p>

                        <div className="flex flex-col gap-2">
                          {showStockAlerts[product._id] && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-[12px] font-black">
                              <AlertCircle size={14} />
                              {t("quantity.maxReached")}
                            </div>
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
                              ${
                                isOutOfStock
                                  ? "bg-[#9CA3AF] text-white cursor-not-allowed opacity-90"
                                  : isSelected
                                  ? "bg-red-50 text-red-500 cursor-pointer"
                                  : "bg-[#556822] text-white cursor-pointer"
                              }`}
                          >
                            {isOutOfStock
                              ? t("buttons.outOfStock")
                              : isSelected
                              ? t("buttons.remove")
                              : t("buttons.addToPack")}
                          </button>

                          <Link
                            href={`/shop/${product._id}?packageId=${packageId}`}
                            className="block w-full py-3 rounded-xl bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-widest text-center hover:bg-gray-100 transition-all"
                          >
                            {t("buttons.viewDetails")}
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
                  <h2 className="text-xl font-black uppercase tracking-tight">{t("summary.title")}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#E10C69] text-white">
                    {t("summary.productsCount", { count: selectedProducts.length })}
                  </span>

                  {selectedProducts.length > 0 && (
                    <button
                      onClick={handleClearPack}
                      title={t("summary.reset")}
                      className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-200 group"
                    >
                      <RotateCcw size={16} className="text-gray-500 group-hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <span>{t("summary.capacity")}</span>
                  <span>
                    {selectedProducts.length} / {packageData?.maxProducts || 5}
                  </span>
                </div>

                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: selectedProducts.length / (packageData?.maxProducts || 5) }}
                    transition={{ duration: 0.3 }}
                    style={{ transformOrigin: "left" }}
                    className="h-full bg-[#556822]"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-dashed pt-6 mb-8">
                <div className="flex justify-between text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <span>{t("summary.total")}</span>
                  <span>€{totalPrice.toFixed(2)}</span>
                </div>

                {discountPercentage > 0 && (
                  <div className="flex justify-between text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.grass }}>
                    <span>{t("summary.discount", { percent: discountPercentage })}</span>
                    <span>-€{totalSavings.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-black uppercase">{t("summary.toPay")}</span>
                  <span className="text-3xl font-black text-[#E10C69]">€{discountedPrice.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={
                  selectedProducts.length === 0 ||
                  (packageData?.minProducts && selectedProducts.length < packageData.minProducts)
                }
                style={{
                  backgroundColor:
                    selectedProducts.length === 0 ||
                    (packageData?.minProducts && selectedProducts.length < packageData.minProducts)
                      ? "#9CA3AF"
                      : "#556822",
                }}
                className="text-white w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("buttons.validate")} <ShoppingCart size={18} />
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

      {/* Added to Cart Modal */}
      <AddedToCartModal
        isOpen={showCartModal}
        onClose={() => {
          setShowCartModal(false);
          setCartModalProduct(null);
        }}
        product={cartModalProduct}
        quantity={cartModalQuantity}
      />
    </div>
  );
}
