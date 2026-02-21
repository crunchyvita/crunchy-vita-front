// src/app/shop/[id]/page.jsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { motion } from 'framer-motion';
import {
  Star, Heart, ShoppingCart, Plus, Minus, Package, Send, MessageSquare,
  Trash2, Loader2, AlertTriangle, RefreshCw, User, Clock, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { reviewAPI } from '@/lib/api';
import { usePackStorage } from '@/hooks/usePackStorage';
import { useCart } from '@/hooks/useCart';
import Footer from '@/components/footer';
import Header from '@/components/header';
import PromoBadge from '@/components/PromoBadge';
import AddedToCartModal from '@/components/AddedToCartModal';
import { useTranslations, useLocale } from 'next-intl';
import { getTranslatedProduct } from '@/lib/productTranslations';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('ProductDetail');
  const locale = useLocale();
  const { addToCart } = useCart();
  const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const apiBaseUrl = rawApiBaseUrl.replace(/\/$/, '').endsWith('/api')
    ? rawApiBaseUrl.replace(/\/$/, '')
    : `${rawApiBaseUrl.replace(/\/$/, '')}/api`;

  const [searchParams, setSearchParams] = useState({});
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const addCooldownUntilRef = useRef(0);
  const translatedProduct = getTranslatedProduct(product, locale);
  const productName = translatedProduct.name;
  const productDescription = translatedProduct.description;

  // ✅ IMPORTANT: error doit être remis à null avant chaque fetch
  const [error, setError] = useState(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartModalProduct, setCartModalProduct] = useState(null);
  const [cartModalQuantity, setCartModalQuantity] = useState(1);

  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '', isAnonymous: false });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const [commentsToShow, setCommentsToShow] = useState(3);

  const [approvingComment, setApprovingComment] = useState(false);
  const [rejectingComment, setRejectingComment] = useState(false);
  const [moderateError, setModerateError] = useState('');
  const [moderatingCommentId, setModeratingCommentId] = useState(null);

  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const { savePackConfig, loadPackConfig, isStorageReady } = usePackStorage(searchParams.packageId);

  // Parse URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      setSearchParams({
        review: sp.get('review'),
        moderateMode: sp.get('moderateMode') === 'true',
        packageId: sp.get('packageId'),
      });

      console.log('URL Params:', {
        review: sp.get('review'),
        moderateMode: sp.get('moderateMode'),
        packageId: sp.get('packageId'),
      });
    }
  }, []);

  // ✅ IMPORTANT: ne fetch pas si params.id n’est pas prêt
  useEffect(() => {
    if (!params?.id) return;
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  useEffect(() => {
    if (!user || !product?._id) {
      setIsFavorite(false);
      return;
    }

    const loadFavorites = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${apiBaseUrl}/users/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (!response.ok) return;

        const favorites = result.data || [];
        const isFav = favorites.some((fav) => fav._id === product._id);
        setIsFavorite(isFav);
      } catch (err) {
        console.error('Failed to load favorites:', err);
      }
    };

    loadFavorites();
  }, [user, product?._id]);

  // Auto-scroll to moderated comment when in moderation mode
  useEffect(() => {
    if (searchParams.moderateMode && searchParams.review) {
      setTimeout(() => {
        const element = document.getElementById(`comment-${searchParams.review}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.log('Scrolled to comment:', searchParams.review);
        }
      }, 500);
    }
  }, [searchParams, product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);       // ✅ FIX: reset error sinon page reste bloquée
      // setProduct(null);   // (optionnel) si tu veux éviter l’ancien produit pendant loading

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await fetch(`/api/products/${params.id}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log('[Product Detail] API Response Status:', response.status);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('[Product Detail] API error body:', text?.substring?.(0, 300));
        throw new Error(`${t('errors.productNotFound')} (${response.status})`);
      }

      let rawData = await response.json();

      
      // ✅ FIX: Unwrap {success: true, data: {...}} format from backend
      let data = rawData;
      if (rawData?.success && rawData?.data) {
        console.log('[Product Detail] Unwrapping {success, data} wrapper');
        data = rawData.data;
      }
      

      
      if (!data || !data._id) {
        console.error('[Product Detail] ❌ Invalid data structure - missing _id!');
        throw new Error(t('errors.invalidProductData'));
      }

      console.log('[Product Detail] ✅ Setting product with valid data');
      
      // Log nested structures
      if (data.pricingHistory && data.pricingHistory.length > 0) {
        console.log('[Product Detail] pricingHistory array length:', data.pricingHistory.length);
        console.log('[Product Detail] pricingHistory[0]:', data.pricingHistory[0]);
        console.log('[Product Detail] pricingHistory[last]:', data.pricingHistory[data.pricingHistory.length - 1]);
        console.log('[Product Detail] Latest price value:', data.pricingHistory[data.pricingHistory.length - 1]?.price);
      }
      if (data.stock) {
        console.log('[Product Detail] stock.availableQuantity:', data.stock.availableQuantity);
        console.log('[Product Detail] stock.quantity:', data.stock.quantity);
      }
      if (data.media) {
        console.log('[Product Detail] media array length:', data.media?.length);
        console.log('[Product Detail] media[0]:', data.media?.[0]);
      }
      
      setProduct(data);
    } catch (err) {
      console.error('[Product Detail] Error:', err);
      setProduct(null); // ✅ propre
      setError(err.message || t('errors.productNotFound'));
    } finally {
      setLoading(false);
    }
  };

  const productImages = useMemo(() => {
    if (!product) return [];
    const images = [];

    if (product.media && product.media.length > 0) {
      product.media.forEach((mediaItem) => {
        const url = mediaItem?.url || mediaItem;
        if (url && url !== 'undefined') images.push(url);
      });
    }

    if (images.length === 0) {
      const imageFields = ['imageUrl', 'productImage', 'image'];
      for (const field of imageFields) {
        if (product[field] && product[field] !== 'undefined') {
          images.push(product[field]);
          break;
        }
      }
    }

    return images;
  }, [product]);

  const productPrice = useMemo(() => {
    if (!product) return 0;
    if (product.pricingHistory && product.pricingHistory.length > 0) {
      const latestPrice = product.pricingHistory[product.pricingHistory.length - 1]?.price;
      console.log('[useMemo productPrice] pricingHistory exists, latest price:', latestPrice);
      if (latestPrice !== undefined && latestPrice !== null) return Number(latestPrice);
    }
    if (product.price !== undefined && product.price !== null) {
      console.log('[useMemo productPrice] Using direct price:', product.price);
      return Number(product.price);
    }
    console.log('[useMemo productPrice] No price found, returning 0');
    return 0;
  }, [product]);

  const availableStock = useMemo(() => {
    if (!product || !product.stock) {
      console.log('[useMemo availableStock] No product or stock, returning 0');
      return 0;
    }
    const stock = product.stock;
    console.log('[useMemo availableStock] stock object:', stock);
    if (stock.availableQuantity !== undefined && stock.availableQuantity !== null) {
      console.log('[useMemo availableStock] Using availableQuantity:', stock.availableQuantity);
      return stock.availableQuantity;
    }
    if (stock.quantity !== undefined) {
      const calculated = (stock.quantity || 0) - (stock.reservedQuantity || 0);
      console.log('[useMemo availableStock] Calculated:', calculated);
      return calculated;
    }
    console.log('[useMemo availableStock] No valid stock data, returning 0');
    return 0;
  }, [product]);

  const incrementQuantity = () => {
    if (quantity < availableStock) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleAddToCart = async () => {
    if (searchParams.packageId) {
      if (!isStorageReady || !product?._id) {
        router.push(`/shop/packages/${searchParams.packageId}`);
        return;
      }

      const existingConfig = loadPackConfig() || {};
      const existingSelected = Array.isArray(existingConfig.selectedProducts)
        ? existingConfig.selectedProducts
        : [];
      const selectedSet = new Set(existingSelected);
      selectedSet.add(product._id);

      const nextQuantities = {
        ...(existingConfig.quantities || {}),
        [product._id]: quantity,
      };

      savePackConfig({
        selectedProducts: Array.from(selectedSet),
        quantities: nextQuantities,
        packageData: existingConfig.packageData,
      });

      router.push(`/shop/packages/${searchParams.packageId}`);
      return;
    }
    
    // Add to real cart system
    if (!product || !product._id) return;

    const now = Date.now();
    if (now < addCooldownUntilRef.current) return;
    addCooldownUntilRef.current = now + 1000;
    
    const ok = await addToCart({
      ...product,
      price: productPrice
    }, quantity);

    if (!ok) {
      setShowStockAlert(true);
      setTimeout(() => setShowStockAlert(false), 3000);
      return;
    }
    
    setAddedToCart(true);
    
    // Show cart modal instead of redirecting
    setCartModalProduct({
      ...product,
      name: productName,
      price: productPrice,
      image: productImages[0]
    });
    setCartModalQuantity(quantity);
    setShowCartModal(true);
    setQuantity(1);
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!product?._id) return;

    try {
      setFavoritesLoading(true);
      const token = localStorage.getItem('token');

      if (isFavorite) {
        const response = await fetch(`${apiBaseUrl}/users/favorites/${product._id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to remove favorite');
        setIsFavorite(false);
      } else {
        const response = await fetch(`${apiBaseUrl}/users/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product._id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to add favorite');
        setIsFavorite(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const getAllReviews = () => {
    if (!product) return [];
    const reviews = [];
    const processedUserIds = new Set();

    if (product.comments && product.comments.length > 0) {
      product.comments.forEach((comment) => {
        const userId = comment.userId?._id?.toString() || comment.userId?.toString();
        const matchingRating = product.ratings?.find(
          (rating) => (rating.userId?._id?.toString() || rating.userId?.toString()) === userId
        );

        reviews.push({
          type: 'comment',
          id: comment._id,
          userId: comment.userId,
          content: comment.content,
          rating: matchingRating?.rating || null,
          isAnonymous: comment.isAnonymous || false,
          status: comment.status || 'approved',
          createdAt: comment.createdAt,
        });

        if (userId) processedUserIds.add(userId);
      });
    }

    if (product.ratings && product.ratings.length > 0) {
      product.ratings.forEach((rating) => {
        const userId = rating.userId?._id?.toString() || rating.userId?.toString();
        if (!processedUserIds.has(userId)) {
          reviews.push({
            type: 'rating',
            id: rating._id,
            userId: rating.userId,
            content: null,
            rating: rating.rating,
            createdAt: rating.createdAt,
          });
        }
      });
    }

    return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const getAverageRating = () => {
    if (!product || !product.ratings || product.ratings.length === 0) return 0;
    const sum = product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / product.ratings.length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setReviewError(t('errors.loginRequired'));
        return;
      }

      const { rating, comment, isAnonymous } = reviewForm;

      if (!rating && (!comment || !comment.trim())) {
        setReviewError(t('errors.reviewRequired'));
        return;
      }

      if (rating && (rating < 1 || rating > 5)) {
        setReviewError(t('errors.ratingRange'));
        return;
      }

      const data = await reviewAPI.create(params.id, {
        rating: rating || undefined,
        content: comment?.trim() || undefined,
        isAnonymous,
        displayName: null,
      });

      if (!data || data.error) {
        throw new Error(data?.message || t('errors.submitFailed'));
      }

      const result = data.data || data;

      setReviewForm({ rating: 0, comment: '', isAnonymous: false });

      setProduct((prev) => {
        if (!prev) return prev;

        let updatedRatings = prev.ratings || [];
        if (result?.rating) {
          const existingIdx = updatedRatings.findIndex(
            r => (r.userId?._id?.toString?.() || r.userId?.toString?.()) === user?.id?.toString()
          );
          const ratingEntry = {
            _id: result.rating._id,
            userId: user?.id || result.rating.userId,
            rating: result.rating.rating,
            createdAt: result.rating.createdAt,
          };
          if (existingIdx !== -1) {
            updatedRatings = [...updatedRatings];
            updatedRatings[existingIdx] = ratingEntry;
          } else {
            updatedRatings = [...updatedRatings, ratingEntry];
          }
        }

        let updatedComments = prev.comments || [];
        if (result?.comment) {
          const newComment = {
            _id: result.comment._id,
            userId: result.comment.isAnonymous
              ? { _id: user?.id, name: 'Anonymous' }
              : { _id: user?.id, name: user?.name, photo: user?.photo },
            content: result.comment.content,
            isAnonymous: result.comment.isAnonymous,
            displayName: result.comment.displayName,
            status: result.comment.status || 'pending',
            createdAt: result.comment.createdAt,
          };
          updatedComments = [newComment, ...updatedComments];
        }

        return { ...prev, ratings: updatedRatings, comments: updatedComments };
      });

      setReviewSuccess(t('success.submitted'));
      setTimeout(() => setReviewSuccess(''), 5000);
    } catch (err) {
      setReviewError(err.message || t('errors.submitFailed'));
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setDeleteAlertOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    const commentIdToDelete = commentToDelete;
    const originalProduct = product ? { ...product } : null;

    setProduct(prevProduct => ({
      ...prevProduct,
      comments: (prevProduct?.comments || []).filter(c => c._id !== commentIdToDelete),
    }));

    setDeleteAlertOpen(false);
    setCommentToDelete(null);
    setDeletingCommentId(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        if (originalProduct) setProduct(originalProduct);
        return;
      }

      const response = await fetch(`/api/products/${params.id}/reviews?commentId=${commentIdToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (originalProduct) setProduct(originalProduct);
        console.error('Failed to delete comment:', data.error || data.message);
      }
    } catch (err) {
      if (originalProduct) setProduct(originalProduct);
      console.error('Error deleting comment:', err);
    }
  };

  const handleSliderMove = (e) => {
    if (!isDragging) return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleSliderStart = () => setIsDragging(true);
  const handleSliderEnd = () => setIsDragging(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-10 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || t('errors.productNotFound')}</p>
          <button
            onClick={() => router.push('/shop')}
            className="px-6 py-3 bg-[#469165] text-white rounded-lg hover:bg-[#3a7a4a] transition-colors"
          >
            {t('buttons.backToShop')}
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = productPrice * quantity;

  // ✅ FIX: éviter crash si pas assez d’images
  const freshImg = productImages?.[2] ;
  const lyoImg = productImages?.[3] ;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <PromoBadge />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 font-maison-neue-book">
          <button onClick={() => router.push('/shop')} className="hover:text-[#469165] font-maison-neue-bold">
            {t('breadcrumb.shop')}
          </button>
          <span>/</span>
          <button onClick={() => router.push('/shop')} className="hover:text-[#469165] font-maison-neue-bold">
            {t('breadcrumb.allProducts')}
          </button>
          <span>/</span>
          <span className="text-gray-900 font-maison-neue-bold">{productName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              {productImages.length > 0 ? (
                <img
                  src={productImages[selectedImageIndex]}
                  alt={productName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/placeholder.png';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImageIndex
                        ? 'border-[#469165] ring-2 ring-green-100'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img} alt={`${productName} - Image ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl font-[Agrandir] text-[#556822] mb-3">
                {productName}
              </h1>

              {(() => {
                const avgRating = getAverageRating();
                const ratingCount = product.ratings?.length || 0;

                if (ratingCount === 0) return null;

                return (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600 font-maison-neue-book">
                      {avgRating.toFixed(1)}
                    </span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.round(avgRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 font-maison-nouvelle-book">
                      ({ratingCount})
                    </span>
                  </div>
                );
              })()}
            </div>

            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-[Agrandir] font-bold text-[#E10c69]">
                  €{productPrice.toFixed(2)}
                </span>
                {product.originalPrice && Number(product.originalPrice) > productPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    €{Number(product.originalPrice).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-gray-600 leading-relaxed font-[maison-neue-book]">
                {productDescription || t('descriptionFallback')}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-maison-neue-bold text-gray-900 mb-3">{t('quantity.label')}</h3>
              {showStockAlert && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold animate-pulse">
                  <AlertCircle size={18} />
                  <span>{t('quantity.maxReached')}</span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="px-6 py-3 font-maison-neue-bold text-lg border-x-2 border-gray-300 min-w-15 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (quantity >= availableStock) {
                        setShowStockAlert(true);
                        setTimeout(() => setShowStockAlert(false), 3000);
                      } else {
                        setQuantity(quantity + 1);
                      }
                    }}
                    className="p-3 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="text-lg">
                  <span className="text-gray-600 font-[maison-neue-book]">{t('total.label')} </span>
                  <span className="font-[agrandir] font-bold text-[#E10c69] text-2xl">
                    €{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0 || addedToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg font-agrandir font-semibold transition-colors ${
                  availableStock === 0
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : addedToCart
                    ? 'bg-[#556822] text-white'
                    : 'bg-[#F2F8EE] text-[#556822] hover:text-white hover:bg-[#556822]'
                }`}
              >
                {addedToCart ? (
                  <>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {t('messages.addedToCart')}
                  </>
                ) : searchParams.packageId ? (
                  <>
                    <Package className="h-5 w-5" />
                    {availableStock === 0 ? t('buttons.outOfStock') : t('buttons.addToPack')}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    {availableStock === 0 ? t('buttons.outOfStock') : t('buttons.addToCart')}
                  </>
                )}
              </button>

              {!searchParams.packageId && (
                <button
                  onClick={handleAddToWishlist}
                  disabled={favoritesLoading}
                  className={`px-6 py-4 border-2 rounded-lg font-agrandir font-semibold transition-colors ${
                    isFavorite
                      ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                      : 'border-red-500 text-red-500 hover:bg-red-50'
                  } ${favoritesLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  title={isFavorite ? 'Retirer des favoris' : t('buttons.addToWishlist')}
                >
                  <Heart className={`h-6 w-6 ${isFavorite ? 'fill-white' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Image Comparison Section */}
        {freshImg && lyoImg && (
          <div className="mt-16 border-t border-gray-200 pt-16">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-agrandir font-bold text-[#556822] mb-2">
                {t('comparison.title')}
              </h2>
              <p className="text-gray-600 font-maison-neue-book">
                {t('comparison.subtitle')}
              </p>
            </div>

            <div
              className="relative w-full max-w-5xl mx-auto h-125 rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize select-none"
              onMouseMove={handleSliderMove}
              onMouseDown={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onMouseLeave={handleSliderEnd}
              onTouchMove={handleSliderMove}
              onTouchStart={handleSliderStart}
              onTouchEnd={handleSliderEnd}
            >
              {/* Fresh Fruit Image */}
              <div className="absolute inset-0">
                <img src={freshImg} alt={t('comparison.freshAlt')} className="w-full h-full object-cover" draggable="false" />
                <div className="absolute top-6 left-6 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border-2 border-white/40">
                  <span className="font-agrandir font-bold text-white text-lg drop-shadow-lg">{t('comparison.freshLabel')}</span>
                </div>
              </div>

              {/* Lyophilized Image clipped */}
              <div
                className={`absolute inset-0 ${!isDragging ? 'transition-all duration-150 ease-out' : ''}`}
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <img src={lyoImg} alt={t('comparison.lyoAlt')} className="w-full h-full object-cover" draggable="false" />
                <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border-2 border-white/40">
                  <span className="font-agrandir font-bold text-white text-lg drop-shadow-lg">{t('comparison.lyoLabel')}</span>
                </div>
              </div>

              {/* Slider handle */}
              <div
                className={`absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl ${!isDragging ? 'transition-all duration-150 ease-out' : ''}`}
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-[#556822]">
                  <svg className="w-6 h-6 text-[#556822]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
                  </svg>
                </div>
              </div>

              {sliderPosition === 50 && !isDragging && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg animate-pulse">
                  <span className="font-maison-neue-bold text-white text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                    {t('comparison.slide')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Section (inchangé à part les fonctions déjà présentes) */}
        <div className="mt-16 border-t border-gray-200 pt-8">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-agrandir font-bold text-gray-900">{t('reviews.title')}</h2>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-maison-neue-bold">
              {product.comments?.length || 0}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-8">
            {user && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit lg:sticky lg:top-20">
                <h3 className="text-lg font-agrandir font-bold text-gray-900 mb-4">{t('reviews.writeTitle')}</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= reviewForm.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder={t('reviews.placeholder')}
                      rows="5"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#064E3B] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <User className={`h-5 w-5 transition-colors ${reviewForm.isAnonymous ? 'text-gray-400' : 'text-[#064E3B]'}`} />
                      <div>
                        <label htmlFor="anonymous-toggle" className="text-sm font-maison-neue-bold text-gray-900 cursor-pointer block">
                          {t('reviews.anonymous.label')}
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5 font-maison-neue-book">
                          {reviewForm.isAnonymous ? t('reviews.anonymous.hidden') : t('reviews.anonymous.visible')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="anonymous-toggle"
                      role="switch"
                      aria-checked={reviewForm.isAnonymous}
                      onClick={() => setReviewForm({ ...reviewForm, isAnonymous: !reviewForm.isAnonymous })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:ring-offset-2 ${
                        reviewForm.isAnonymous ? 'bg-[#556822]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          reviewForm.isAnonymous ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {reviewError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {reviewError}
                    </div>
                  )}

                  {reviewSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                      {reviewSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReview || (!reviewForm.rating && !reviewForm.comment.trim())}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-agrandir font-bold text-[#556822] hover:text-white transition-colors ${
                      submittingReview || (!reviewForm.rating && !reviewForm.comment.trim())
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-[#F2F8EE] hover:bg-[#556822]'
                    }`}
                  >
                    {submittingReview ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{t('reviews.submitting')}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{t('reviews.submit')}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Reviews list (inchangé) */}
            <div className={user ? '' : 'lg:col-span-2'}>
              {(() => {
                const allReviews = getAllReviews();
                const reviews = allReviews.filter((review) => {
                  if (!review.content || !review.content.trim()) return false;
                  const isOwnComment = user && review.userId?._id?.toString() === user.id?.toString();
                  const isApproved = review.status === 'approved' || !review.status;
                  return isOwnComment || isApproved;
                });

                const displayedReviews = reviews.slice(0, commentsToShow);
                const hasMoreReviews = reviews.length > commentsToShow;

                if (reviews.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-maison-neue-bold">{t('reviews.emptyTitle')}</p>
                      <p className="text-sm text-gray-500 mt-2 font-maison-neue-book">
                        {user ? t('reviews.emptySubtitleLoggedIn') : t('reviews.emptySubtitleLoggedOut')}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {displayedReviews.map((review) => {
                      const userName = review.isAnonymous
                        ? t('reviews.anonymousName')
                        : (review.userId?.name || t('reviews.anonymousName'));
                      const isOwnComment = user && review.userId?._id?.toString() === user.id?.toString();

                      return (
                        <div
                          key={review.id}
                          id={`comment-${review.id}`}
                          className="bg-white border border-slate-200 hover:bg-slate-50 transition-all rounded-xl overflow-hidden"
                        >
                          <div className="flex gap-4 p-6 group">
                            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white shrink-0 bg-[#558822]">
                              {review.userId?.photo && !review.isAnonymous ? (
                                <img
                                  src={review.userId.photo}
                                  alt={userName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <User size={24} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <p className="text-base font-[Agrandir] text-slate-900">{userName}</p>
                                  {review.rating && (
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {isOwnComment && (
                                  <button
                                    onClick={() => handleDeleteComment(review.id)}
                                    disabled={deletingCommentId === review.id}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                                  >
                                    {deletingCommentId === review.id ? (
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-5 w-5" />
                                    )}
                                  </button>
                                )}
                              </div>

                              <p className="text-base text-slate-700 mb-3 leading-relaxed font-[maison-neue-book]">
                                {review.content}
                              </p>

                              {review.createdAt && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 font-maison-neue-book">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{formatDate(review.createdAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {hasMoreReviews && (
                      <div className="pt-4">
                        <button
                          onClick={() => setCommentsToShow((prev) => prev + 3)}
                          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-maison-neue-bold text-sm transition-colors group"
                        >
                          <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                          {t('reviews.loadMore')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {deleteAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-agrandir font-bold text-gray-900 mb-1">{t('delete.title')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-maison-neue-book">
                {t('delete.description')}
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => {
                  setDeleteAlertOpen(false);
                  setCommentToDelete(null);
                }}
                className="flex-1 px-4 py-4 text-sm font-maison-neue-bold text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
              >
                {t('delete.cancel')}
              </button>
              <button
                onClick={confirmDeleteComment}
                disabled={deletingCommentId === commentToDelete}
                className="flex-1 px-4 py-4 text-sm font-agrandir font-black text-red-600 hover:bg-red-50 transition-colors tracking-tight disabled:opacity-50"
              >
                {deletingCommentId === commentToDelete ? t('delete.deleting') : t('delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Added to Cart Modal */}
      <AddedToCartModal
        isOpen={showCartModal}
        onClose={() => {
          setShowCartModal(false);
          setCartModalProduct(null);
          setAddedToCart(false);
        }}
        product={cartModalProduct}
        quantity={cartModalQuantity}
      />
    </div>
  );
}
