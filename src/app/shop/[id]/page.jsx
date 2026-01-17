'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Heart, ShoppingCart, Plus, Minus, ChevronLeft, Package, Shield, Truck, Send, MessageSquare, Trash2, Loader2, AlertTriangle, X, RefreshCw, User } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { productAPI } from '@/lib/api';
import Footer from '@/components/footer';
import Header from '@/components/header';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [commentsToShow, setCommentsToShow] = useState(3);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Product not found');
      }

      const data = await response.json();
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
    setSubmittingReview(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setReviewError('Please login to submit a review');
        return;
      }

      const { rating, comment } = reviewForm;
      
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

      // Create temporary IDs for optimistic update
      const tempCommentId = `temp-${Date.now()}`;
      const tempRatingId = `temp-rating-${Date.now()}`;
      
      // Optimistic update - show immediately
      setProduct(prevProduct => {
        const updatedProduct = { ...prevProduct };
        
        // Add rating optimistically if provided
        if (rating) {
          const existingRatingIndex = updatedProduct.ratings?.findIndex(
            r => r.userId?._id?.toString() === user.id?.toString() || r.userId?.toString() === user.id?.toString()
          );
          
          const newRating = {
            _id: tempRatingId,
            userId: user.id,
            rating: rating,
            createdAt: new Date().toISOString()
          };
          
          if (existingRatingIndex !== -1) {
            updatedProduct.ratings[existingRatingIndex] = newRating;
          } else {
            updatedProduct.ratings = [...(updatedProduct.ratings || []), newRating];
          }
        }
        
        // Add comment optimistically if provided
        if (comment?.trim()) {
          const newComment = {
            _id: tempCommentId,
            userId: {
              _id: user.id,
              name: user.name
            },
            content: comment.trim(),
            createdAt: new Date().toISOString()
          };
          updatedProduct.comments = [...(updatedProduct.comments || []), newComment];
        }
        
        return updatedProduct;
      });

      // Reset form immediately for better UX
      setReviewForm({ rating: 0, comment: '' });
      setSubmittingReview(false);

      // Make API call in background
      const response = await fetch(`/api/products/${params.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: rating || undefined,
          content: comment?.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Rollback optimistic update on error
        setProduct(prevProduct => {
          const updatedProduct = { ...prevProduct };
          
          // Remove optimistic rating
          if (rating) {
            updatedProduct.ratings = updatedProduct.ratings?.filter(r => r._id !== tempRatingId);
          }
          
          // Remove optimistic comment
          if (comment?.trim()) {
            updatedProduct.comments = updatedProduct.comments?.filter(c => c._id !== tempCommentId);
          }
          
          return updatedProduct;
        });
        throw new Error(data.message || 'Failed to submit review');
      }

      // Update with real IDs from backend
      setProduct(prevProduct => {
        const updatedProduct = { ...prevProduct };
        
        // Replace temp rating with real one
        if (data.data?.rating) {
          const tempIndex = updatedProduct.ratings?.findIndex(r => r._id === tempRatingId);
          if (tempIndex !== -1) {
            updatedProduct.ratings[tempIndex] = {
              _id: data.data.rating._id,
              userId: user.id,
              rating: data.data.rating.rating,
              createdAt: data.data.rating.createdAt
            };
          }
        }
        
        // Replace temp comment with real one
        if (data.data?.comment) {
          const tempIndex = updatedProduct.comments?.findIndex(c => c._id === tempCommentId);
          if (tempIndex !== -1) {
            updatedProduct.comments[tempIndex] = {
              _id: data.data.comment._id,
              userId: {
                _id: user.id,
                name: user.name
              },
              content: data.data.comment.content,
              createdAt: data.data.comment.createdAt
            };
          }
        }
        
        return updatedProduct;
      });
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

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    
    setDeletingCommentId(commentToDelete);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to delete your review');
        setDeleteAlertOpen(false);
        setCommentToDelete(null);
        return;
      }

      const response = await fetch(`/api/products/${params.id}/reviews?commentId=${commentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to delete review');
      }

      // Optimized update: Remove comment from state without full reload
      setProduct(prevProduct => ({
        ...prevProduct,
        comments: prevProduct.comments.filter(c => c._id !== commentToDelete)
      }));
      
      setDeleteAlertOpen(false);
      setCommentToDelete(null);
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert(err.message || 'Failed to delete review. Please try again.');
      setDeleteAlertOpen(false);
      setCommentToDelete(null);
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['CLIENT']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#469165] mb-4"></div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !product) {
    return (
      <ProtectedRoute allowedRoles={['CLIENT']}>
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
      </ProtectedRoute>
    );
  }

  const productImages = getProductImages();
  const productPrice = getProductPrice();
  const availableStock = getAvailableStock();
  const totalPrice = productPrice * quantity;

  return (
    <ProtectedRoute allowedRoles={['CLIENT']}>
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
                    <span className="px-6 py-3 font-semibold text-lg border-x-2 border-gray-300 min-w-[60px] text-center">
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

                    {/* Error Message */}
                    {reviewError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {reviewError}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submittingReview || (!reviewForm.rating && !reviewForm.comment.trim())}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-colors ${
                        submittingReview || (!reviewForm.rating && !reviewForm.comment.trim())
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gray-900 hover:bg-[#064E3B]'
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
                <div className="space-y-4">
                  {displayedReviews.map((review) => {
                    const userName = review.userId?.name || 'Anonymous';
                    const isOwnComment = user && review.userId?._id?.toString() === user.id?.toString();
                    
                    return (
                      <div key={review.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-[#064E3B] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                            <User size={24} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Header with name, rating, and delete button */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-bold text-gray-900 text-sm">{userName}</h4>
                                  {review.rating && (
                                    <div className="flex items-center gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-3.5 w-3.5 ${
                                            i < review.rating
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'fill-gray-200 text-gray-200'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Delete button */}
                              {isOwnComment && (
                                <button
                                  onClick={() => handleDeleteComment(review.id)}
                                  disabled={deletingCommentId === review.id}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                  title="Delete your review"
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
                            <p className="text-gray-700 leading-relaxed text-sm mb-2">
                              {review.content}
                            </p>
                            
                            {/* Date */}
                            <p className="text-xs text-gray-500">
                              {formatDate(review.createdAt)}
                            </p>
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
    </ProtectedRoute>
  );
}
