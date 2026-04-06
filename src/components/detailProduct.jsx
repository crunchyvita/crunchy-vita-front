'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { getTranslatedProduct } from '@/lib/productTranslations';
import { useCart } from '@/hooks/useCart';
import {
  X, ChevronLeft, ChevronRight, Plus, Minus,
  ShoppingCart, Heart, ShieldCheck, Truck,
  Info, Star, AlertCircle, CheckCircle2
} from 'lucide-react';

const normalizeDescriptionLines = (description) => {
  if (typeof description !== 'string') return [];

  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•]\s*/, '').trim())
    .filter(Boolean);
};

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  getProductImageUrl,
  getProductPrice,
  getAvailableStock,
  onToggleFavorite,
  isFavorite,
  onShowCartModal
}) {
  const t = useTranslations('ProductModal');
  const locale = useLocale();
  const router = useRouter();
  const { addToCart } = useCart();
  const translatedProduct = getTranslatedProduct(product, locale);
  const productName = translatedProduct.name;
  const productDescription = translatedProduct.description;
  const descriptionLines = normalizeDescriptionLines(productDescription);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const addCooldownUntilRef = useRef(0);
  const quantityPlusCooldownRef = useRef(0);

  // Memoize images to avoid recalculation on every render
  const productImages = useMemo(() => {
    if (!product) return [];
    const images = [];

    if (product.media && product.media.length > 0) {
      product.media.forEach((mediaItem) => {
        const url = mediaItem.url || mediaItem;
        if (url && url !== 'undefined') {
          // Cloudinary returns full URLs - use them directly
          images.push(url);
        }
      });
    }

    if (images.length === 0) {
      const imageUrl = getProductImageUrl(product);
      if (imageUrl && imageUrl !== 'undefined') images.push(imageUrl);
    }
    return images;
  }, [product, getProductImageUrl]);

  // Logic values
  const productPrice = product ? getProductPrice(product) : 0;
  const availableStock = product ? getAvailableStock(product.stock) : 0;
  const totalPrice = productPrice * quantity;

  // Rating calculation
  const avgRating = product?.ratings?.length
    ? product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / product.ratings.length
    : null;
  const ratingCount = product?.ratings?.length || 0;

  // Effects
  useEffect(() => {
    if (isOpen && productImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, productImages]);

  useEffect(() => {
    setQuantity(1);
    setCurrentImageIndex(0);
    setAddedToCart(false);
  }, [product]);

  // Reset addedToCart state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAddedToCart(false);
      setQuantity(1);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Handlers
  const handleAddToCart = async () => {
    if (!product || !product._id) return;

    const now = Date.now();
    if (now < addCooldownUntilRef.current) return;
    addCooldownUntilRef.current = now + 1000;
    
    // Add to cart with proper price
    const productPrice = getProductPrice(product);
    const ok = await addToCart({
      ...product,
      price: productPrice
    }, quantity);

    if (!ok) {
      setShowStockAlert(true);
      setTimeout(() => setShowStockAlert(false), 3000);
      return;
    }

    // Show success message
    setAddedToCart(true);
    
    // Show cart modal via parent callback
    if (onShowCartModal) {
      onShowCartModal({
        ...product,
        name: productName,
        price: productPrice,
        image: productImages[0]
      }, quantity);
    }
    
    // Close detail modal after 1.5 seconds 
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleIncrement = () => {
    const now = Date.now();
    if (now < quantityPlusCooldownRef.current) return;
    quantityPlusCooldownRef.current = now + 500;

    if (quantity >= availableStock) {
      setShowStockAlert(true);
      setTimeout(() => setShowStockAlert(false), 3000);
    } else {
      setQuantity(quantity + 1);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/60 transition-opacity duration-300 font-[Maison Neue]"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-[calc(100vw-1rem)] sm:max-w-5xl w-full max-h-[88vh] sm:max-h-[95vh] overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row transition-all duration-500 scale-100 font-[Agrandir]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 z-50 bg-white/80 backdrop-blur-sm rounded-full p-2 sm:p-2.5 text-gray-900 shadow-md hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-[Maison Neue Mono]"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Left: Image Gallery Section */}
        <div className="w-full lg:w-1/2 bg-gray-50 p-3 sm:p-6 flex flex-col font-[Maison Neue Book]">
          <div className="relative flex-1 group aspect-square rounded-2xl overflow-hidden bg-white shadow-inner">
            {productImages.length > 0 ? (
              <>
                <img
                  src={productImages[currentImageIndex]}
                  alt={productName}
                  className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110"
                />

                {productImages.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length)}
                      className="p-2 bg-white/90 rounded-full shadow-xl hover:bg-white"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => (prev + 1) % productImages.length)}
                      className="p-2 bg-white/90 rounded-full shadow-xl hover:bg-white"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart size={64} strokeWidth={1} />
                <p className="mt-2 text-sm font-medium">{t('noImages')}</p>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto py-2 scrollbar-hide font-[Maison Neue Book]">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === currentImageIndex ? 'border-green-600 ring-4 ring-green-100' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="miniature" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details Section */}
        <div className="w-full lg:w-1/2 p-4 sm:p-8 lg:p-12 overflow-y-auto bg-white flex flex-col font-[Maison Neue]">
          <div className="flex-1">
            {/* Header: Rating & Stock */}
            <div className="flex items-center justify-between mb-3 sm:mb-4 font-[Maison Neue Book]">
              {avgRating ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full">
                  <div className="flex items-center gap-0.5">
                    {avgRating && (
                      <div className="flex items-center gap-1 mb-4">
                        <div className="flex items-center gap-0.5">
                          <span className="text-[12px] font-bold text-gray-400  mr-2">
                            {avgRating.toFixed(1)}
                          </span>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[12px] font-bold text-gray-400  ml-2">
                          ({product.ratings.length} )
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-3 py-1 rounded-full text-xs">
                  <Star size={14} />
                  <span>{t('noReviews')}</span>
                </div>
              )}


            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#556822] mb-2 leading-tight font-[Agrandir]">
              {productName}
            </h1>

            <p className="text-2xl sm:text-3xl font-black text-[#E10c69] mb-4 sm:mb-6 font-[Erica One]">
              {productPrice.toFixed(2)} €
              <span className="text-sm text-gray-400 font-medium ml-2 uppercase font-[Maison Neue Book]">{t('perUnit')}</span>
            </p>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="space-y-2 text-gray-600 leading-relaxed italic border-l-4 border-gray-100 pl-4 font-[Maison Neue Book]">
                {descriptionLines.map((line, index) => (
                  <p key={`${line}-${index}`} className="m-0">
                    {line}
                  </p>
                ))}
              </div>

              {showStockAlert && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold animate-pulse">
                  <AlertCircle size={18} />
                  <span>{t('stockMax')}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase mb-1 font-[Maison Neue Mono]">{t('quantity')}</span>
                  <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 sm:p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30 font-[Maison Neue Mono]"
                      disabled={quantity <= 1}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-10 sm:w-12 text-center font-bold text-base sm:text-lg font-[Agrandir]">{quantity}</span>
                    <button
                      onClick={handleIncrement}
                      className="p-2 sm:p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all font-[Maison Neue Mono]"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-400 uppercase mb-1 block font-[Maison Neue Mono]">{t('totalPrice')}</span>
                  <span className="text-2xl sm:text-3xl font-black text-[#E10c69] font-[Erica One]">{totalPrice.toFixed(2)} €</span>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={availableStock === 0 || addedToCart}
                  className={`detail-primary-action flex items-center justify-center gap-3 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 group font-[Agrandir] ${
                    availableStock === 0
                      ? 'bg-gray-200 text-white cursor-not-allowed'
                      : addedToCart
                      ? 'bg-[#556822] text-white'
                      : 'bg-[#F2F8EE] text-[#556822] hover:text-white hover:bg-[#556822] hover:shadow-xl hover:shadow-[#556822]/30'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t('addedToCart')}
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={20} className="group-hover:translate-x-1 transition-transform" />
                      {availableStock === 0 ? t('outOfStock') : t('addToCart')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => onToggleFavorite?.(product)}
                  className={`flex-1 flex items-center justify-center border-2 rounded-2xl transition-all duration-300 ${
                    isFavorite
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-gray-100 text-gray-400 hover:border-red-100 hover:bg-red-50 hover:text-red-500'
                  }`}
                >
                  <Heart size={24} className={isFavorite ? 'fill-white' : ''} />
                </button>
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}