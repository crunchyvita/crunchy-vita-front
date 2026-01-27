'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import { 
  MessageSquare, Check, Trash2, RefreshCw, Search, AlertTriangle,
  Clock, ChevronRight, User, Building2, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { reviewAPI, notificationAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function CommentsManagementPage() {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [filterStatus]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = filterStatus === 'pending' 
        ? await reviewAPI.listPending()
        : await reviewAPI.listApproved();
      const data = response?.data || response || [];
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      toast.error('Erreur lors du chargement des commentaires');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveComment = async (comment) => {
    setApproving(true);
    try {
      await reviewAPI.approve(comment.productId, comment.commentId);
      
      // Mark notification as read
      try {
        // Get all notifications to find the one for this comment
        const notificationsData = await notificationAPI.list(100, null, true);
        const notifications = notificationsData?.notifications || (Array.isArray(notificationsData) ? notificationsData : []);
        
        // Find notification with matching commentId (relatedId)
        const notification = notifications.find(
          n => n.type === 'new_comment' && n.relatedId?.toString() === comment.commentId?.toString()
        );
        
        if (notification) {
          await notificationAPI.markAsRead(notification._id);
        }
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
      
      setComments(comments.filter(c => c.commentId !== comment.commentId));
      if (selectedComment?.commentId === comment.commentId) setSelectedComment(null);
      
      // Emit event to refresh header notifications
      window.dispatchEvent(new Event('notificationRead'));
      
      toast.success('Commentaire approuvé');
    } catch (err) {
      console.error('Error approving comment:', err);
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectClick = (id) => {
    setCommentToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmReject = async () => {
    if (!commentToDelete) return;
    setRejecting(true);
    try {
      const comment = comments.find(c => c.commentId === commentToDelete);
      if (!comment) return;
      
      await reviewAPI.reject(comment.productId, comment.commentId);
      
      // Mark notification as read
      try {
        // Get all notifications to find the one for this comment
        const notificationsData = await notificationAPI.list(100, null, true);
        const notifications = notificationsData?.notifications || (Array.isArray(notificationsData) ? notificationsData : []);
        
        // Find notification with matching commentId (relatedId)
        const notification = notifications.find(
          n => n.type === 'new_comment' && n.relatedId?.toString() === comment.commentId?.toString()
        );
        
        if (notification) {
          await notificationAPI.markAsRead(notification._id);
        }
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
      
      setComments(comments.filter(c => c.commentId !== commentToDelete));
      if (selectedComment?.commentId === commentToDelete) setSelectedComment(null);
      setDeleteAlertOpen(false);
      setCommentToDelete(null);
      
      // Emit event to refresh header notifications
      window.dispatchEvent(new Event('notificationRead'));
      
      toast.success('Commentaire rejeté');
    } catch (err) {
      console.error('Error rejecting comment:', err);
      toast.error('Erreur lors du rejet');
      setDeleteAlertOpen(false);
      setCommentToDelete(null);
    } finally {
      setRejecting(false);
    }
  };

  const handleDeleteApprovedClick = (id) => {
    setCommentToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDeleteApproved = async () => {
    if (!commentToDelete) return;
    setDeleting(true);
    try {
      const comment = comments.find(c => c.commentId === commentToDelete);
      if (!comment) return;
      
      await reviewAPI.deleteAsAdmin(comment.productId, comment.commentId);
      
      setComments(comments.filter(c => c.commentId !== commentToDelete));
      if (selectedComment?.commentId === commentToDelete) setSelectedComment(null);
      setDeleteAlertOpen(false);
      setCommentToDelete(null);
      
      toast.success('Commentaire supprimé');
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Erreur lors de la suppression');
      setDeleteAlertOpen(false);
      setCommentToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredComments = comments.filter(comment => 
    comment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectComment = async (comment) => {
    setSelectedComment(comment);
    
    // Mark the associated notification as read
    try {
      // Get all notifications to find the one for this comment
      const notificationsData = await notificationAPI.list(100, null, true);
      const notifications = notificationsData?.notifications || (Array.isArray(notificationsData) ? notificationsData : []);
      
      // Find notification with matching commentId (relatedId)
      const notification = notifications.find(
        n => n.type === 'new_comment' && n.relatedId?.toString() === comment.commentId?.toString()
      );
      
      if (notification && !notification.isRead) {
        await notificationAPI.markAsRead(notification._id);
        // Emit event to notify header to refresh notifications
        window.dispatchEvent(new Event('notificationRead'));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <AdminHeader />
      <div className="min-h-screen bg-slate-50 flex flex-col w-full font-sans text-slate-900 p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            Gestion des Commentaires
          </h1>
          <p className="text-slate-600 mt-2">Modérez et approuvez les commentaires des clients en attente de validation</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg border border-slate-200 p-1">
          <button
            onClick={() => { setFilterStatus('pending'); setSelectedComment(null); }}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>En attente</span>
            </div>
          </button>
          <button
            onClick={() => { setFilterStatus('approved'); setSelectedComment(null); }}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              filterStatus === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>Approuvés</span>
            </div>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">{filterStatus === 'pending' ? 'En attente' : 'Approuvés'}</p>
                <p className="text-3xl font-bold text-slate-900">{comments.length}</p>
              </div>
              {filterStatus === 'pending' ? (
                <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
              ) : (
                <Check className="w-12 h-12 text-green-500 opacity-20" />
              )}
            </div>
          </div>
        </div>

        {/* Search and Refresh */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Chercher par contenu, auteur ou produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchComments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Comments List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-slate-200">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin">
                    <RefreshCw className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="mt-2 text-slate-600">Chargement des commentaires...</p>
                </div>
              ) : filteredComments.length === 0 ? (
                <div className="p-8 text-center text-slate-600">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{filterStatus === 'pending' ? 'Aucun commentaire en attente de validation' : 'Aucun commentaire approuvé'}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredComments.map((comment) => (
                    <div
                      key={comment.commentId}
                      onClick={() => handleSelectComment(comment)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                        selectedComment?.commentId === comment.commentId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900">{comment.authorName || 'Anonyme'}</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              filterStatus === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {filterStatus === 'pending' ? 'En attente' : 'Approuvé'}
                            </span>
                          </div>
                          <p className="text-sm text-blue-600 font-medium mb-2">{comment.productName}</p>
                          <p className="text-slate-700 text-sm line-clamp-2">{comment.content}</p>
                          <p className="text-xs text-slate-500 mt-2">{formatDate(comment.createdAt)}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comment Details Sidebar */}
          <div>
            {selectedComment ? (
              <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-8">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Détails du Commentaire
                </h3>

                <div className="space-y-4">
                  {/* Author */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Auteur
                    </p>
                    <p className="text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {selectedComment.authorName || 'Anonyme'}
                    </p>
                  </div>

                  {/* Product */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Produit
                    </p>
                    <p className="text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {selectedComment.productName}
                    </p>
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Date
                    </p>
                    <p className="text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {formatDate(selectedComment.createdAt)}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Statut
                    </p>
                    <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
                      filterStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {filterStatus === 'pending' ? 'En attente de validation' : 'Approuvé'}
                    </span>
                  </div>

                  {/* Comment Content */}
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Contenu
                    </p>
                    <p className="text-slate-700 leading-relaxed text-sm bg-slate-50 p-3 rounded">
                      {selectedComment.content}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    {filterStatus === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApproveComment(selectedComment)}
                          disabled={approving}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          {approving ? 'Approbation...' : 'Approuver'}
                        </button>
                        <button
                          onClick={() => handleRejectClick(selectedComment.commentId)}
                          disabled={rejecting}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {rejecting ? 'Rejet...' : 'Rejeter'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDeleteApprovedClick(selectedComment.commentId)}
                        disabled={deleting}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Suppression...' : 'Supprimer'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sélectionnez un commentaire pour voir les détails</p>
              </div>
            )}
          </div>

          {/* Delete Alert Dialog */}
          {deleteAlertOpen && (
            <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  {filterStatus === 'pending' ? 'Rejeter le commentaire' : 'Supprimer le commentaire'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {filterStatus === 'pending' 
                    ? 'Êtes-vous sûr de vouloir rejeter ce commentaire ? Cette action ne peut pas être annulée.'
                    : 'Êtes-vous sûr de vouloir supprimer ce commentaire approuvé ? Cette action ne peut pas être annulée.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDeleteAlertOpen(false);
                      setCommentToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={filterStatus === 'pending' ? confirmReject : confirmDeleteApproved}
                    disabled={filterStatus === 'pending' ? rejecting : deleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
                  >
                    {filterStatus === 'pending' 
                      ? (rejecting ? 'Rejet...' : 'Rejeter')
                      : (deleting ? 'Suppression...' : 'Supprimer')
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
