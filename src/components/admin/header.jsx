"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useRouter, usePathname } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  ChevronRight,
  LogOut,
  User,
  Trash2,
  Building2,
  Mail,
  Menu,
  FileText,
  Settings,
} from "lucide-react";
import { notificationAPI, reviewAPI } from "@/lib/api";
import { useAdminLayout } from "@/context/AdminLayoutContext";

export default function AdminHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin");
  const { toggleSidebar } = useAdminLayout();
  const langRef = useRef(null);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showContactNotificationsDropdown, setShowContactNotificationsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [contactNotifications, setContactNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadContactNotifications, setUnreadContactNotifications] = useState(0);
  const [skipNextPoll, setSkipNextPoll] = useState(false);
  const [deletedNotificationIds, setDeletedNotificationIds] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("deletedNotificationIds");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });
  const [deletedContactNotificationIds, setDeletedContactNotificationIds] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("deletedContactNotificationIds");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });

  useEffect(() => {
    const close = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setShowLangMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const getCurrentFlag = () => (locale === "fr" ? "/assets/images/fr.png" : "/assets/images/en.png");

  useEffect(() => {
    if (isAuthenticated && (user?.role === "ADMIN" || user?.role === "SUPERADMIN")) {
      fetchNotifications();
      fetchContactNotifications();
      const pollInterval = setInterval(() => {
        if (skipNextPoll) {
          setSkipNextPoll(false);
          return;
        }
        fetchNotifications();
        fetchContactNotifications();
      }, 2000);
      return () => clearInterval(pollInterval);
    }
  }, [isAuthenticated, user, skipNextPoll]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationAPI.list(20, null, true);
      const notificationsList = data?.notifications || (Array.isArray(data) ? data : []);
      const filteredNotifications = notificationsList.filter((n) => !deletedNotificationIds.has(n._id));
      setNotifications(filteredNotifications);
      const pendingResponse = await reviewAPI.listPending();
      const pendingComments = pendingResponse?.data || pendingResponse || [];
      const pendingCommentIds = new Set(pendingComments.map((c) => c.commentId?.toString()));
      const unreadCount = filteredNotifications.filter(
        (n) => !n.isRead && (n.type !== "new_comment" || pendingCommentIds.has(n.relatedId?.toString()))
      ).length;
      setUnreadNotifications(unreadCount);
    } catch (error) {
      console.error("Fetch notifications error:", error);
      setNotifications([]);
      setUnreadNotifications(0);
    }
  };

  const fetchContactNotifications = async () => {
    try {
      const data = await notificationAPI.list(20, null, false);
      const notificationsList = data?.notifications || (Array.isArray(data) ? data : []);
      const filteredContactNotifications = notificationsList.filter(
        (n) => n.type === "contact_message" && !deletedContactNotificationIds.has(n._id)
      );
      setContactNotifications(filteredContactNotifications);
      const unreadCount = filteredContactNotifications.filter((n) => !n.isRead).length;
      setUnreadContactNotifications(unreadCount);
    } catch (error) {
      console.error("Fetch contact notifications error:", error);
      setContactNotifications([]);
      setUnreadContactNotifications(0);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markNotificationAsRead(notification._id);

    if (notification?.type === "new_comment") {
      const productId = notification?.metadata?.productId;
      const commentId = notification?.relatedId;
      if (productId && commentId) {
        router.push(`/admin/products/${productId}?review=${commentId}&moderateMode=true&tab=pending`);
      }
      setShowNotificationsDropdown(false);
    } else if (notification?.type === "stock_alert") {
      const productId = notification?.relatedId;
      if (productId) router.push(`/admin/stock/edit/${productId}`);
      setShowNotificationsDropdown(false);
    } else if (notification?.type === "new_order") {
      const oid = notification?.relatedId;
      if (oid) router.push(`/admin/orders?order=${oid}`);
      else router.push("/admin/orders");
      setShowNotificationsDropdown(false);
    } else {
      setShowNotificationsDropdown(false);
    }
  };

  const handleContactNotificationClick = (notification) => {
    if (!notification.isRead) markContactNotificationAsRead(notification._id);
    const messageId = notification?.relatedId;
    if (messageId) router.push(`/admin/contact?message=${messageId}`);
    else router.push("/admin/contact");
    setShowContactNotificationsDropdown(false);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n)));
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const markContactNotificationAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setContactNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n)));
      setUnreadContactNotifications((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark contact notification as read error:", error);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      setSkipNextPoll(true);
      const newDeletedIds = new Set([...deletedNotificationIds, notificationId]);
      setDeletedNotificationIds(newDeletedIds);
      if (typeof window !== "undefined") {
        localStorage.setItem("deletedNotificationIds", JSON.stringify([...newDeletedIds]));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadNotifications((prev) => {
        const notif = notifications.find((n) => n._id === notificationId);
        return notif && !notif.isRead ? Math.max(0, prev - 1) : prev;
      });
      await notificationAPI.delete(notificationId);
    } catch (error) {
      console.error("[Admin Header] Delete notification error:", error);
      setDeletedNotificationIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        if (typeof window !== "undefined") {
          localStorage.setItem("deletedNotificationIds", JSON.stringify([...newSet]));
        }
        return newSet;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  };

  const handleMarkAllContactNotificationsAsRead = async () => {
    try {
      await Promise.all(contactNotifications.filter((n) => !n.isRead).map((n) => notificationAPI.markAsRead(n._id)));
      fetchContactNotifications();
    } catch (error) {
      console.error("Mark all contact notifications as read error:", error);
    }
  };

  const handleDeleteContactNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      setSkipNextPoll(true);
      const newDeletedIds = new Set([...deletedContactNotificationIds, notificationId]);
      setDeletedContactNotificationIds(newDeletedIds);
      if (typeof window !== "undefined") {
        localStorage.setItem("deletedContactNotificationIds", JSON.stringify([...newDeletedIds]));
      }
      setContactNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadContactNotifications((prev) => {
        const notif = contactNotifications.find((n) => n._id === notificationId);
        return notif && !notif.isRead ? Math.max(0, prev - 1) : prev;
      });
      await notificationAPI.delete(notificationId);
    } catch (error) {
      console.error("[Admin Header] Delete contact notification error:", error);
      setDeletedContactNotificationIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        if (typeof window !== "undefined") {
          localStorage.setItem("deletedContactNotificationIds", JSON.stringify([...newSet]));
        }
        return newSet;
      });
    }
  };

  const localeTag = locale === "fr" ? "fr-FR" : "en-GB";

  return (
    <>
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 w-full shadow-sm">
        <div className="w-full px-4 sm:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition"
                aria-label={t("header.openMenu")}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push("/admin/dashboard")}
                onKeyDown={(e) => e.key === "Enter" && router.push("/admin/dashboard")}
                role="button"
                tabIndex={0}
              >
                <img src="/assets/images/logo.png" alt="" className="h-12 w-12 object-contain" />
                <h1 className="text-lg font-bold">
                  {t("header.brandTitle")} <span style={{ color: "#556622" }}>{t("header.brandAdmin")}</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/settings")}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition"
                title={t("header.settingsTitle")}
                aria-label={t("header.settingsAria")}
              >
                <Settings className="h-6 w-6" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactNotificationsDropdown(!showContactNotificationsDropdown);
                    setShowNotificationsDropdown(false);
                    setShowProfileDropdown(false);
                    setShowLangMenu(false);
                  }}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition"
                  title={t("header.contactNotifTitle")}
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
                        {t("header.contactMessagesTitle")}
                      </span>
                      {unreadContactNotifications > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllContactNotificationsAsRead}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {t("header.markAllRead")}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {contactNotifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">{t("header.noContactNotifications")}</div>
                      ) : (
                        contactNotifications.map((n) => {
                          const contactType = n.metadata?.contactType;
                          const companyName = n.metadata?.companyName;
                          const isQuoteRequest = contactType === "devis";
                          const isBusinessContact =
                            ["professionnel", "devis"].includes(contactType) || !!companyName;
                          const senderName = n.metadata?.senderName || t("header.senderFallback");
                          const displayName = senderName;
                          const subject = n.message?.split(":")[1]?.trim() || "";
                          return (
                            <div
                              key={n._id}
                              className="group relative hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-all duration-200"
                            >
                              <div
                                onClick={() => handleContactNotificationClick(n)}
                                className="p-4 flex items-start gap-3 relative"
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && handleContactNotificationClick(n)}
                              >
                                {isBusinessContact && (
                                  <div className="absolute bottom-2 right-2">
                                    <div
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded border ${
                                        isQuoteRequest
                                          ? "bg-orange-100 border-orange-200"
                                          : "bg-purple-100 border-purple-200"
                                      }`}
                                    >
                                      {isQuoteRequest ? (
                                        <FileText className="h-3 w-3 text-orange-600 mr-1" />
                                      ) : (
                                        <Building2 className="h-3 w-3 text-purple-600 mr-1" />
                                      )}
                                      <span
                                        className={`text-[10px] font-bold ${
                                          isQuoteRequest ? "text-orange-600" : "text-purple-600"
                                        }`}
                                      >
                                        {isQuoteRequest ? t("header.badgeQuote") : t("header.badgePro")}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 pr-12">
                                  <div className="flex items-center gap-2">
                                    {!n.isRead && (
                                      <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                                    )}
                                    <p
                                      className={`text-sm font-semibold ${
                                        n.isRead ? "text-slate-600" : "text-slate-900"
                                      }`}
                                    >
                                      {displayName}
                                    </p>
                                  </div>
                                  {subject && (
                                    <p className="text-xs text-slate-600 font-medium mt-2 line-clamp-2">{subject}</p>
                                  )}
                                  {n.createdAt && (
                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                                      <span>
                                        {new Date(n.createdAt).toLocaleDateString(localeTag, {
                                          day: "2-digit",
                                          month: "short",
                                        })}{" "}
                                        {locale === "fr" ? "à" : "at"}{" "}
                                        {new Date(n.createdAt).toLocaleTimeString(localeTag, {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteContactNotification(n._id, e)}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100"
                                  title={t("header.deleteNotification")}
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

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationsDropdown(!showNotificationsDropdown);
                    setShowContactNotificationsDropdown(false);
                    setShowProfileDropdown(false);
                    setShowLangMenu(false);
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
                      <span>{t("header.notificationsTitle")}</span>
                      {unreadNotifications > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {t("header.markAllRead")}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">{t("header.noNotifications")}</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between group border-b border-slate-100 last:border-0"
                          >
                            <div
                              onClick={() => handleNotificationClick(n)}
                              className="flex-1 min-w-0 flex items-start gap-2"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === "Enter" && handleNotificationClick(n)}
                            >
                              {!n.isRead && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold">{n.title}</p>
                                <p className="text-xs text-slate-500 line-clamp-1">{n.message}</p>
                                {n.createdAt && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {new Date(n.createdAt).toLocaleDateString(localeTag, {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}{" "}
                                    {locale === "fr" ? "à" : "at"}{" "}
                                    {new Date(n.createdAt).toLocaleTimeString(localeTag, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotification(n._id, e)}
                              className="p-1.5 ml-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                              title={t("header.deleteNotification")}
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

              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileDropdown(!showProfileDropdown);
                    setShowNotificationsDropdown(false);
                    setShowContactNotificationsDropdown(false);
                    setShowLangMenu(false);
                  }}
                  className="p-0.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 transition"
                  aria-expanded={showProfileDropdown}
                  aria-haspopup="menu"
                  title={t("header.openProfileMenu")}
                  aria-label={t("header.openProfileMenu")}
                >
                  {user?.photo ? (
                    <img
                      src={user.photo}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover shrink-0"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm uppercase shrink-0"
                    style={{ display: user?.photo ? "none" : "flex" }}
                  >
                    {user?.name?.[0] || <User className="h-4 w-4" />}
                  </div>
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-visible z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 bg-slate-50">
                      <div className="flex items-center gap-3 mb-2">
                        {user?.photo ? (
                          <img
                            src={user.photo}
                            alt={user.name || ""}
                            className="h-12 w-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg uppercase"
                          style={{ display: user?.photo ? "none" : "flex" }}
                        >
                          {user?.name?.[0] || <User className="h-5 w-5" />}
                        </div>
                      </div>
                      <p className="text-sm font-bold">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          router.push("/profile");
                          setShowProfileDropdown(false);
                          setShowLangMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium"
                      >
                        <User className="h-4 w-4" /> {t("header.profile")}
                      </button>
                    </div>
                    <div className="p-2 border-t border-slate-100 relative" ref={langRef}>
                      <button
                        type="button"
                        onClick={() => setShowLangMenu((v) => !v)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium"
                        aria-expanded={showLangMenu}
                        aria-haspopup="menu"
                      >
                        <img
                          src={getCurrentFlag()}
                          alt=""
                          className="h-5 w-5 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <span className="flex-1 text-left">
                          {locale === "fr" ? t("header.languageFrench") : t("header.languageEnglish")}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      </button>
                      {showLangMenu && (
                        <div className="absolute right-full top-0 mr-1.5 w-[11.5rem] bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-[60]">
                          <ul className="flex flex-col">
                            <li>
                              <Link
                                href={pathname}
                                locale="fr"
                                onClick={() => {
                                  setShowLangMenu(false);
                                  setShowProfileDropdown(false);
                                }}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                                  locale === "fr"
                                    ? "font-semibold text-[#556822] bg-slate-50/80"
                                    : "text-slate-700"
                                }`}
                              >
                                <img
                                  src="/assets/images/fr.png"
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover border border-gray-100"
                                />
                                {t("header.languageFrench")}
                              </Link>
                            </li>
                            <li>
                              <Link
                                href={pathname}
                                locale="en"
                                onClick={() => {
                                  setShowLangMenu(false);
                                  setShowProfileDropdown(false);
                                }}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                                  locale === "en"
                                    ? "font-semibold text-[#556822] bg-slate-50/80"
                                    : "text-slate-700"
                                }`}
                              >
                                <img
                                  src="/assets/images/en.png"
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover border border-gray-100"
                                />
                                {t("header.languageEnglish")}
                              </Link>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setShowLangMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                      >
                        <LogOut className="h-4 w-4" /> {t("header.logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
