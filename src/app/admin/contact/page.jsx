'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { messageAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AdminHeader from '@/components/admin/header';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { useLocale, useTranslations } from 'next-intl';
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

const URL_PATTERN = /(https?:\/\/[^\s]+)/gi;

const linkifyMessageText = (text = '') =>
  text.split(URL_PATTERN).map((part, index) => {
    if (!/^https?:\/\/[^\s]+$/i.test(part)) {
      return <span key={`text-${index}`}>{part}</span>;
    }

    const trailingPunctuationMatch = part.match(/[),.;!?]+$/);
    const trailingPunctuation = trailingPunctuationMatch ? trailingPunctuationMatch[0] : '';
    const cleanUrl = trailingPunctuation ? part.slice(0, -trailingPunctuation.length) : part;

    return (
      <span key={`link-${index}`}>
        <a
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {cleanUrl}
        </a>
        {trailingPunctuation}
      </span>
    );
  });

/**
 * ✅ IMPORTANT FIX:
 * MessageDetail is OUTSIDE the page component.
 * Otherwise it gets recreated on every render -> textarea loses focus after 1 char.
 */
function MessageDetail({
  isMobile = false,
  selectedMessage,
  user,
  replyText,
  setReplyText,
  sending,
  onBack,
  onDelete,
  onReply,
}) {
  const ti = useTranslations('admin.inbox');
  const locale = useLocale();
  const replyInputRef = useRef(null);

  useEffect(() => {
    if (!selectedMessage) return;
    if (selectedMessage.replyMessage) return;
    if (replyInputRef.current) replyInputRef.current.focus();
  }, [selectedMessage]);

  if (!selectedMessage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
        <MailOpen size={48} className="mb-4 opacity-20" />
        <p className="font-medium text-sm">{ti('selectMessage')}</p>
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
              onClick={onBack}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              aria-label={ti('backAria')}
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
            onClick={() => onDelete(selectedMessage._id)}
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
                {selectedMessage.object || ti('defaultSubject')}
              </h2>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                {ti('from')} <span className="font-semibold text-slate-700">{selectedMessage.name}</span>
              </p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none mb-6 md:mb-8">
            <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
              {linkifyMessageText(selectedMessage.message)}
            </div>
          </div>

          {/* Devis Attributes */}
          {selectedMessage.type === 'devis' && (selectedMessage.activity || selectedMessage.siren || selectedMessage.tva || selectedMessage.website) && (
            <div className="mb-8 md:mb-10 bg-orange-50 border border-orange-100 rounded-2xl p-4 md:p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-4">
                {ti('companyInfo')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedMessage.activity && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{ti('activity')}</p>
                    <p className="text-sm font-medium text-slate-800">{selectedMessage.activity}</p>
                  </div>
                )}
                {selectedMessage.siren && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{ti('siren')}</p>
                    <p className="text-sm font-medium text-slate-800">{selectedMessage.siren}</p>
                  </div>
                )}
                {selectedMessage.tva && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{ti('vatNumber')}</p>
                    <p className="text-sm font-medium text-slate-800">{selectedMessage.tva}</p>
                  </div>
                )}
                {selectedMessage.website && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{ti('website')}</p>
                    <a
                      href={selectedMessage.website.startsWith('http') ? selectedMessage.website : `https://${selectedMessage.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline break-all"
                    >
                      {selectedMessage.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Previous Reply */}
          {selectedMessage.replyMessage && (
            <div className="border-t border-slate-200 pt-6 md:pt-8 mb-6 md:mb-8">
              {['professionnel', 'devis'].includes(selectedMessage.type) && selectedMessage.companyName && (
                <div
                  className={`mb-4 p-4 border rounded-lg flex items-center gap-3 ${
                    selectedMessage.type === 'devis'
                      ? 'bg-orange-50 border-orange-100'
                      : 'bg-purple-50 border-purple-100'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded border ${
                        selectedMessage.type === 'devis'
                          ? 'bg-orange-100 border-orange-200'
                          : 'bg-purple-100 border-purple-200'
                      }`}
                    >
                      <Building2
                        className={`h-3 w-3 mr-1 ${
                          selectedMessage.type === 'devis' ? 'text-orange-600' : 'text-purple-600'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold ${
                          selectedMessage.type === 'devis' ? 'text-orange-600' : 'text-purple-600'
                        }`}
                      >
                        {selectedMessage.type === 'devis' ? ti('badgeQuote') : ti('badgePro')}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        selectedMessage.type === 'devis' ? 'text-orange-900' : 'text-purple-900'
                      }`}
                    >
                      {selectedMessage.companyName}
                    </p>
                    <p
                      className={`text-xs ${
                        selectedMessage.type === 'devis' ? 'text-orange-700' : 'text-purple-600'
                      }`}
                    >
                      {selectedMessage.type === 'devis' ? ti('quoteRequest') : ti('proContact')}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                    <div className="relative bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 md:p-5 rounded-xl border-2 border-slate-200 hover:border-emerald-300 transition-all duration-300 pointer-events-none select-none">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {user?.name || 'Admin'}
                            </p>
                            {selectedMessage.repliedAt && (
                              <p className="text-xs text-slate-500">
                                {new Date(selectedMessage.repliedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}{' '}
                                {ti('atTime')}{' '}
                                {new Date(selectedMessage.repliedAt).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="md:ml-11 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                          {selectedMessage.replyMessage}
                        </p>
                      </div>
                      <div className="mt-3 md:ml-11 flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-emerald-500" />
                        <span className="text-xs text-slate-500">{ti('archivedReadonly')}</span>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          )}

          {/* Reply Form - only if not yet replied */}
          {!selectedMessage.replyMessage && (
            <div className="border-t border-slate-200 pt-6 md:pt-8">
              <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-900">
                <Reply size={18} className="text-blue-600" /> {ti('replyToMessage')}
              </div>

              {['professionnel', 'devis'].includes(selectedMessage.type) && selectedMessage.companyName && (
                <div
                  className={`mb-4 p-4 border rounded-lg flex items-center gap-3 ${
                    selectedMessage.type === 'devis'
                      ? 'bg-orange-50 border-orange-100'
                      : 'bg-purple-50 border-purple-100'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded border ${
                        selectedMessage.type === 'devis'
                          ? 'bg-orange-100 border-orange-200'
                          : 'bg-purple-100 border-purple-200'
                      }`}
                    >
                      <Building2
                        className={`h-3 w-3 mr-1 ${
                          selectedMessage.type === 'devis' ? 'text-orange-600' : 'text-purple-600'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold ${
                          selectedMessage.type === 'devis' ? 'text-orange-600' : 'text-purple-600'
                        }`}
                      >
                        {selectedMessage.type === 'devis' ? ti('badgeQuote') : ti('badgePro')}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        selectedMessage.type === 'devis' ? 'text-orange-900' : 'text-purple-900'
                      }`}
                    >
                      {selectedMessage.companyName}
                    </p>
                    <p
                      className={`text-xs ${
                        selectedMessage.type === 'devis' ? 'text-orange-700' : 'text-purple-600'
                      }`}
                    >
                      {selectedMessage.type === 'devis' ? ti('quoteRequest') : ti('proContact')}
                    </p>
                  </div>
                </div>
              )}

              <textarea
                ref={replyInputRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all min-h-37.5 text-sm"
                placeholder={ti('replyPlaceholder')}
              />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={onReply}
                  disabled={sending || !replyText.trim()}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      {ti('sendingReply')}
                    </>
                  ) : (
                    <>
                      {ti('sendReplyCta')} <Send size={16} />
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

export default function ContactMessagesPage() {
  const ti = useTranslations('admin.inbox');
  const locale = useLocale();
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

    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const messageId = searchParams.get('message');
    if (messageId && messages.length > 0) {
      const message = messages.find((m) => m._id === messageId);
      if (message) {
        handleSelectMessage(message);
        window.history.replaceState({}, '', '/admin/contact');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, status: 'read' } : m)));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    setSending(true);
    try {
      const response = await messageAPI.reply(selectedMessage._id, replyText.trim());
      const updatedMessage = response.data || response;

      await messageAPI.updateStatus(selectedMessage._id, 'replied');

      // ⚠️ NOTE: Your backend replyToMessage already sends the email.
      // If you keep this call, the client may receive 2 emails.
      // await messageAPI.sendClientReplyEmail(
      //   selectedMessage.name,
      //   selectedMessage.email,
      //   selectedMessage.message,
      //   replyText.trim()
      // );

      const messageWithReply = {
        ...selectedMessage,
        status: 'replied',
        replyMessage: replyText.trim(),
        repliedAt: new Date().toISOString(),
      };

      setMessages((prev) => prev.map((m) => (m._id === selectedMessage._id ? messageWithReply : m)));
      setSelectedMessage(messageWithReply);
      setReplyText('');
    } catch (err) {
      console.error("Erreur lors de l'envoi de la réponse:", err);
    } finally {
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
      setMessages((prev) => prev.filter((m) => m._id !== messageToDelete));
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
                <Inbox size={20} className="text-blue-600" /> {ti('inboxTitle')}
              </h1>
              <button
                onClick={fetchMessages}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={ti('searchPlaceholder')}
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
                  {f === 'all' ? ti('filterAll') : f === 'new' ? ti('filterNew') : ti('filterReplied')}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">{ti('noMessages')}</div>
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
                      className={`text-sm font-bold ${msg.status === 'new' ? 'text-slate-900' : 'text-slate-600'}`}
                    >
                      {msg.name}
                    </span>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(msg.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
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
                        title={ti('deleteTooltip')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {ti('subjectPrefix')}{' '}
                    <span className="text-xs text-blue-600 font-semibold truncate mb-1">
                      {msg.object || ti('noSubject')}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1">{msg.message}</p>

                  {['professionnel', 'devis'].includes(msg.type) && (
                    <div className="mt-2 flex gap-2">
                      <span
                        className={`text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wide border flex items-center gap-1 ${
                          msg.type === 'devis'
                            ? 'bg-orange-100 border-orange-200 text-orange-700'
                            : 'bg-purple-50 border-purple-200 text-purple-700'
                        }`}
                      >
                        <Building2 size={12} /> {msg.type === 'devis' ? ti('badgeDevis') : ti('badgeTypePro')}
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
          <MessageDetail
            selectedMessage={selectedMessage}
            user={user}
            replyText={replyText}
            setReplyText={setReplyText}
            sending={sending}
            onBack={() => setSelectedMessage(null)}
            onDelete={handleDelete}
            onReply={handleReply}
          />
        </div>

        {/* MAIN CONTENT (Mobile overlay) */}
        {selectedMessage && (
          <div className="md:hidden absolute inset-0 z-40 flex flex-col bg-white">
            <MessageDetail
              isMobile
              selectedMessage={selectedMessage}
              user={user}
              replyText={replyText}
              setReplyText={setReplyText}
              sending={sending}
              onBack={() => setSelectedMessage(null)}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          </div>
        )}

        <DeleteConfirmationModal
          isOpen={deleteAlertOpen}
          onClose={() => setDeleteAlertOpen(false)}
          onConfirm={confirmDelete}
          title={ti('deleteTitle')}
          description={ti('deleteDescription')}
          isDeleting={false}
        />
      </div>
    </>
  );
}
