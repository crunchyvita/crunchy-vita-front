"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Bell, MessageSquare, ChevronDown, LogOut, User, LayoutDashboard, Trash2, Building2 } from "lucide-react";
import { notificationAPI } from "@/lib/api";

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
      console.error('Fetch messages error:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const countData = await notificationAPI.getUnreadCount(true);
      if (countData?.unreadCount !== undefined) setUnreadNotifications(countData.unreadCount);
      const data = await notificationAPI.list(20, null, true);
      setNotifications(data?.notifications || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Fetch notifications error:', error);
      setNotifications([]);
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

  return (
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
                  <div className="p-4 bg-slate-100 flex justify-between items-center font-bold text-sm">
                    Alertes Système 
                    <button 
                      onClick={async () => { 
                        await notificationAPI.markAllAsRead(); 
                        fetchNotifications(); 
                      }} 
                      className="text-blue-600 text-xs font-medium"
                    >
                      Tout marquer
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">Aucune notification</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id} 
                          className="p-4 hover:bg-slate-50 transition text-sm cursor-pointer" 
                          onClick={() => setShowNotificationsDropdown(false)}
                        >
                          <p className="font-bold">{n.title}</p>
                          <p className="text-slate-600 text-xs line-clamp-1">{n.message}</p>
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
  );
}
