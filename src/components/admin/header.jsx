"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Bell, MessageSquare, ChevronDown, LogOut, User, LayoutDashboard, Trash2, Building2, AlertCircle, Mail, Menu, FileText, Settings } from "lucide-react";
import { notificationAPI, reviewAPI } from "@/lib/api";
import { useAdminLayout } from "@/context/AdminLayoutContext";

export default function AdminHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useAdminLayout();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messages, setMessages] = useState([]);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showContactNotificationsDropdown, setShowContactNotificationsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [contactNotifications, setContactNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadContactNotifications, setUnreadContactNotifications] = useState(0);
  const [pendingModal, setPendingModal] = useState(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState(null);
  const [skipNextPoll, setSkipNextPoll] = useState(false);
  const [deletedNotificationIds, setDeletedNotificationIds] = useState(() => {
    // Load deleted IDs from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('deletedNotificationIds');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });
  const [deletedContactNotificationIds, setDeletedContactNotificationIds] = useState(() => {
    // Load deleted contact notification IDs from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('deletedContactNotificationIds');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });
  const [deletedMessageIds, setDeletedMessageIds] = useState(() => {
    // Load deleted message IDs from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('deletedMessageIds');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN')) {
      // Initial fetch
      fetchMessages();
      fetchNotifications();
      fetchContactNotifications();
      
      // Set up polling for real-time updates (every 2 seconds)
      const pollInterval = setInterval(() => {
        // Skip polling if we just deleted something
        if (skipNextPoll) {
          setSkipNextPoll(false);
          return;
        }
        fetchMessages();
        fetchNotifications();
        fetchContactNotifications();
      }, 2000);
      
      // Cleanup on unmount
      return () => clearInterval(pollInterval);
    }
  }, [isAuthenticated, user, skipNextPoll]);

  const fetchMessages = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      const apiUrl = `${cleanBaseUrl}/api/contact`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      let messagesArray = Array.isArray(data) ? data : (data.messages || data.data || []);
      
      // Only show messages with status 'new' (unread/not dismissed) and not in deleted cache
      messagesArray = messagesArray.filter(m => (m.status === 'new' || !m.status) && !deletedMessageIds.has(m._id));
      
      setMessages(messagesArray);
      setUnreadMessages(messagesArray.length);
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationAPI.list(20, null, true);
      const notificationsList = data?.notifications || (Array.isArray(data) ? data : []);
      
      // Filter out notifications that we've deleted (from local cache)
      const filteredNotifications = notificationsList.filter(n => !deletedNotificationIds.has(n._id));
      
      setNotifications(filteredNotifications);
      
      // Get pending comments to accurately count comment notifications
      const pendingResponse = await reviewAPI.listPending();
      const pendingComments = pendingResponse?.data || pendingResponse || [];
      const pendingCommentIds = new Set(pendingComments.map(c => c.commentId?.toString()));
      
      // Count only unread notifications that either:
      // 1. Are not comment notifications, OR
      // 2. Are comment notifications with still-pending comments
      const unreadCount = filteredNotifications.filter(n => 
        !n.isRead && (
          n.type !== 'new_comment' || 
          pendingCommentIds.has(n.relatedId?.toString())
        )
      ).length;
      
      setUnreadNotifications(unreadCount);
    } catch (error) {
      console.error('Fetch notifications error:', error);
      setNotifications([]);
      setUnreadNotifications(0);
    }
  };

  const fetchContactNotifications = async () => {
    try {
      // Fetch only contact message notifications
      const data = await notificationAPI.list(20, null, false);
      const notificationsList = data?.notifications || (Array.isArray(data) ? data : []);
      
      // Filter to show only contact_message type and not in deleted cache
      const filteredContactNotifications = notificationsList.filter(n => 
        n.type === 'contact_message' && !deletedContactNotificationIds.has(n._id)
      );
      
      setContactNotifications(filteredContactNotifications);
      
      // Count unread contact notifications
      const unreadCount = filteredContactNotifications.filter(n => !n.isRead).length;
      setUnreadContactNotifications(unreadCount);
    } catch (error) {
      console.error('Fetch contact notifications error:', error);
      setContactNotifications([]);
      setUnreadContactNotifications(0);
    }
  };

  const openCommentModeration = async (notification) => {
    setPendingError('');
    setPendingLoading(true);
    try {
      const pending = await reviewAPI.listPending();
      const list = pending?.data || pending || [];
      const match = list.find((c) => c.commentId?.toString() === notification?.relatedId?.toString());

      if (!match) {
        setPendingError("Commentaire introuvable ou déjà modéré.");
        setPendingModal(null);
      } else {
        setPendingModal(match);
      }
    } catch (err) {
      setPendingError(err.message || 'Impossible de charger le commentaire.');
      setPendingModal(null);
    } finally {
      setPendingLoading(false);
      setShowNotificationsDropdown(false);
    }
  };

  const handleNotificationClick = (notification) => {
    console.log('[Notification Click] Full notification:', notification);
    console.log('[Notification Click] Metadata:', notification?.metadata);
    console.log('[Notification Click] RelatedId:', notification?.relatedId);
    
    // Mark as read when clicked
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }
    
    if (notification?.type === 'new_comment') {
      // Navigate to ADMIN product detail page with comment ID for moderation
      // and show the Pending comments tab with the list of pending comments
      const productId = notification?.metadata?.productId;
      const commentId = notification?.relatedId;
      
      console.log('[Notification Click] Extracted - ProductId:', productId, 'CommentId:', commentId);
      
      if (productId && commentId) {
        const url = `/admin/products/${productId}?review=${commentId}&moderateMode=true&tab=pending`;
        console.log('[Notification Click] Navigating to:', url);
        router.push(url);
      } else {
        console.error('[Notification Click] Missing productId or commentId');
      }
    } else if (notification?.type === 'stock_alert') {
      // Navigate to stock edit page for the product
      const productId = notification?.relatedId;
      
      console.log('[Notification Click] Stock Alert - ProductId:', productId);
      
      if (productId) {
        const url = `/admin/stock/edit/${productId}`;
        console.log('[Notification Click] Navigating to stock edit:', url);
        router.push(url);
      } else {
        console.error('[Notification Click] Missing productId for stock alert');
      }
      setShowNotificationsDropdown(false);
    } else {
      // For other notifications, just mark as read and close dropdown
      setShowNotificationsDropdown(false);
    }
  };

  const handleContactNotificationClick = (notification) => {
    console.log('[Contact Notification Click] Full notification:', notification);
    
    // Mark as read when clicked
    if (!notification.isRead) {
      markContactNotificationAsRead(notification._id);
    }
    
    // Navigate to contact page
    const messageId = notification?.relatedId;
    if (messageId) {
      router.push(`/admin/contact?message=${messageId}`);
    } else {
      router.push('/admin/contact');
    }
    
    setShowContactNotificationsDropdown(false);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      // Update local state immediately for better UX
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markContactNotificationAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      // Update local state immediately for better UX
      setContactNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadContactNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark contact notification as read error:', error);
    }
  };

  const approvePending = async () => {
    if (!pendingModal) return;
    setPendingLoading(true);
    setPendingError('');
    try {
      await reviewAPI.approve(pendingModal.productId, pendingModal.commentId);
      setPendingModal(null);
      fetchNotifications();
    } catch (err) {
      setPendingError(err.message || "Impossible d'approuver le commentaire.");
    } finally {
      setPendingLoading(false);
    }
  };

  const rejectPending = async () => {
    if (!pendingModal) return;
    setPendingLoading(true);
    setPendingError('');
    try {
      await reviewAPI.reject(pendingModal.productId, pendingModal.commentId);
      setPendingModal(null);
      fetchNotifications();
    } catch (err) {
      setPendingError(err.message || 'Impossible de refuser le commentaire.');
    } finally {
      setPendingLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`${cleanBaseUrl}/api/contact/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      });
      fetchMessages();
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleToggleNotificationRead = async (notificationId, currentReadStatus, e) => {
    e.stopPropagation();
    try {
      if (currentReadStatus) {
        await notificationAPI.markAsUnread(notificationId);
      } else {
        await notificationAPI.markAsRead(notificationId);
      }
      fetchNotifications();
    } catch (error) {
      console.error('Toggle read status error:', error);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const deleteNotification = async (notificationId) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);
      
      // Skip next polling cycle to avoid refetching
      setSkipNextPoll(true);
      
      // Add to deleted cache first
      const newDeletedIds = new Set([...deletedNotificationIds, notificationId]);
      setDeletedNotificationIds(newDeletedIds);
      
      // Save to localStorage to persist across refreshes
      if (typeof window !== 'undefined') {
        localStorage.setItem('deletedNotificationIds', JSON.stringify([...newDeletedIds]));
      }
      
      // Immediately remove from UI
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadNotifications(prev => {
        const notif = notifications.find(n => n._id === notificationId);
        return notif && !notif.isRead ? Math.max(0, prev - 1) : prev;
      });
      
      // For other notifications, use the standard delete endpoint
      await notificationAPI.delete(notificationId);
      console.log('[Admin Header] Notification deleted successfully');
      
    } catch (error) {
      console.error('[Admin Header] Delete notification error:', error);
      // Remove from cache on error so it can be retried
      setDeletedNotificationIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('deletedNotificationIds', JSON.stringify([...newSet]));
        }
        return newSet;
      });
    } finally {
      setDeletingNotification(null);
    }
  };

  const handleToggleSelectNotification = (notificationId, e) => {
    e.stopPropagation();
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const handleMarkAllMessagesAsRead = async () => {
    try {
      console.log('[Admin Header] Marking all messages as read');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Get all message IDs before marking as read
      const messageIds = messages.map(m => m._id);
      
      // Mark all new messages as read in backend
      await Promise.all(
        messages.map(m => 
          fetch(`${cleanBaseUrl}/api/contact/${m._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: JSON.stringify({ status: 'read' })
          })
        )
      );
      
      // Add to deleted cache to prevent them from reappearing on refresh
      const newDeletedIds = new Set([...deletedMessageIds, ...messageIds]);
      setDeletedMessageIds(newDeletedIds);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('deletedMessageIds', JSON.stringify([...newDeletedIds]));
      }
      
      console.log('[Admin Header] All messages marked as read');
      
      // Clear UI immediately
      setMessages([]);
      setUnreadMessages(0);
      
    } catch (error) {
      console.error('[Admin Header] Error marking all messages as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId, e) => {
    e.stopPropagation();
    await deleteMessage(messageId);
  };

  const deleteMessage = async (messageId) => {
    try {
      // Add to deleted cache first
      const newDeletedIds = new Set([...deletedMessageIds, messageId]);
      setDeletedMessageIds(newDeletedIds);
      
      // Save to localStorage to persist across refreshes
      if (typeof window !== 'undefined') {
        localStorage.setItem('deletedMessageIds', JSON.stringify([...newDeletedIds]));
      }
      
      // Mark message as read in the database
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      await fetch(`${cleanBaseUrl}/api/contact/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: 'read' })
      });
      
      console.log('[Admin Header] Message marked as read successfully');
      
      // Remove from UI
      setMessages(prev => prev.filter(m => m._id !== messageId));
      setUnreadMessages(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('[Admin Header] Error marking message as read:', error);
      // Remove from cache on error so it can be retried
      setDeletedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('deletedMessageIds', JSON.stringify([...newSet]));
        }
        return newSet;
      });
    }
  };

  const handleSelectAllNotifications = () => {
    setSelectedNotifications(prev => {
      const allIds = notifications.map(n => n._id);
      const alreadyAll = prev.size === allIds.length && allIds.every(id => prev.has(id));
      return alreadyAll ? new Set() : new Set(allIds);
    });
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const handleMarkAllContactNotificationsAsRead = async () => {
    try {
      // Mark all contact notifications as read individually
      await Promise.all(
        contactNotifications.filter(n => !n.isRead).map(n => notificationAPI.markAsRead(n._id))
      );
      fetchContactNotifications();
    } catch (error) {
      console.error('Mark all contact notifications as read error:', error);
    }
  };

  const handleDeleteContactNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      // Skip next polling cycle to avoid refetching
      setSkipNextPoll(true);
      
      // Add to deleted cache first
      const newDeletedIds = new Set([...deletedContactNotificationIds, notificationId]);
      setDeletedContactNotificationIds(newDeletedIds);
      
      // Save to localStorage to persist across refreshes
      if (typeof window !== 'undefined') {
        localStorage.setItem('deletedContactNotificationIds', JSON.stringify([...newDeletedIds]));
      }
      
      // Immediately remove from UI
      setContactNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadContactNotifications(prev => {
        const notif = contactNotifications.find(n => n._id === notificationId);
        return notif && !notif.isRead ? Math.max(0, prev - 1) : prev;
      });
      
      // Delete from backend
      await notificationAPI.delete(notificationId);
      console.log('[Admin Header] Contact notification deleted successfully');
      
    } catch (error) {
      console.error('[Admin Header] Delete contact notification error:', error);
      // Remove from cache on error so it can be retried
      setDeletedContactNotificationIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('deletedContactNotificationIds', JSON.stringify([...newSet]));
        }
        return newSet;
      });
    }
  };

  const handleDeleteSelectedNotifications = async () => {
    if (selectedNotifications.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedNotifications).map(id => notificationAPI.delete(id))
      );
      setSelectedNotifications(new Set());
      setIsSelectionMode(false);
      fetchNotifications();
    } catch (error) {
      console.error('Delete selected notifications error:', error);
    }
  };

  return (
    <>
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 w-full shadow-sm">
      <div className="w-full px-4 sm:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/admin/dashboard')}>
            <img src="/assets/images/logo.png" alt="Logo" className="h-12 w-12 object-contain" />
            <h1 className="text-lg font-bold">Crunchy Vita <span style={{color: '#556622'}}>Admin</span></h1>
          </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/settings')}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition"
              title="Settings"
              aria-label="Open settings"
            >
              <Settings className="h-6 w-6" />
            </button>

            {/* Contact Notifications */}
            <div className="relative">
              <button 
                onClick={() => { 
                  setShowContactNotificationsDropdown(!showContactNotificationsDropdown); 
                  setShowNotificationsDropdown(false);
                  setShowMessagesDropdown(false); 
                  setShowProfileDropdown(false); 
                }} 
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition"
                title="Notifications de contact"
              >
                <Mail className="h-6 w-6" />
                {unreadContactNotifications > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-orange-500 rounded-full border-2 border-white text-[10px] text-white font-bold flex items-center justify-center">
                    {unreadContactNotifications}
                  </span>
                )}
              </button>
              {showContactNotificationsDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-blue-50 font-bold text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      Messages de contact
                    </span>
                    {unreadContactNotifications > 0 && (
                      <button
                        onClick={handleMarkAllContactNotificationsAsRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Marquer tout comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {contactNotifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">Aucune notification de contact</div>
                    ) : (
                      contactNotifications.map(n => {
                        // Extract contact type and info from metadata - better detection
                        const contactType = n.metadata?.contactType;
                        const companyName = n.metadata?.companyName;
                        
                        // Determine if business/devis contact based on metadata or company name
                        const isQuoteRequest = contactType === 'devis';
                        const isBusinessContact = ['professionnel', 'devis'].includes(contactType) || !!companyName;
                        
                        const senderName = n.metadata?.senderName || 'Contact';
                        const senderEmail = n.metadata?.senderEmail || '';
                        // For professional, show sender name. For personal, also show sender name
                        const displayName = senderName;
                        
                        // Extract subject from the message (first part before ':')
                        const subject = n.message?.split(':')[1]?.trim() || '';
                        
                        return (
                          <div 
                            key={n._id} 
                            className="group relative hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-all duration-200"
                          >
                            <div 
                              onClick={() => handleContactNotificationClick(n)}
                              className="p-4 flex items-start gap-3 relative"
                            >
                              {/* PRO/DEVIS Badge in bottom right for business contacts */}
                              {isBusinessContact && (
                                <div className="absolute bottom-2 right-2">
                                  <div
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded border ${
                                      isQuoteRequest
                                        ? 'bg-orange-100 border-orange-200'
                                        : 'bg-purple-100 border-purple-200'
                                    }`}
                                  >
                                    {isQuoteRequest ? (
                                      <FileText className="h-3 w-3 text-orange-600 mr-1" />
                                    ) : (
                                      <Building2 className="h-3 w-3 text-purple-600 mr-1" />
                                    )}
                                    <span
                                      className={`text-[10px] font-bold ${
                                        isQuoteRequest ? 'text-orange-600' : 'text-purple-600'
                                      }`}
                                    >
                                      {isQuoteRequest ? 'DEVIS' : 'PRO'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Content */}
                              <div className="flex-1 min-w-0 pr-12">
                                
                                {/* Sender name with blue dot for unread */}
                                <div className="flex items-center gap-2">
                                  {!n.isRead && (
                                    <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                                  )}
                                  <p className={`text-sm font-semibold ${
                                    n.isRead ? 'text-slate-600' : 'text-slate-900'
                                  }`}>
                                    {displayName}
                                  </p>
                                </div>
                                
                               
                                
                            
                                
                                {/* Subject/Object */}
                                {subject && (
                                  <p className="text-xs text-slate-600 font-medium mt-2 line-clamp-2">
                                    {subject}
                                  </p>
                                )}
                                
                                {/* Timestamp */}
                                {n.createdAt && (
                                  <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(n.createdAt).toLocaleDateString('fr-FR', { 
                                      day: '2-digit', 
                                      month: 'short'
                                    })} à {new Date(n.createdAt).toLocaleTimeString('fr-FR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Delete button */}
                              <button
                                onClick={(e) => handleDeleteContactNotification(n._id, e)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100"
                                title="Supprimer la notification"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => { 
                  setShowNotificationsDropdown(!showNotificationsDropdown); 
                  setShowContactNotificationsDropdown(false);
                  setShowMessagesDropdown(false); 
                  setShowProfileDropdown(false); 
                }} 
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition"
              >
                <Bell className="h-6 w-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 rounded-full border-2 border-white text-[10px] text-white font-bold flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-100 font-bold text-sm flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadNotifications > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Marquer tout comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">Aucune notification</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id} 
                          className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between group border-b border-slate-100 last:border-0"
                        >
                          <div 
                            onClick={() => handleNotificationClick(n)}
                            className="flex-1 min-w-0 flex items-start gap-2"
                          >
                            {!n.isRead && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold">{n.title}</p>
                              <p className="text-xs text-slate-500 line-clamp-1">{n.message}</p>
                              {n.createdAt && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(n.createdAt).toLocaleDateString('fr-FR', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })} à {new Date(n.createdAt).toLocaleTimeString('fr-FR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteNotification(n._id, e)}
                            className="p-1.5 ml-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                            title="Supprimer la notification"
                          >
                            <Trash2 className="h-4 w-4" />

                      
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

            {/* Profile */}
            <div className="relative hidden md:block">
              <button 
                onClick={() => { 
                  setShowProfileDropdown(!showProfileDropdown); 
                  setShowMessagesDropdown(false); 
                  setShowNotificationsDropdown(false);
                  setShowContactNotificationsDropdown(false);
                }} 
                className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-100 rounded-full transition"
              >
                {user?.photo ? (
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm uppercase"
                  style={{ display: user?.photo ? 'none' : 'flex' }}
                >
                  {user?.name?.[0] || <User className="h-4 w-4" />}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-50">
                    <div className="flex items-center gap-3 mb-2">
                      {user?.photo ? (
                        <img
                          src={user.photo}
                          alt={user.name}
                          className="h-12 w-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg uppercase"
                        style={{ display: user?.photo ? 'none' : 'flex' }}
                      >
                        {user?.name?.[0] || <User className="h-5 w-5" />}
                      </div>
                    </div>
                    <p className="text-sm font-bold">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        router.push('/profile');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium"
                    >
                      <User className="h-4 w-4" /> Account
                    </button>
                  </div>
                  <div className="p-2 border-t border-slate-100">
                    <button 
                      onClick={logout} 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                    >
                      <LogOut className="h-4 w-4" /> Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>

      {/* Comment moderation modal */}
    {pendingModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase text-slate-500 font-semibold">Nouveau commentaire</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{pendingModal.productName}</h3>
            </div>
            <button onClick={() => setPendingModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-600"><span className="font-semibold">Auteur :</span> {pendingModal.authorName || 'Client'}</p>
            <p className="text-sm text-slate-600"><span className="font-semibold">Commentaire :</span> {pendingModal.content}</p>
          </div>

          {pendingError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pendingError}</div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={rejectPending}
              disabled={pendingLoading}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Refuser
            </button>
            <button
              onClick={approvePending}
              disabled={pendingLoading}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {pendingLoading ? 'Traitement...' : 'Accepter'}
            </button>
          </div>
        </div>
      </div>
    )}

    </>
  );
}