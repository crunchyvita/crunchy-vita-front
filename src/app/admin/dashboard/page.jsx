'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Mail, Package, Users, MessageSquare, Bell, CheckCircle, Trash2, Reply } from 'lucide-react';

function AdminDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, unread, replied, unanswered

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchMessages();
      const interval = setInterval(fetchMessages, 10000); // Rafraîchir chaque 10 secondes
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const fetchMessages = async () => {
    try {
      // Construire l'URL correctement
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Enlever le /api s'il est déjà dans baseUrl
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      const apiUrl = `${cleanBaseUrl}/api/contact`;
      
      console.log('Fetching messages from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setMessages([]);
        setUnreadMessages(0);
        return;
      }
      
      const data = await response.json();
      console.log('Raw data:', data);
      console.log('Data keys:', Object.keys(data));
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      console.log('Data length:', data?.length);
      console.log('Full data structure:', JSON.stringify(data).substring(0, 500));
      
      // Vérifier que data est un array
      let messagesArray = data;
      
      // Si data est un objet mais pas un array, chercher une propriété contenant le array
      if (!Array.isArray(data)) {
        if (data && typeof data === 'object') {
          // Chercher les propriétés communes qui pourraient contenir les messages
          if (Array.isArray(data.messages)) {
            messagesArray = data.messages;
            console.log('Found messages in data.messages');
          } else if (Array.isArray(data.data)) {
            messagesArray = data.data;
            console.log('Found messages in data.data');
          } else {
            console.error('Les données ne contiennent pas d\'array de messages');
            console.log('Available properties:', Object.keys(data));
            messagesArray = [];
          }
        } else {
          console.error('Format de données invalide, type:', typeof data);
          messagesArray = [];
        }
      }
      
      if (Array.isArray(messagesArray) && messagesArray.length > 0) {
        console.log('Setting messages to:', messagesArray);
        setMessages(messagesArray);
        const unread = messagesArray.filter(m => !m.read).length;
        setUnreadMessages(unread);
        console.log('Messages loaded:', messagesArray.length, 'Unread:', unread);
      } else {
        console.error('Messages array is empty or invalid');
        setMessages([]);
        setUnreadMessages(0);
      }
    } catch (error) {
      console.error('Erreur fetch messages:', error);
      console.error('Error stack:', error.stack);
      setMessages([]);
      setUnreadMessages(0);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      const apiUrl = `${cleanBaseUrl}/api/contact/${id}/read`;
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
      });
      const updatedMessage = await response.json();
      setMessages(messages.map(m => m._id === id ? updatedMessage : m));
      setUnreadMessages(unreadMessages - 1);
      setSelectedMessage(updatedMessage);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      const apiUrl = `${cleanBaseUrl}/api/contact/${id}/reply`;
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyMessage: replyText }),
      });
      const updatedMessage = await response.json();
      setMessages(messages.map(m => m._id === id ? updatedMessage : m));
      setSelectedMessage(updatedMessage);
      setReplyText('');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      const apiUrl = `${cleanBaseUrl}/api/contact/${id}`;
      
      await fetch(apiUrl, {
        method: 'DELETE',
      });
      setMessages(messages.filter(m => m._id !== id));
      setSelectedMessage(null);
      setUnreadMessages(Math.max(0, unreadMessages - 1));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Filtrer les messages
  const filteredMessages = messages.filter(message => {
    // Appliquer le filtre de statut
    if (filterStatus === 'unread' && message.read) return false;
    if (filterStatus === 'replied' && !message.replied) return false;
    if (filterStatus === 'unanswered' && message.replied) return false;

    // Appliquer la recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        message.name.toLowerCase().includes(search) ||
        message.email.toLowerCase().includes(search) ||
        message.message.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Exporter les messages en CSV
  const exportToCSV = () => {
    const headers = ['Nom', 'Email', 'Message', 'Date', 'Lu', 'Répondu', 'Réponse'];
    const rows = filteredMessages.map(m => [
      m.name,
      m.email,
      `"${m.message.replace(/"/g, '""')}"`,
      new Date(m.createdAt).toLocaleString('fr-FR'),
      m.read ? 'Oui' : 'Non',
      m.replied ? 'Oui' : 'Non',
      m.replyMessage ? `"${m.replyMessage.replace(/"/g, '""')}"` : '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `messages-crunchy-vita-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">CrunchyVita Admin</h1>
              </div>
              <div className="flex items-center gap-6">
                {/* Bell Notification */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowMessagesDropdown(!showMessagesDropdown);
                      if (!showMessagesDropdown) {
                        // Recharger les messages quand on ouvre le dropdown
                        fetchMessages();
                      }
                    }}
                    className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Bell className="h-6 w-6 text-yellow-600" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-xs font-bold text-white">
                        {unreadMessages}
                      </span>
                    )}
                  </button>

                  {/* Messages Dropdown */}
                  {showMessagesDropdown && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
                        <h3 className="text-sm font-bold text-gray-900">Messages de Contact</h3>
                        <p className="text-xs text-gray-500">{messages.length} message{messages.length > 1 ? 's' : ''}</p>
                      </div>

                      {messages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <p className="text-sm">Aucun message pour le moment</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {messages.map((message) => (
                            <div
                              key={message._id}
                              onClick={() => {
                                setSelectedMessage(message);
                                if (!message.read) handleMarkAsRead(message._id);
                                setShowMessagesDropdown(false);
                              }}
                              className={`p-3 cursor-pointer hover:bg-gray-50 transition ${
                                !message.read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{message.name}</p>
                                  <p className="text-xs text-gray-600 truncate">{message.email}</p>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{message.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(message.createdAt).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                                <div className="flex gap-1 mt-1">
                                  {!message.read && (
                                    <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                  )}
                                  {message.replied && (
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-sm text-gray-700">
                  Welcome, {user?.name || 'Admin'}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h2>

            <div className="space-y-6">
              {/* User Information */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900">Informations utilisateur</h3>
                <dl className="mt-4 space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nom</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rôle</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.role}</dd>
                  </div>
                </dl>
              </div>

              {/* Quick Actions */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <button 
                    onClick={() => router.push('/admin/products')}
                    className="rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Package className="h-5 w-5" />
                    Produits
                  </button>
                  <button 
                    onClick={() => router.push('/admin/orders')}
                    className="rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Mail className="h-5 w-5" />
                    Commandes
                  </button>
                  <button 
                    onClick={() => router.push('/admin/users')}
                    className="rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Users className="h-5 w-5" />
                    Utilisateurs
                  </button>
                 
                </div>
              </div>


              {/* Info Box */}
              <div className="rounded-lg bg-blue-50 p-6 border border-blue-200">
                <p className="text-sm text-blue-800">
                  Bienvenue dans le tableau de bord administrateur. Gérez les messages de contact directement ici.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Modal pour afficher le message sélectionné */}
        {selectedMessage && (
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedMessage(null)}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.name}</h2>
                  <p className="text-gray-600">{selectedMessage.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString('fr-FR') : 'Date non disponible'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Message Content */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Message:</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message || 'Aucun contenu'}</p>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="flex gap-4 mb-6 text-sm">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${selectedMessage.read ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    <CheckCircle className="h-4 w-4" />
                    {selectedMessage.read ? 'Lu' : 'Non lu'}
                  </div>
                  {selectedMessage.replied && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Répondu
                    </div>
                  )}
                </div>

                {/* Previous Reply */}
                {selectedMessage.replied && selectedMessage.replyMessage && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Votre réponse:</h3>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.replyMessage}</p>
                    </div>
                  </div>
                )}

                {/* Reply Form */}
                {!selectedMessage.replied && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Votre réponse:</h3>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Écrivez votre réponse..."
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    handleDelete(selectedMessage._id);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>

                {!selectedMessage.replied && (
                  <button
                    onClick={() => handleReply(selectedMessage._id)}
                    disabled={sendingReply || !replyText.trim()}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Reply className="h-4 w-4" />
                    {sendingReply ? 'Envoi...' : 'Répondre'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 rounded-lg bg-gray-300 text-gray-900 hover:bg-gray-400 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default AdminDashboard;

