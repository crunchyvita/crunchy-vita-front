'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Plus, Minus, 
  ShoppingCart, Heart, ShieldCheck, Truck, 
  Info, Star 
} from 'lucide-react';

export default function ProductDetailModal({ 
  product, 
  isOpen, 
  onClose, 
  getProductImageUrl, 
  getProductPrice, 
  getAvailableStock 
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

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
  }, [product]);

  if (!isOpen || !product) return null;

  // Handlers
  const handleAddToCart = () => {
    console.log('Cart:', product.name, quantity);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 transition-opacity duration-300">
      <div 
        className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col lg:flex-row transition-all duration-500 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-50 bg-white/80 backdrop-blur-sm rounded-full p-2.5 text-gray-900 shadow-md hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left: Image Gallery Section */}
        <div className="w-full lg:w-1/2 bg-gray-50 p-6 flex flex-col">
          <div className="relative flex-1 group aspect-square rounded-2xl overflow-hidden bg-white shadow-inner">
            {productImages.length > 0 ? (
              <>
                <img
                  src={productImages[currentImageIndex]}
                  alt={product.name}
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
                <p className="mt-2 text-sm font-medium">No images available</p>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto py-2 scrollbar-hide">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex ? 'border-green-600 ring-4 ring-green-100' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="thumb" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details Section */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 overflow-y-auto bg-white flex flex-col">
          <div className="flex-1">
            {/* Header: Rating & Stock */}
            <div className="flex items-center justify-between mb-4">
              {avgRating ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < Math.round(avgRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-3 py-1 rounded-full text-xs">
                  <Star size={14} />
                  <span>No reviews yet</span>
                </div>
              )}
              
    
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
              {product.name}
            </h1>
            
            <p className="text-3xl font-black text-green-700 mb-6">
              ${productPrice.toFixed(2)}
              <span className="text-sm text-gray-400 font-medium ml-2 uppercase">per unit</span>
            </p>

            <div className="space-y-4 mb-8">
              <p className="text-gray-600 leading-relaxed italic border-l-4 border-gray-100 pl-4">
                {product.description || "Indulge in our premium selection. This product is crafted with care to ensure the highest quality for our customers."}
              </p>
              
             
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-auto pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase mb-1">Quantity</span>
                <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30"
                    disabled={quantity <= 1}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30"
                    disabled={quantity >= availableStock}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-xs font-bold text-gray-400 uppercase mb-1 block">Total Price</span>
                <span className="text-3xl font-black text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0}
                className="flex-[3] flex items-center justify-center gap-3 py-4 bg-green-900 text-white rounded-2xl font-bold text-lg hover:bg-green-700 hover:shadow-xl hover:shadow-green-200 transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed group"
              >
                <ShoppingCart size={20} className="group-hover:translate-x-1 transition-transform" />
                {availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
              <button className="flex-1 flex items-center justify-center border-2 border-gray-100 rounded-2xl hover:border-red-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-300">
                <Heart size={24} />
              </button>
            </div>
            
           
          </div>
        </div>
      </div>
    </div>
  );
}