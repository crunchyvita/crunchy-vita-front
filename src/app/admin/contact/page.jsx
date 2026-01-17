'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { messageAPI } from '@/lib/api';
import { 
  Mail, 
  MailOpen, 
  Trash2, 
  RefreshCw, 
  Reply, 
  Search,
  CheckCircle2,
  Clock,
  X,
  Inbox,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export default function ContactMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setError('Accès refusé. Redirection...');
      setTimeout(() => router.push('/auth/login'), 2000);
      return;
    }
    fetchMessages();
  }, [router]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await messageAPI.list();
      setMessages(data.messages || data || []);
      setError('');
    } catch (err) {
      if (err.status === 401) {
        setError('Session expirée.');
        localStorage.removeItem('token');
        router.push('/auth/login');
      } else {
        setError(err.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
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
      setMessages(messages.filter(m => m._id !== messageToDelete));
      if (selectedMessage?._id === messageToDelete) setSelectedMessage(null);
      setDeleteAlertOpen(false);
      setMessageToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression', err);
      setDeleteAlertOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return console.log('Veuillez saisir une réponse');
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
      
      setReplyText('');
      fetchMessages();
      setSelectedMessage(null); // Fermeture auto après réponse
    } catch (err) {
        console.error(err);
    }
  };

  const handleOpenMessage = async (message) => {
    setSelectedMessage(message);
    if (message.status === 'new') {
      try {
        await messageAPI.updateStatus(message._id, 'read');
        setMessages(messages.map(m => m._id === message._id ? {...m, status: 'read'} : m));
      } catch (err) { console.error(err); }
    }
  };

  const filteredMessages = messages
    .filter(msg => filter === 'all' ? true : msg.status === filter)
    .filter(msg => 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      msg.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStatusConfig = (status) => {
    const configs = {
      new: { color: 'bg-blue-100 text-blue-700 ring-blue-600/20', label: 'Nouveau', icon: <Clock size={12}/> },
      read: { color: 'bg-slate-100 text-slate-700 ring-slate-600/20', label: 'Lu', icon: <MailOpen size={12}/> },
      replied: { color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20', label: 'Répondu', icon: <CheckCircle2 size={12}/> },
    };
    return configs[status] || configs.new;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <p className="text-slate-500 font-medium">Chargement...</p>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* HEADER FULL WIDTH */}
      <header className="w-full bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <div className="max-w-450 mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg text-white">
              <Inbox size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">Gestion Contacts</h1>
              <p className="text-xs text-slate-500 mt-1 font-medium italic">
                {messages.filter(m => m.status === 'new').length} non lus
              </p>
            </div>
          </div>
          <button
            onClick={fetchMessages}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm text-sm font-semibold"
          >
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 max-w-450 mx-auto w-full">
        
        {/* SEARCH & FILTERS */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Rechercher un contact..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {['all', 'new', 'read', 'replied'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'new' ? 'Nouveaux' : f === 'read' ? 'Lus' : 'Répondus'}
              </button>
            ))}
          </div>
        </div>

        {/* GRID LAYOUT */}
        {filteredMessages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <Mail className="mx-auto text-slate-300 mb-2" size={40} />
            <p className="text-slate-500 text-sm font-medium">Aucun message trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredMessages.map((msg) => {
              const config = getStatusConfig(msg.status);
              return (
                <div
                  key={msg._id}
                  onClick={() => handleOpenMessage(msg)}
                  className={`group bg-white rounded-2xl p-5 border transition-all cursor-pointer hover:border-blue-300 hover:shadow-md ${
                    msg.status === 'new' ? 'border-l-4 border-l-blue-600 shadow-sm' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                      {msg.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 truncate text-sm mb-1">{msg.name}</h3>
                  <p className="text-[11px] text-slate-400 truncate mb-3">{msg.email}</p>
                  <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed mb-4 flex-1">
                    {msg.message}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {formatDate(msg.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(msg._id);
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL CONVERSATION (Taille réduite) */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[1.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Détails de la conversation</span>
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
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getStatusConfig(selectedMessage.status).color}`}>
                  {getStatusConfig(selectedMessage.status).label}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                <div className="mt-3 text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                  <Clock size={12}/> Reçu le {formatDate(selectedMessage.createdAt)}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase px-1">
                  <Reply size={14} className="text-blue-600" /> Réponse rapide
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-25 text-sm text-slate-700"
                  placeholder="Écrivez votre réponse..."
                />
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleReply(selectedMessage._id)}
                    className="flex-1 bg-green-900 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    Envoyer
                  </button>
                
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL  --- */}
      {deleteAlertOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
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
                className="flex-1 px-4 py-4 text-sm font-black text-red-600 hover:bg-red-50 transition-colors tracking-tight"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}