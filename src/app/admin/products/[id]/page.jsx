"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { productAPI } from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  History,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  AlertTriangle,
  Layers,
  Tag as TagIcon,
  FolderOpen,
  Globe,
  Star,
  Trash2,
  RefreshCw,
  User
} from "lucide-react";

export default function ProductDetailPage() {
  const { id: productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reviews"); 
  const [imageIdx, setImageIdx] = useState(0);
  const [commentsToShow, setCommentsToShow] = useState(3);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getById(productId);
      setProduct(res?.data || res);
      setLoading(false); // Set loading false immediately on success
    } catch (err) {
      console.error("Error loading product", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId]);

  if (!product && !loading) return <div className="p-20 text-center text-slate-500">Product not found.</div>;
  
  if (!product) return null; // Return nothing while loading, page will appear instantly once data arrives

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const latestPrice = product.pricingHistory?.[product.pricingHistory.length - 1]?.price || 0;
  const availableQty = (product.stock?.quantity || 0) - (product.stock?.reservedQuantity || 0);
  const isLowStock = availableQty <= (product.stock?.alertThreshold || 0);
  
  const images = (product.media || []).map(item => {
    const url = typeof item === 'string' ? item : (item.url || item);
    return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${url}`;
  });

  // Combine comments with ratings and filter out rating-only entries
  const getCommentsWithRatings = () => {
    const comments = (product.comments || []).filter(comment => 
      comment.content && comment.content.trim().length > 0
    );

    return comments.map(comment => {
      // Get user IDs for comparison
      const commentUserId = comment.userId?._id?.toString() || comment.userId?.toString();
      
      // Find matching rating by userId
      const matchingRating = (product.ratings || []).find(rating => {
        const ratingUserId = rating.userId?._id?.toString() || rating.userId?.toString();
        return ratingUserId && commentUserId && ratingUserId === commentUserId;
      });

      // Only include rating if it exists and is a valid number
      const ratingValue = matchingRating?.rating;
      const validRating = (typeof ratingValue === 'number' && ratingValue >= 1 && ratingValue <= 5) 
        ? ratingValue 
        : null;

      return {
        ...comment,
        rating: validRating,
        ratingId: matchingRating?._id || null
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const commentsWithRatings = getCommentsWithRatings();
  const displayedComments = commentsWithRatings.slice(0, commentsToShow);
  const hasMoreComments = commentsWithRatings.length > commentsToShow;

  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setDeleteAlertOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    
    const commentIdToDelete = commentToDelete;
    
    // Store original state for rollback
    const originalProduct = { ...product };
    const originalCommentsToShow = commentsToShow;
    
    // Optimistic update: Remove comment immediately
    setProduct(prevProduct => ({
      ...prevProduct,
      comments: prevProduct.comments.filter(c => c._id !== commentIdToDelete)
    }));
    
    // Reset comments to show count if needed
    const remainingComments = product.comments.filter(c => c._id !== commentIdToDelete && c.content?.trim());
    if (remainingComments.length <= commentsToShow) {
      setCommentsToShow(3);
    }
    
    // Close modal immediately
    setDeleteAlertOpen(false);
    setCommentToDelete(null);
    
    // Make API call in background
    try {
      await productAPI.deleteCommentAsAdmin(productId, commentIdToDelete);
    } catch (err) {
      console.error("Error deleting comment:", err);
      
      // Rollback on error
      setProduct(originalProduct);
      setCommentsToShow(originalCommentsToShow);
      
      alert("Failed to delete comment. Please try again.");
    }
  };

  const renderStars = (rating) => {
    // Strict validation: only render if rating is a valid number between 1-5
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return null;
    }
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}
          />
        ))}
      </div>
    );
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <Link href="/admin/products" className="p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2 text-slate-600 font-semibold">
            <ArrowLeft size={20} />
            <span>Back to Products</span>
          </Link>
          <Link href="/admin/promotions" className="bg-green-800 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
            <Calendar size={18} />
            Schedule Promotion
          </Link>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          <div className="xl:col-span-8 space-y-8">
            {/* IMAGE CARD */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 p-8 bg-white flex items-center justify-center relative border-r border-slate-100">
                  <img src={images[imageIdx] || "/placeholder.png"} alt={product.name} className="max-h-[500px] w-full object-contain" />
                  {images.length > 1 && (
                    <div className="absolute bottom-6 right-6 flex gap-2">
                      <button onClick={() => setImageIdx((prev) => (prev - 1 + images.length) % images.length)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all"><ChevronLeft size={20}/></button>
                      <button onClick={() => setImageIdx((prev) => (prev + 1) % images.length)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all"><ChevronRight size={20}/></button>
                    </div>
                  )}
                </div>

                <div className="p-8 space-y-8 bg-slate-50/50">
                  {product.categoryId?.name && (
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                        <FolderOpen size={12} /> Category
                      </h3>
                      <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm">
                        <span className="text-sm font-bold text-slate-900">{product.categoryId.name}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">Gallery</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((img, i) => (
                        <button key={i} onClick={() => setImageIdx(i)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${imageIdx === i ? 'border-blue-600' : 'border-transparent opacity-60'}`}>
                          <img src={img} className="w-full h-full object-cover" alt="" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {(product.tag || product.tags || []).length > 0 && (
                    <div>
                      <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                        <TagIcon size={12} /> Tags
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(product.tag || product.tags || []).map((tag, i) => (
                          <span key={i} className="px-3 py-1.5 bg-green-800 text-white text-[10px] font-black rounded-lg uppercase shadow-sm shadow-green-100">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COMMENTS & HISTORY */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100">
                <button onClick={() => setActiveTab("reviews")} className={`px-8 py-5 text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "reviews" ? "text-gray-800 border-b-2 border-gray-600 bg-blue-50/30" : "text-slate-400 hover:text-slate-600"}`}>
                  <MessageSquare size={16} /> Reviews
                  {commentsWithRatings.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-100 text-gray-700 rounded-full text-xs">
                      {commentsWithRatings.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setActiveTab("history")} className={`px-8 py-5 text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "history" ? "text-gray-800 border-b-2 border-gray-600 bg-blue-50/30" : "text-slate-400 hover:text-slate-600"}`}>
                  <History size={16} /> Pricing History
                </button>
              </div>
              <div className="p-8">
                {activeTab === "reviews" ? (
                  <div className="space-y-6">
                    {displayedComments.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-base font-medium">No reviews yet</p>
                        <p className="text-sm mt-1">Be the first to review this product!</p>
                      </div>
                    ) : (
                      <>
                        {displayedComments.map((comment) => {
                          const userName = comment.isAnonymous ? "Anonymous" : (comment.userId?.name || "Anonymous");
                          
                          return (
                            <div key={comment._id} className="flex gap-4 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                              {/* Avatar */}
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#064E3B] to-[#065f46] flex items-center justify-center text-white shadow-md">
                                  <User size={24} />
                                </div>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <h4 className="font-bold text-slate-900">{userName}</h4>
                                      {renderStars(comment.rating)}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">
                                      {formatDate(comment.createdAt)}
                                    </p>
                                  </div>
                                  
                                  {/* Delete Button (Admin only) */}
                                  <button
                                    onClick={() => handleDeleteComment(comment._id)}
                                    disabled={deletingCommentId === comment._id}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete comment"
                                  >
                                    {deletingCommentId === comment._id ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                </div>
                                
                                <p className="text-slate-700 leading-relaxed text-sm">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Load More Button */}
                        {hasMoreComments && (
                          <div className="pt-4 border-t border-slate-100">
                            <button
                              onClick={() => setCommentsToShow(prev => prev + 3)}
                              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-bold text-sm transition-colors group"
                            >
                              <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                              Load More Reviews
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...product.pricingHistory].reverse().map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-sm font-semibold text-slate-500">{formatDate(h.date)}</span>
                        <span className="text-lg font-bold text-slate-900">${Number(h.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6">
            {/* TRANSPARENT PRICE/INFO CARD */}
            <div className="bg-transparent p-4 text-slate-900">
              <div className="space-y-6">
                {/* Status Indicator */}
                <div className={`flex items-center justify-between px-4 py-2 rounded-2xl border ${
                  product.status === "ACTIVE" 
                    ? "bg-emerald-50 border-emerald-100" 
                    : "bg-slate-100 border-slate-200"
                }`}>
                  <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${
                    product.status === "ACTIVE" 
                      ? "text-emerald-900" 
                      : "text-slate-600"
                  }`}>
                    <Globe size={14} />
                    {product.status === "ACTIVE" ? "Product is live on shop" : "Product is offline"}
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${
                    product.status === "ACTIVE" 
                      ? "text-emerald-900" 
                      : "text-slate-500"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      product.status === "ACTIVE" 
                        ? "bg-emerald-500" 
                        : "bg-slate-400"
                    }`} />
                    {product.status === "ACTIVE" ? "Active" : "Inactive"}
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black  leading-tight">{product.name}</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">{product.description}</p>
                </div>
                
                <div className="pt-2">
                  <p className="text-2xl font-black text-slate-900 ">
                    ${Number(latestPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* STOCK ALERT CARD */}
            {isLowStock && (
              <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 flex items-start gap-4">
                <div className="p-2.5 bg-orange-500 rounded-xl text-white">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-orange-900 font-bold text-xs uppercase">Low Inventory Alert</h4>
                  <p className="text-orange-700 text-[11px] mt-1">
                    Only <span className="font-bold">{availableQty} items</span> remaining in stock.
                  </p>
                </div>
              </div>
            )}

            {/* STOCK INFORMATION CARD */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <h3 className="flex items-center gap-2 text-slate-900 font-bold uppercase text-[10px] tracking-widest mb-6 pb-4 border-b border-slate-100">
                <Layers size={14} className="text-blue-600"/> Stock Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs font-medium">Available Stock</span>
                  <span className={`font-black text-sm ${isLowStock ? 'text-orange-600' : 'text-slate-900'}`}>{availableQty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs font-medium">Reserved Stock</span>
                  <span className="text-blue-600 font-bold text-sm">{product.stock?.reservedQuantity || 0}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-50">
                  <span className="text-slate-500 text-xs font-medium">Total Inventory</span>
                  <span className="text-slate-900 font-bold text-sm">{product.stock?.quantity || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete this review?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This action is permanent. The review will be permanently deleted from the database.
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