'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Mail, Package, Users, MessageSquare, Bell, 
  CheckCircle, Trash2, Reply, LayoutDashboard, 
  Box, ShoppingCart, User, LogOut, ChevronDown, 
  AlertTriangle, X, Clock, CheckCircle2, Building2
} from 'lucide-react';
import { notificationAPI, messageAPI } from '@/lib/api';
import { toast } from 'sonner';

function AdminDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchMessages();
      fetchNotifications();
      const interval = setInterval(() => {
        fetchMessages();
        fetchNotifications();
      }, 10000);
      return () => clearInterval(interval);
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
      console.error('Fetch error:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const countData = await notificationAPI.getUnreadCount(true);
      if (countData?.unreadCount !== undefined) setUnreadNotifications(countData.unreadCount);
      const data = await notificationAPI.list(20, null, true);
      setNotifications(data?.notifications || (Array.isArray(data) ? data : []));
    } catch (error) {
      setNotifications([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
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
    } catch (error) { console.error(error); }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const message = await messageAPI.getById(id);
      await messageAPI.reply(id, replyText.trim());
      await messageAPI.updateStatus(id, 'replied');
      
      // Send email to client
      await messageAPI.sendClientReplyEmail(
        message.name,
        message.email,
        message.message,
        replyText.trim()
      );
      
      toast.success("Réponse envoyée");
      setReplyText('');
      fetchMessages();
      setSelectedMessage(null);
    } catch (error) { 
      toast.error("Erreur d'envoi");
      console.error(error);
    } finally { setSendingReply(false); }
  };

  const handleDeleteClick = (id) => {
    setMessageToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;
    try {
      await messageAPI.delete(messageToDelete);
      setMessages(prev => prev.filter(m => m._id !== messageToDelete));
      if (selectedMessage?._id === messageToDelete) setSelectedMessage(null);
      setDeleteAlertOpen(false);
      setMessageToDelete(null);
      toast.success("Message supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      setDeleteAlertOpen(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-slate-50 flex flex-col w-full font-sans text-slate-900">
        
        {/* NAVBAR */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 w-full shadow-sm">
          <div className="w-full px-4 sm:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-green-600 p-1.5 rounded-lg">
                  <LayoutDashboard className="text-white h-5 w-5" />
                </div>
                <h1 className="text-lg font-bold">Crunchy Vita <span className="text-green-600">Admin</span></h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Notifications */}
                <div className="relative">
                  <button onClick={() => { setShowNotificationsDropdown(!showNotificationsDropdown); setShowMessagesDropdown(false); setShowProfileDropdown(false); }} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition">
                    <Bell className="h-6 w-6" />
                    {unreadNotifications > 0 && <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 rounded-full border-2 border-white text-[10px] text-white font-bold flex items-center justify-center">{unreadNotifications}</span>}
                  </button>
                  {showNotificationsDropdown && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 bg-slate-100 flex justify-between items-center font-bold text-sm">Alertes Système <button onClick={async () => { await notificationAPI.markAllAsRead(); fetchNotifications(); }} className="text-blue-600 text-xs font-medium">Tout marquer</button></div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">Aucune notification</div> : notifications.map(n => (
                          <div key={n._id} className="p-4  hover:bg-slate-50 transition text-sm cursor-pointer" onClick={() => setShowNotificationsDropdown(false)}>
                            <p className="font-bold">{n.title}</p>
                            <p className="text-slate-600 text-xs line-clamp-1">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages Dropdown */}
                <div className="relative">
                  <button onClick={() => { setShowMessagesDropdown(!showMessagesDropdown); setShowNotificationsDropdown(false); setShowProfileDropdown(false); }} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition">
                    <MessageSquare className="h-6 w-6" />
                    {unreadMessages > 0 && <span className="absolute top-1 right-1 h-4 w-4 bg-orange-500 rounded-full border-2 border-white text-[10px] text-white font-bold flex items-center justify-center">{unreadMessages}</span>}
                  </button>
                  {showMessagesDropdown && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 bg-slate-100  font-bold text-sm">Nouveaux Messages</div>
                      <div className="max-h-80 overflow-y-auto">
                        {messages.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">Aucun message</div> : messages.map(m => (
                          <div key={m._id} className="p-4  hover:bg-slate-50 cursor-pointer flex items-center justify-between group">
                            <div onClick={() => { setSelectedMessage(m); if (m.status === 'new' || (!m.status && !m.read)) handleMarkAsRead(m._id); setShowMessagesDropdown(false); }} className="flex-1 min-w-0 flex items-start gap-2">
                              {(m.status === 'new' || (!m.status && !m.read)) && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
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
                              onClick={(e) => { e.stopPropagation(); handleDeleteClick(m._id); }}
                              className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-8 w-px bg-slate-200 mx-2" />

                {/* Profile */}
                <div className="relative">
                  <button onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowMessagesDropdown(false); setShowNotificationsDropdown(false); }} className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-100 rounded-full transition">
                    <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm uppercase">
                      {user?.name?.[0] || <User className="h-4 w-4" />}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4  bg-slate-50">
                        <p className="text-sm font-bold">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium">
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

        {/* MAIN CONTENT */}
        <main className="flex-1 w-full p-6 lg:p-8">
          <div className="w-full space-y-8">
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Actions Rapides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickLinkCard icon={<Package className="text-blue-600" />} title="Produits" desc="Catalogue" onClick={() => router.push('/admin/products')} />
                <QuickLinkCard icon={<Box className="text-orange-600" />} title="Stock" desc="Inventaire" onClick={() => router.push('/admin/stock')} />
                <QuickLinkCard icon={<Mail className="text-green-600" />} title="Contacts" desc="Messages" onClick={() => router.push('/admin/contact')} />
                <QuickLinkCard icon={<ShoppingCart className="text-purple-600" />} title="Commandes" desc="Ventes" onClick={() => router.push('/admin/orders')} />
              </div>
            </section>

            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                  <LayoutDashboard className="h-12 w-12 text-blue-200" />
                </div>
                <h3 className="text-lg font-bold">Bienvenue, {user?.name}</h3>
                <p className="text-slate-500 max-w-sm">Gérez votre boutique Crunchy Vita en toute simplicité.</p>
            </div>
          </div>
        </main>

        {/* --- MODAL CONVERSATION --- */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-100" onClick={() => setSelectedMessage(null)}>
            <div className="bg-white rounded-[1.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Détails du message</span>
                <button onClick={() => setSelectedMessage(null)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white text-lg font-bold">
                      {selectedMessage.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-900 truncate leading-tight">{selectedMessage.name}</h2>
                      <p className="text-xs text-blue-600 truncate">{selectedMessage.email}</p>
                      {selectedMessage.type === 'professionnel' && selectedMessage.companyName && (
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 size={12} className="text-purple-600" />
                          <span className="text-[12px] font-semibold text-purple-600">{selectedMessage.companyName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedMessage.status === 'replied' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20">
                      Répondu
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                  <div className="mt-3 text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                    <Clock size={12}/> Reçu le {formatDate(selectedMessage.createdAt)}
                  </div>
                </div>

                {selectedMessage.status === 'replied' && selectedMessage.replyMessage && (
                  <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100">
                    <span className="text-[10px] font-black text-emerald-600 uppercase mb-2 block tracking-wider">Votre Réponse</span>
                    <p className="text-slate-700 text-sm leading-relaxed">{selectedMessage.replyMessage}</p>
                  </div>
                )}

                {selectedMessage.status !== 'replied' && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase px-1">
                      <Reply size={14} className="text-blue-600" /> Réponse rapide
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-30 text-sm text-slate-700 resize-none"
                      placeholder="Écrivez votre réponse..."
                    />
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleReply(selectedMessage._id)}
                        disabled={sendingReply || !replyText.trim()}
                        className="flex-1 bg-green-900 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {sendingReply ? 'Envoi...' : 'Envoyer la réponse'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-4">
                   <button 
                    onClick={() => handleDeleteClick(selectedMessage._id)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-red-700 uppercase transition-colors"
                   >
                    <Trash2 size={14} /> Supprimer ce message
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- CONFIRM DELETE MODAL  --- */}
        {deleteAlertOpen && (
          <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Supprimer le message ?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Cette action est définitive. Les données de ce contact seront définitivement effacées.
                </p>
              </div>
              <div className="flex border-t border-slate-100">
                <button 
                  onClick={() => setDeleteAlertOpen(false)}
                  className="flex-1 px-4 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-100"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-4 text-sm font-black text-red-600 hover:bg-red-50 transition-colors  tracking-tight"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function QuickLinkCard({ icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left group">
      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors text-xl">{icon}</div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </button>
  );
}

export default AdminDashboard;