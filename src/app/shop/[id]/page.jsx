'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Heart, ShoppingCart, Plus, Minus, ChevronLeft, Package, Shield, Truck, Send, MessageSquare, Trash2, Loader2, AlertTriangle, X, RefreshCw, User, Clock, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { productAPI, reviewAPI } from '@/lib/api';
import Footer from '@/components/footer';
import Header from '@/components/header';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useState({});
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '', isAnonymous: false });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [commentsToShow, setCommentsToShow] = useState(3);
  const [moderatingCommentId, setModeratingCommentId] = useState(null);
  const [approvingComment, setApprovingComment] = useState(false);
  const [rejectingComment, setRejectingComment] = useState(false);
  const [moderateError, setModerateError] = useState('');

  // Parse URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSearchParams({
        review: params.get('review'),
        moderateMode: params.get('moderateMode') === 'true'
      });
      // Debug logging
      console.log('URL Params:', {
        review: params.get('review'),
        moderateMode: params.get('moderateMode')
      });
    }
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`/api/products/${params.id}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        throw new Error('Product not found');
      }

      const data = await response.json();
      
      console.log(`[Product ${params.id}] Received comments:`, data.comments?.length || 0, 'comments');
      if (data.comments) {
        console.log('Comment statuses:', data.comments.map(c => ({ id: c._id, status: c.status })));
      }
      
      // Process comment photos to construct full URLs for local uploads
      if (data.comments && data.comments.length > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        
        data.comments = data.comments.map(comment => {
          if (comment.userId?.photo && !comment.userId.photo.startsWith('http')) {
            return {
              ...comment,
              userId: {
                ...comment.userId,
                photo: `${cleanBaseUrl}${comment.userId.photo}`
              }
            };
          }
          return comment;
        });
      }
      
      setProduct(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductImages = () => {
    if (!product) return [];
    const images = [];
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    // Check media array for multiple images
    if (product.media && product.media.length > 0) {
      product.media.forEach((mediaItem) => {
        const url = mediaItem.url || mediaItem;
        if (url && url !== 'undefined') {
          const fullUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
          images.push(fullUrl);
        }
      });
    }

    // Fallback to single image fields
    if (images.length === 0) {
      const imageFields = ['imageUrl', 'productImage', 'image'];
      for (const field of imageFields) {
        if (product[field] && product[field] !== 'undefined') {
          const url = product[field];
          const fullUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
          images.push(fullUrl);
          break;
        }
      }
    }

    return images;
  };

  const getProductPrice = () => {
    if (!product) return 0;
    // Check pricingHistory first
    if (product.pricingHistory && product.pricingHistory.length > 0) {
      const latestPrice = product.pricingHistory[product.pricingHistory.length - 1]?.price;
      if (latestPrice !== undefined && latestPrice !== null) {
        return Number(latestPrice);
      }
    }
    // Fallback to direct price field
    if (product.price !== undefined && product.price !== null) {
      return Number(product.price);
    }
    return 0;
  };

  const getAvailableStock = () => {
    if (!product || !product.stock) return 0;
    const stock = product.stock;
    if (stock.availableQuantity !== undefined && stock.availableQuantity !== null) {
      return stock.availableQuantity;
    }
    if (stock.quantity !== undefined) {
      return (stock.quantity || 0) - (stock.reservedQuantity || 0);
    }
    return 0;
  };

  const incrementQuantity = () => {
    const availableStock = getAvailableStock();
    if (quantity < availableStock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {


  };

  const handleAddToWishlist = () => {
   
  };

  // Get all reviews (ratings and comments combined)
  const getAllReviews = () => {
    if (!product) return [];
    
    const reviews = [];
    const processedUserIds = new Set();

    // Process comments 
    if (product.comments && product.comments.length > 0) {
      product.comments.forEach((comment) => {
        const userId = comment.userId?._id?.toString() || comment.userId?.toString();
        
        // Find matching rating
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

    // Process ratings without comments
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

    // Sort by date (newest first)
    return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Calculate average rating
  const getAverageRating = () => {
    if (!product || !product.ratings || product.ratings.length === 0) return 0;
    const sum = product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / product.ratings.length;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setReviewError('Please login to submit a review');
        return;
      }

      const { rating, comment } = reviewForm;
      const isAnonymous = reviewForm.isAnonymous; 
      
   
      // Validate that at least one field is provided
      if (!rating && (!comment || !comment.trim())) {
        setReviewError('Please provide a rating or comment (or both)');
        return;
      }

      // Validate rating if provided
      if (rating && (rating < 1 || rating > 5)) {
        setReviewError('Rating must be between 1 and 5');
        return;
      }

      const data = await reviewAPI.create(params.id, {
        rating: rating || undefined,
        content: comment?.trim() || undefined,
        isAnonymous: isAnonymous,
        displayName: null
      });

      if (!data || data.error) {
        throw new Error(data?.message || 'Failed to submit review');
      }

      const result = data.data || data;

      // Reset form after successful submission
      setReviewForm({ rating: 0, comment: '', isAnonymous: false });

      // Optimistically update product state without refetching
      setProduct((prev) => {
        if (!prev) return prev;

        // Update or add rating if returned
        let updatedRatings = prev.ratings || [];
        if (result?.rating) {
          const existingIdx = updatedRatings.findIndex(r => (r.userId?._id?.toString?.() || r.userId?.toString?.()) === user?.id?.toString());
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

        // Add new comment if returned
        let updatedComments = prev.comments || [];
        if (result?.comment) {
          const newComment = {
            _id: result.comment._id,
            userId: result.comment.isAnonymous
              ? null
              : {
                  _id: user?.id,
                  name: user?.name,
                  photo: user?.photo,
                },
            content: result.comment.content,
            isAnonymous: result.comment.isAnonymous,
            displayName: result.comment.displayName,
            status: result.comment.status || 'pending',
            createdAt: result.comment.createdAt,
          };
          updatedComments = [newComment, ...updatedComments];
        }

        return {
          ...prev,
          ratings: updatedRatings,
          comments: updatedComments,
        };
      });


      
      // Show success message briefly then clear it
      setTimeout(() => setReviewSuccess(''), 5000);
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setDeleteAlertOpen(true);
  };

  // Admin: Approve pending comment
  const handleApproveComment = async (commentId) => {
    setApprovingComment(true);
    setModerateError('');
    try {
      await reviewAPI.approve(params.id, commentId);
      // Update local state to reflect approval
      setProduct(prev => ({
        ...prev,
        comments: prev.comments.map(c => 
          c._id === commentId ? { ...c, status: 'approved' } : c
        )
      }));
      setModeratingCommentId(null);
    } catch (err) {
      setModerateError(err.message || 'Erreur lors de l\'approbation');
      console.error('Error approving comment:', err);
    } finally {
      setApprovingComment(false);
    }
  };

  // Admin: Reject pending comment
  const handleRejectComment = async (commentId) => {
    setRejectingComment(true);
    setModerateError('');
    try {
      await reviewAPI.reject(params.id, commentId);
      // Remove comment from UI
      setProduct(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c._id !== commentId)
      }));
      setModeratingCommentId(null);
    } catch (err) {
      setModerateError(err.message || 'Erreur lors du rejet');
      console.error('Error rejecting comment:', err);
    } finally {
      setRejectingComment(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    
    const commentIdToDelete = commentToDelete;
    
    // Store original state for potential rollback
    const originalProduct = { ...product };
    
    // Optimistic update: Remove comment immediately from UI
    setProduct(prevProduct => ({
      ...prevProduct,
      comments: prevProduct.comments.filter(c => c._id !== commentIdToDelete)
    }));
    
    // Close modal and reset state immediately
    setDeleteAlertOpen(false);
    setCommentToDelete(null);
    setDeletingCommentId(null);
    
    // Make API call in background
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Rollback if no token
        setProduct(originalProduct);
        return;
      }

      const response = await fetch(`/api/products/${params.id}/reviews?commentId=${commentIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Rollback on error
        setProduct(originalProduct);
        console.error('Failed to delete comment:', data.error || data.message);
      }
    } catch (err) {
      // Rollback on error
      setProduct(originalProduct);
      console.error('Error deleting comment:', err);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#469165] mb-4"></div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
    );
  }

  if (error || !product) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 text-xl mb-4">{error || 'Product not found'}</p>
            <button
              onClick={() => router.push('/shop')}
              className="px-6 py-3 bg-[#469165] text-white rounded-lg hover:bg-[#3a7a4a] transition-colors"
            >
              Back to Shop
            </button>
          </div>
        </div>
    );
  }

  const productImages = getProductImages();
  const productPrice = getProductPrice();
  const availableStock = getAvailableStock();
  const totalPrice = productPrice * quantity;

  return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
            <button onClick={() => router.push('/shop')} className="hover:text-[#469165]">
              Shop
            </button>
            <span>/</span>
            <button onClick={() => router.push('/shop')} className="hover:text-[#469165]">
              All Products
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
                {productImages.length > 0 ? (
                  <img
                    src={productImages[selectedImageIndex]}
                    alt={product.name}
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

              {/* Thumbnail Images */}
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
                      <img
                        src={img}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  {product.name}
                </h1>
                
                {/* Rating */}
                {(() => {
                  const avgRating = getAverageRating();
                  const ratingCount = product.ratings?.length || 0;
                  
                  return (
                    <div className="flex items-center gap-2 mb-4">
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
                      <span className="text-sm text-gray-600">
                        {avgRating > 0 ? `${avgRating.toFixed(1)}` : 'No ratings yet'} ({ratingCount} {ratingCount === 1 ? 'Rating' : 'Ratings'})
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Price */}
              <div className="border-t border-b border-gray-200 py-4">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    ${productPrice.toFixed(2)}
                  </span>
                  {product.originalPrice && Number(product.originalPrice) > productPrice && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        ${Number(product.originalPrice).toFixed(2)}
                      </span>
                     
                    </>
                  )}
                </div>
           
              </div>

           

              {/* Description */}
              <div>
                <p className="text-gray-600 leading-relaxed">
                  {product.description || 'No description available.'}
                </p>
              </div>

       

              {/* Quantity Selector */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quantity</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-300 rounded-lg">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="px-6 py-3 font-semibold text-lg border-x-2 border-gray-300 min-w-15 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= availableStock}
                      className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="text-lg">
                    <span className="text-gray-600">Total: </span>
                    <span className="font-bold text-gray-900 text-2xl">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={availableStock === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-white transition-colors ${
                    availableStock === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#064E3B] hover:bg-[#3a7a4a]'
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {availableStock === 0 ? 'Out of Stock' : 'Add to cart'}
                </button>
                <button
                  onClick={handleAddToWishlist}
                  className="px-6 py-4 border-2 border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                  title="Add to wishlist"
                >
                  <Heart className="h-6 w-6" />
                </button>
              </div>

            
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-16 border-t border-gray-200 pt-8">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                {product.comments?.length || 0}
              </span>
            </div>

            {/* 2-Column Layout: Form on Left, Reviews on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-8">
              
              {/* Left Column: Review Form */}
              {user && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit lg:sticky lg:top-20">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Rating Selection */}
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

                    {/* Comment Input */}
                    <div>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        placeholder="What did you think about the quality?"
                        rows="5"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#064E3B] focus:outline-none resize-none"
                      />
                    </div>

                    {/* Anonymous Option */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <User className={`h-5 w-5 transition-colors ${reviewForm.isAnonymous ? 'text-gray-400' : 'text-[#064E3B]'}`} />
                        <div>
                          <label htmlFor="anonymous-toggle" className="text-sm font-semibold text-gray-900 cursor-pointer block">
                            Post as Anonymous
                          </label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {reviewForm.isAnonymous ? 'Your name will be hidden' : 'Your name will be visible'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        id="anonymous-toggle"
                        role="switch"
                        aria-checked={reviewForm.isAnonymous}
                        onClick={() => setReviewForm({ ...reviewForm, isAnonymous: !reviewForm.isAnonymous })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:ring-offset-2 ${
                          reviewForm.isAnonymous ? 'bg-[#064E3B]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            reviewForm.isAnonymous ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Error Message */}
                    {reviewError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {reviewError}
                      </div>
                    )}

                    {/* Success Message */}
                    {reviewSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                        {reviewSuccess}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submittingReview || (!reviewForm.rating && !reviewForm.comment.trim())}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-colors ${
                        submittingReview || (!reviewForm.rating && !reviewForm.comment.trim())
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-[#064E3B] hover:bg-[#3a7a4a]'
                      }`}
                    >
                      {submittingReview ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Post Review</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Right Column: Reviews List */}
              <div className={user ? '' : 'lg:col-span-2'}>
                {/* Moderation Mode Banner */}
                {searchParams.moderateMode && user?.role === 'ADMIN' && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      Mode modération activé - Cliquez sur un commentaire en attente pour l'approuver ou le rejeter
                    </span>
                  </div>
                )}

                {(() => {
              const allReviews = getAllReviews();
              // Filter to show only reviews with comments
              const reviews = allReviews.filter(review => review.content && review.content.trim());
              const displayedReviews = reviews.slice(0, commentsToShow);
              const hasMoreReviews = reviews.length > commentsToShow;
              
              if (reviews.length === 0) {
                return (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No reviews yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {user ? 'Be the first to review this product!' : 'Login to leave a review'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {displayedReviews.map((review) => {
                    const userName = review.isAnonymous ? 'Anonymous' : (review.userId?.name || 'Anonymous');
                    const isOwnComment = user && review.userId?._id?.toString() === user.id?.toString();
                    const isPending = review.status === 'pending';
                    const isBeingModerated = searchParams.review === review.id?.toString() && searchParams.moderateMode;
                    
                    return (
                      <div 
                        key={review.id} 
                        id={`comment-${review.id}`}
                        className={`bg-white border transition-all rounded-lg overflow-hidden ${
                          isBeingModerated
                            ? 'border-2 border-blue-500 ring-4 ring-blue-100 shadow-lg'
                            : 'border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex gap-3 p-4 group">
                          {/* User Avatar */}
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white shrink-0 bg-[#064E3B]">
                            {review.userId?.photo && !review.isAnonymous ? (
                              <img
                                src={review.userId.photo}
                                alt={userName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <User 
                              size={20} 
                              style={{ display: (review.userId?.photo && !review.isAnonymous) ? 'none' : 'block' }}
                            />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            {/* Name and actions */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-bold text-slate-900">{userName}</p>
                              {isOwnComment && (
                                <button
                                  onClick={() => handleDeleteComment(review.id)}
                                  disabled={deletingCommentId === review.id}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                                  title={isPending ? "Delete your pending review" : "Delete your review"}
                                >
                                  {deletingCommentId === review.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                            
                            {/* Comment text */}
                            <p className="text-xs text-slate-500 mb-1.5">
                              {review.content}
                            </p>
                            
                            {/* Rating badge */}
                            {review.rating && (
                              <div className="flex items-center gap-1 w-fit mb-1.5">
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'fill-gray-300 text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            


                            {/* Status badges for admin */}
                            {user?.role === 'ADMIN' && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ring-1 ring-inset bg-yellow-50 text-yellow-700 ring-yellow-600/20">
                                    Pending
                                  </span>
                                )}
                                {review.status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ring-1 ring-inset bg-orange-50 text-orange-700 ring-orange-600/20">
                                    Rejected
                                  </span>
                                )}
                                {review.status === 'deleted' && (
                                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20">
                                    Deleted
                                  </span>
                                )}
                                {review.status === 'approved' && (
                                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20">
                                    Approved
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Admin moderation buttons (always show for pending comments) */}
                            {user?.role === 'ADMIN' && isPending && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleApproveComment(review.id)}
                                  disabled={approvingComment}
                                  className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-1"
                                  title="Approve this comment"
                                >
                                  {approvingComment ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span>Approving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3" />
                                      <span>Approve</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRejectComment(review.id)}
                                  disabled={rejectingComment}
                                  className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-1"
                                  title="Reject this comment"
                                >
                                  {rejectingComment ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span>Rejecting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-3 w-3" />
                                      <span>Reject</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                            
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Load More Button */}
                  {hasMoreReviews && (
                    <div className="pt-4">
                      <button
                        onClick={() => setCommentsToShow(prev => prev + 3)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-bold text-sm transition-colors group"
                      >
                        <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                        Load More Reviews
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

        {/* Delete Confirmation Modal */}
        {deleteAlertOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Delete your review?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  This action is permanent. Your review will be permanently deleted.
                </p>
              </div>
              <div className="flex border-t border-gray-100">
                <button 
                  onClick={() => {
                    setDeleteAlertOpen(false);
                    setCommentToDelete(null);
                  }}
                  className="flex-1 px-4 py-4 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteComment}
                  disabled={deletingCommentId === commentToDelete}
                  className="flex-1 px-4 py-4 text-sm font-black text-red-600 hover:bg-red-50 transition-colors tracking-tight disabled:opacity-50"
                >
                  {deletingCommentId === commentToDelete ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
