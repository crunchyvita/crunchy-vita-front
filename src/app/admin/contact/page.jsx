'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { messageAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AdminHeader from '@/components/admin/header';
import {
  MailOpen,
  Trash2,
  RefreshCw,
  Reply,
  Search,
  Inbox,
  AlertTriangle,
  Building2,
  Send,
  ArrowLeft,
} from 'lucide-react';

export default function ContactMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();

    // Polling for real-time updates (every 2 seconds)
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => clearInterval(pollInterval);
  }, []);

  // Handle opening a specific message from URL parameter
  useEffect(() => {
    const messageId = searchParams.get('message');
    if (messageId && messages.length > 0) {
      const message = messages.find((m) => m._id === messageId);
      if (message) {
        handleSelectMessage(message);
        window.history.replaceState({}, '', '/admin/contact');
      }
    }
  }, [searchParams, messages, loading]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await messageAPI.list();
      setMessages(data.messages || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    if (msg.status === 'new') {
      try {
        await messageAPI.updateStatus(msg._id, 'read');
        setMessages(messages.map((m) => (m._id === msg._id ? { ...m, status: 'read' } : m)));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    setSending(true);
    try {
      // Send reply and get updated message with new reply in array
      const response = await messageAPI.reply(selectedMessage._id, replyText.trim());
      const updatedMessage = response.data || response;

      // Update status
      await messageAPI.updateStatus(selectedMessage._id, 'replied');

      // Send email
      await messageAPI.sendClientReplyEmail(
        selectedMessage.name,
        selectedMessage.email,
        selectedMessage.message,
        replyText.trim()
      );

      // Update state with the new reply included
      const messageWithReply = {
        ...selectedMessage,
        status: 'replied',
        replies: updatedMessage.replies || [
          ...(selectedMessage.replies || []),
          {
            message: replyText.trim(),
            sentAt: new Date().toISOString(),
            sentBy: 'Admin',
          },
        ],
      };

      setMessages(messages.map((m) => (m._id === selectedMessage._id ? messageWithReply : m)));
      setSelectedMessage(messageWithReply);
      setReplyText('');
      setSending(false);
    } catch (err) {
      console.error("Erreur lors de l'envoi de la réponse:", err);
      setSending(false);
    }
  };

  const handleDelete = (id) => {
    setMessageToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;
    try {
      await messageAPI.delete(messageToDelete);
      setMessages(messages.filter((m) => m._id !== messageToDelete));
      if (selectedMessage?._id === messageToDelete) setSelectedMessage(null);
      setDeleteAlertOpen(false);
      setMessageToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression', err);
      setDeleteAlertOpen(false);
      setMessageToDelete(null);
    }
  };

  const filteredMessages = messages
    .filter((msg) => (filter === 'all' ? true : msg.status === filter))
    .filter((msg) => (typeFilter === 'all' ? true : msg.type === typeFilter))
    .filter(
      (msg) =>
        msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  function MessageDetail({ isMobile = false }) {
    if (!selectedMessage) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
          <MailOpen size={48} className="mb-4 opacity-20" />
          <p className="font-medium text-sm">Sélectionnez un message pour le lire</p>
        </div>
      );
    }

    return (
      <>
        {/* Toolbar Detail */}
        <div className="border-b border-slate-200 px-4 md:px-8 flex items-center justify-between min-h-[73px]">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            {isMobile && (
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate">{selectedMessage.name}</span>
              <a
                href={`mailto:${selectedMessage.email}`}
                className="text-xs text-blue-500 hover:underline cursor-pointer truncate"
              >
                {selectedMessage.email}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDelete(selectedMessage._id)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Corps du Message */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold flex-shrink-0">
                {selectedMessage.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 break-words">
                  {selectedMessage.object || 'Demande de contact'}
                </h2>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  De: <span className="font-semibold text-slate-700">{selectedMessage.name}</span>
                </p>
              </div>
            </div>

            <div className="prose prose-slate max-w-none mb-10 md:mb-12">
              <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            {/* Section Réponses précédentes */}
            {selectedMessage.replies && selectedMessage.replies.length > 0 && (
              <div className="border-t border-slate-200 pt-6 md:pt-8 mb-6 md:mb-8">
                {selectedMessage.type === 'professionnel' && selectedMessage.companyName && (
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center px-2 py-1 rounded bg-purple-100 border border-purple-200">
                        <Building2 className="h-3 w-3 text-purple-600 mr-1" />
                        <span className="text-[10px] font-bold text-purple-600">PRO</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-purple-900 truncate">
                        {selectedMessage.companyName}
                      </p>
                      <p className="text-xs text-purple-600">Contact professionnel</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {selectedMessage.replies.map((reply, index) => (
                    <div key={index} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 md:p-5 rounded-xl border-2 border-slate-200 hover:border-emerald-300 transition-all duration-300 pointer-events-none select-none">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {user?.name || 'Admin'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(reply.sentAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}{' '}
                                à{' '}
                                {new Date(reply.sentAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="md:ml-11 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                            {reply.message}
                          </p>
                        </div>

                        {/* Footer indicator */}
                        <div className="mt-3 md:ml-11 flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-emerald-500" />
                          <span className="text-xs text-slate-500">Message archivé - Non modifiable</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section Réponse - Disponible seulement si pas de réponse précédente */}
            {(!selectedMessage.replies || selectedMessage.replies.length === 0) && (
              <div className="border-t border-slate-200 pt-6 md:pt-8">
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-900">
                  <Reply size={18} className="text-blue-600" /> Répondre à ce message
                </div>

                {selectedMessage.type === 'professionnel' && selectedMessage.companyName && (
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center px-2 py-1 rounded bg-purple-100 border border-purple-200">
                        <Building2 className="h-3 w-3 text-purple-600 mr-1" />
                        <span className="text-[10px] font-bold text-purple-600">PRO</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-purple-900 truncate">
                        {selectedMessage.companyName}
                      </p>
                      <p className="text-xs text-purple-600">Contact professionnel</p>
                    </div>
                  </div>
                )}

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all min-h-37.5 text-sm"
                  placeholder="Votre message..."
                />

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleReply}
                    className="text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{backgroundColor: '#556622', boxShadow: '0 10px 15px rgba(85, 102, 34, 0.2)'}}
                    onMouseEnter={(e) => !sending && (e.target.style.backgroundColor = '#3d4617', e.target.style.boxShadow = '0 15px 25px rgba(85, 102, 34, 0.3)')}
                    onMouseLeave={(e) => !sending && (e.target.style.backgroundColor = '#556622', e.target.style.boxShadow = '0 10px 15px rgba(85, 102, 34, 0.2)')}
                    disabled={sending || !replyText.trim()}
                  >
                    {sending ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Envoyer la réponse <Send size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader />

      <div className="relative flex h-screen bg-white overflow-hidden font-sans">
        {/* SIDEBAR : LISTE DES MESSAGES */}
        <div
          className={`w-full md:w-100 flex flex-col border-r border-slate-200 bg-slate-50/50 ${
            selectedMessage ? 'md:flex hidden' : 'flex'
          }`}
        >
          {/* Header Liste */}
          <div className="p-4 border-b border-slate-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Inbox size={20} className="text-blue-600" /> Inbox
              </h1>
              <button
                onClick={fetchMessages}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Onglets Rapides */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
              {['all', 'new', 'replied'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all uppercase tracking-wider ${
                    filter === f
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f === 'all' ? 'Tous' : f === 'new' ? 'Nouveaux' : 'Répondus'}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Aucun message trouvé</div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`relative p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-white ${
                    selectedMessage?._id === msg._id ? 'bg-white ring-1 ring-inset ring-blue-500/10' : ''
                  }`}
                >
                  {msg.status === 'new' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}

                  <div className="flex justify-between items-start mb-1 gap-3">
                    <span
                      className={`text-sm font-bold ${
                        msg.status === 'new' ? 'text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      {msg.name}
                    </span>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(msg.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(msg._id);
                        }}
                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {' '}
                    Objet :
                    <span className="text-xs text-blue-600 font-semibold truncate mb-1">
                      {msg.object || 'Sans objet'}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1">{msg.message}</p>

                  {msg.type === 'professionnel' && (
                    <div className="mt-2 flex gap-2">
                      <span className="text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wide ring-1 ring-inset flex items-center gap-1 bg-purple-50 text-purple-700 ring-purple-600/20">
                        <Building2 size={12} /> Pro
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN CONTENT (Desktop) */}
        <div className="hidden md:flex flex-1 flex-col bg-white">
          <MessageDetail />
        </div>

        {/* MAIN CONTENT (Mobile overlay) */}
        {selectedMessage && (
          <div className="md:hidden absolute inset-0 z-40 flex flex-col bg-white">
            <MessageDetail isMobile />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteAlertOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                  className="flex-1 px-4 py-4 text-sm font-black text-red-600 hover:bg-red-50 transition-colors tracking-tight"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
