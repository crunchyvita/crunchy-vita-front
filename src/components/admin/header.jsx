"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Bell, MessageSquare, ChevronDown, LogOut, User, LayoutDashboard, Trash2, Building2, Eye, EyeOff, CheckCheck, X } from "lucide-react";
import { notificationAPI, reviewAPI } from "@/lib/api";

export default function AdminHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messages, setMessages] = useState([]);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingModal, setPendingModal] = useState(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchMessages();
      fetchNotifications();
      const interval = setInterval(() => {
        fetchMessages();
        fetchNotifications();
      }, 10000);
      
      // Listen for notification read events from other components
      const handleNotificationRead = () => {
        fetchNotifications();
      };
      window.addEventListener('notificationRead', handleNotificationRead);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationRead', handleNotificationRead);
      };
    }
  }, [isAuthenticated, user]);

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
      setMessages(messagesArray);
      setUnreadMessages(messagesArray.filter(m => m.status === 'new' || (!m.status && !m.read)).length);
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationAPI.list(20, null, true);
      const notificationsList = data?.notifications || (Array.isArray(data) ? data : []);
      setNotifications(notificationsList);
      
      // Get pending comments to accurately count comment notifications
      const pendingResponse = await reviewAPI.listPending();
      const pendingComments = pendingResponse?.data || pendingResponse || [];
      const pendingCommentIds = new Set(pendingComments.map(c => c.commentId?.toString()));
      
      // Count only unread notifications that either:
      // 1. Are not comment notifications, OR
      // 2. Are comment notifications with still-pending comments
      const unreadCount = notificationsList.filter(n => 
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
    }
    setShowNotificationsDropdown(false);
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
    setDeletingNotification(notificationId);
    try {
      await notificationAPI.delete(notificationId);
    } catch (error) {
      // If notification not found, it was already deleted - this is OK
      if (error.message?.includes('non trouvée') || error.status === 404) {
        console.log('Notification already deleted, removing from UI');
      } else {
        console.error('Delete notification error:', error);
      }
    } finally {
      // Always refresh to sync with backend state
      setDeletingNotification(null);
      fetchNotifications();
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

  const handleDeleteMessage = async (messageId, e) => {
    e.stopPropagation();
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${cleanBaseUrl}/api/contact/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      });
      if (response.ok) {
        console.log('[Admin Header] Message deleted:', messageId);
        fetchMessages();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/admin/dashboard')}>
            <div className="bg-green-600 p-1.5 rounded-lg">
              <LayoutDashboard className="text-white h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold">Crunchy Vita <span className="text-green-600">Admin</span></h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => { 
                  setShowNotificationsDropdown(!showNotificationsDropdown); 
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
                            className="opacity-0 group-hover:opacity-100 p-1.5 ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                            title="Delete notification"
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
  
              {/* Messages Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => { 
                    setShowMessagesDropdown(!showMessagesDropdown); 
                    setShowNotificationsDropdown(false); 
                    setShowProfileDropdown(false); 
                  }} 
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition"
                >
                  <MessageSquare className="h-6 w-6" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-orange-500 rounded-full border-2 border-white text-[10px] text-white font-bold flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </button>
              {showMessagesDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-100 font-bold text-sm">Nouveaux Messages</div>
                  <div className="max-h-80 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">Aucun message</div>
                    ) : (
                      messages.map(m => (
                        <div 
                          key={m._id} 
                          className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between group"
                        >
                          <div 
                            onClick={() => { 
                              router.push('/admin/contact');
                              if (m.status === 'new' || (!m.status && !m.read)) handleMarkAsRead(m._id); 
                              setShowMessagesDropdown(false); 
                            }} 
                            className="flex-1 min-w-0 flex items-start gap-2"
                          >
                            {(m.status === 'new' || (!m.status && !m.read)) && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold">{m.name}</p>
                              <p className="text-xs text-slate-500 line-clamp-1">{m.message}</p>
                              {m.type === 'professionnel' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ring-1 ring-inset flex items-center gap-1 w-fit mt-1.5 bg-purple-50 text-purple-700 ring-purple-600/20">
                                  <Building2 size={12} /> Pro
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteMessage(m._id, e)}
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title="Delete message"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2" />

            {/* Profile */}
            <div className="relative">
              <button 
                onClick={() => { 
                  setShowProfileDropdown(!showProfileDropdown); 
                  setShowMessagesDropdown(false); 
                  setShowNotificationsDropdown(false); 
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
