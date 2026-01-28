'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { messageAPI } from '@/lib/api';
import AdminHeader from '@/components/admin/header';
import { 
  Mail, MailOpen, Trash2, RefreshCw, Reply, Search,
  CheckCircle2, Clock, Inbox, ChevronRight, AlertTriangle,
  Filter, RotateCcw, User, Building2, Send
} from 'lucide-react';

export default function ContactMessagesPage() {
  const router = useRouter();
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
    
    // Set up polling for real-time updates (every 2 seconds)
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 2000);
    
    // Cleanup on unmount
    return () => clearInterval(pollInterval);
  }, []);

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
        setMessages(messages.map(m => m._id === msg._id ? {...m, status: 'read'} : m));
      } catch (err) { console.error(err); }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    
    setSending(true);
    try {
      // Run all operations in parallel for faster response
      await Promise.all([
        messageAPI.reply(selectedMessage._id, replyText.trim()),
        messageAPI.updateStatus(selectedMessage._id, 'replied'),
        messageAPI.sendClientReplyEmail(
          selectedMessage.name,
          selectedMessage.email,
          selectedMessage.message,
          replyText.trim()
        )
      ]);
      
      // Update state without reloading
      setMessages(messages.map(m => 
        m._id === selectedMessage._id ? {...m, status: 'replied'} : m
      ));
      setSelectedMessage({...selectedMessage, status: 'replied'});
      setReplyText('');
      setSending(false);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la réponse:', err);
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

  const filteredMessages = messages
    .filter(msg => filter === 'all' ? true : msg.status === filter)
    .filter(msg => typeFilter === 'all' ? true : msg.type === typeFilter)
    .filter(msg => 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      msg.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <>
    <AdminHeader />
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      
      {/* SIDEBAR : LISTE DES MESSAGES */}
      <div className="w-full md:w-100 flex flex-col border-r border-slate-200 bg-slate-50/50">
        
        {/* Header Liste */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Inbox size={20} className="text-blue-600" /> Inbox
            </h1>
            <button onClick={fetchMessages} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
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
                  filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                {msg.status === 'new' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                )}
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-bold ${msg.status === 'new' ? 'text-slate-900' : 'text-slate-600'}`}>
                    {msg.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(msg.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                <p className="text-xs text-slate-500 line-clamp-1"> Objet :<span className="text-xs text-blue-600 font-semibold truncate mb-1">{msg.object || "Sans objet"}</span></p>
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

      {/* MAIN CONTENT : DETAIL DU MESSAGE */}
      <div className="hidden md:flex flex-1 flex-col bg-white">
        {selectedMessage ? (
          <>
            {/* Toolbar Detail */}
            <div className="h-18.25 border-b border-slate-200 px-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{selectedMessage.name}</span>
                    <span className="text-xs text-slate-500">{selectedMessage.email}</span>
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
            <div className="flex-1 overflow-y-auto p-8 lg:p-12">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                   <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold">
                      {selectedMessage.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-slate-900"> {selectedMessage.object || "Demande de contact"}</h2>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        De: <span className="font-semibold text-slate-700">{selectedMessage.name}</span> 
                      </p>
                   </div>
                </div>

                <div className="prose prose-slate max-w-none mb-12">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Section Réponse */}
                <div className="border-t border-slate-200 pt-8">
                  <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-900">
                    <Reply size={18} className="text-blue-600" /> Répondre à ce message
                  </div>
                  
                  {selectedMessage.type === 'professionnel' && selectedMessage.companyName && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-2">
                      <Building2 size={16} className="text-purple-600" />
                      <div>
                        <p className="text-xs font-semibold text-purple-900">{selectedMessage.companyName}</p>
                        <p className="text-[10px] text-purple-600">Contact professionnel</p>
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
                      disabled={sending || !replyText.trim()}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
            <MailOpen size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-sm">Sélectionnez un message pour le lire</p>
          </div>
        )}
      </div>

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