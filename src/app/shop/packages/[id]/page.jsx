"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Percent,
  X,
  Plus,
  Minus,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/context/AuthContext";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const getProductImageUrl = (product) => {
  if (!product) return null;
  const url = product.imageUrl ||
    (product.media?.[0]?.url || product.media?.[0]) ||
    product.productImage ||
    product.image;

  if (!url || url === "undefined") return null;
  return url.startsWith("http") ? url : `${backendUrl}${url}`;
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

  // Fetch package and products
  useEffect(() => {
    const fetchPackageData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");

        // Fetch package details
        const pkgResponse = await fetch(`/api/packages/${packageId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!pkgResponse.ok) {
          throw new Error("Failed to load package");
        }

        const pkgResult = await pkgResponse.json();
        setPackageData(pkgResult.data);

        // Fetch all products
        let prodResult = null;
        let prodResponse = await fetch("/api/products", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (prodResponse.ok) {
          prodResult = await prodResponse.json();
        } else {
          prodResponse = await fetch("/api/products");
          if (prodResponse.ok) {
            prodResult = await prodResponse.json();
          } else {
            throw new Error("Failed to load products");
          }
        }

        let productsData = Array.isArray(prodResult) 
          ? prodResult 
          : (prodResult?.data || []);

        setProducts(productsData);

        const initialQuantities = {};
        productsData.forEach((product) => {
          initialQuantities[product._id] = 0;
        });
        setQuantities(initialQuantities);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load package details");
      } finally {
        setLoading(false);
      }
    };

    if (packageId) {
      fetchPackageData();
    }
  }, [packageId]);

  const handleProductSelect = (productId) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.includes(productId);
      if (isSelected) {
        return prev.filter((id) => id !== productId);
      } else {
        // Check if maxProducts limit is reached
        const maxProducts = packageData?.maxProducts || 5;
        if (prev.length >= maxProducts) {
          setError(`You can only add up to ${maxProducts} products to this package`);
          return prev;
        }
        // Set quantity to 1 when adding product
        setQuantities((prevQty) => ({
          ...prevQty,
          [productId]: 1,
        }));
        setError("");
        return [...prev, productId];
      }
    });
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity >= 0) {
      setQuantities((prev) => ({
        ...prev,
        [productId]: newQuantity,
      }));
      
      if (newQuantity > 0 && !selectedProducts.includes(productId)) {
        handleProductSelect(productId);
      } else if (newQuantity === 0 && selectedProducts.includes(productId)) {
        setSelectedProducts((prev) => prev.filter((id) => id !== productId));
      }
    }
  };

  const getTotalPrice = () => {
    let total = 0;
    selectedProducts.forEach((productId) => {
      const product = products.find((p) => p._id === productId);
      if (product) {
        const price = getProductPrice(product);
        const quantity = quantities[productId] || 0;
        total += price * quantity;
      }
    });
    return total;
  };

  const getDiscountPercentage = () => {
    return packageData?.discountPercentage || 0;
  };

  const getDiscountedPrice = () => {
    const total = getTotalPrice();
    const discount = getDiscountPercentage();
    if (discount > 0) {
      return total * (1 - discount / 100);
    }
    return total;
  };

  const getTotalSavings = () => {
    const total = getTotalPrice();
    return total - getDiscountedPrice();
  };

  const handleAddToCart = async () => {
    if (selectedProducts.length === 0) {
      setError("Please select at least one product");
      return;
    }

    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const cartData = {
        packageId: packageData._id,
        packageName: packageData.name,
        selectedProducts: selectedProducts.map((productId) => ({
          productId,
          quantity: quantities[productId] || 1,
        })),
        discountPercentage: getDiscountPercentage(),
        totalPrice: getTotalPrice(),
        discountedPrice: getDiscountedPrice(),
        totalSavings: getTotalSavings(),
      };

      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      cart.push(cartData);
      localStorage.setItem("cart", JSON.stringify(cart));

      setSuccess("Package added to cart successfully!");
      setTimeout(() => {
        router.push("/shop");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading package...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error && !packageData) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const totalPrice = getTotalPrice();
  const discountedPrice = getDiscountedPrice();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </button>

          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 uppercase">
              BUILD YOUR CRUNCHY-Vita PACK
            </h1>
            <p className="text-gray-600">
              Add products to unlock a discount.
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && error !== "Please select at least one product" && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3 mb-6">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content - Products */}
            <div className="lg:w-2/3">
              {/* Product Category */}
              <div className="mb-8">
               

                {products.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium">
                      No products available
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {products.map((product) => {
                      const isSelected = selectedProducts.includes(product._id);
                      const price = getProductPrice(product);
                      const quantity = quantities[product._id] || 0;
                      const imageUrl = getProductImageUrl(product);

                      return (
                        <div
                          key={product._id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                        >
                          {/* Product Image */}
                          <div className="p-6 flex items-center justify-center h-48">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="h-full w-auto object-contain"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                <Package className="h-16 w-16 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="p-6 border-t border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-2 uppercase text-sm">
                              {product.name}
                            </h3>

                            <p className="text-lg font-bold text-gray-900 mb-4">
                              ${price.toFixed(2)}
                            </p>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      product._id,
                                      Math.max(0, quantity - 1)
                                    )
                                  }
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                                >
                                  <Minus className="h-4 w-4 text-gray-600" />
                                </button>
                                <span className="w-12 text-center font-semibold text-lg">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      product._id,
                                      quantity + 1
                                    )
                                  }
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                                >
                                  <Plus className="h-4 w-4 text-gray-600" />
                                </button>
                              </div>
                            </div>

                            {/* Add to Pack Button */}
                            <button
                              onClick={() => handleProductSelect(product._id)}
                              className={`w-full py-3 rounded-full font-semibold text-sm transition ${
                                isSelected
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-gray-900 text-white hover:bg-gray-800"
                              }`}
                            >
                              {isSelected ? "Added to pack" : "Add a pack"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Pack Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">
                    PACK SUMMARY
                  </h2>
                  
                  {/* Product Count */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Products Selected</span>
                      <span className="text-sm font-bold text-gray-900">
                        {selectedProducts.length} / {packageData?.maxProducts || 5}
                      </span>
                    </div>
                  </div>
                  
                  {getDiscountPercentage() > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">
                          {getDiscountPercentage()}% Package Discount Applied
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {getDiscountPercentage() > 0 && (
                    <div className="flex justify-between text-base">
                      <span className="text-gray-700">Discount ({getDiscountPercentage()}%)</span>
                      <span className="font-medium text-green-600">
                        -${getTotalSavings().toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-gray-900">Estimated total</span>
                      <span className="font-bold text-gray-900">
                        ${discountedPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={selectedProducts.length === 0}
                  className={`w-full rounded-full py-3 font-semibold text-sm uppercase transition ${
                    selectedProducts.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  Add pack to cart
                </button>

                {/* Footer Note */}
                <p className="text-xs text-gray-500 mt-4 text-center leading-relaxed">
                  The discount is applicable via the corresponding code.<br />
                  If available, it will be applied automatically at checkout.
                </p>

                {error && error !== "Please select at least one product" && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 flex items-start gap-2 mt-4">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 flex items-start gap-2 mt-4">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700">{success}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}