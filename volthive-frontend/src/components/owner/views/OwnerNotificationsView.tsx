'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOwnerNotifications, OwnerNotification } from '../../../context/OwnerNotificationContext';
import ConfirmModal from '../../common/ConfirmModal';
import Toast from '../../common/Toast';

interface OwnerNotificationsViewProps {
  onNavigate?: (tab: string) => void;
}

const timeAgo = (iso?: string | null) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function OwnerNotificationsView({ onNavigate }: OwnerNotificationsViewProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    clearAll,
  } = useOwnerNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'booking' | 'message' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' | 'info' } | null>(null);
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filtered = notifications.filter(n => {
    // Tab filter
    if (activeTab === 'unread' && (n.read || n.archived)) return false;
    if (activeTab === 'archived' && !n.archived) return false;
    if (activeTab !== 'archived' && n.archived) return false;
    if (activeTab === 'booking' && n.type !== 'booking') return false;
    if (activeTab === 'message' && n.type !== 'message') return false;

    // Search query
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q) ||
      (n.stationName && n.stationName.toLowerCase().includes(q)) ||
      (n.driverName && n.driverName.toLowerCase().includes(q))
    );
  });

  const handleOpenAction = (n: OwnerNotification) => {
    markAsRead(n.id);
    if (n.targetTab && onNavigate) {
      onNavigate(n.targetTab);
    }
  };

  return (
    <div className="w-full relative font-sans space-y-5 pb-16">
      
      {/* ── 1. CLEAN SAAS HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-6 sm:py-5 bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white font-black flex items-center justify-center shadow-xs shrink-0">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-(--brand-ink)">
                Notification Center
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider border border-rose-200 animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-(--brand-muted) font-medium mt-0.5">
              Real-time audit log of incoming driver bookings, operational updates, and customer messages.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={() => {
                markAllAsRead();
                setToastMessage({ msg: 'All notifications marked as read.', type: 'info' });
              }}
              className="px-3.5 py-2 rounded-2xl bg-white hover:bg-(--surface-soft) border border-[#e0e5e3] text-xs font-black text-(--brand-ink) shadow-2xs hover:shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 text-(--brand-green-deep)">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black shadow-2xs hover:shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. FILTER TABS & SEARCH BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'all', label: 'All Alerts', count: notifications.filter(n => !n.archived).length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'booking', label: 'Bookings', count: notifications.filter(n => n.type === 'booking' && !n.archived).length },
            { id: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message' && !n.archived).length },
            { id: 'archived', label: 'Archived', count: notifications.filter(n => n.archived).length },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-(--brand-ink) border border-[#e0e5e3] hover:border-(--brand-blue)/30 shadow-2xs'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-(--brand-muted)'}`}>
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) absolute left-3.5 top-1/2 -translate-y-1/2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts or drivers..."
            className="w-full pl-10 pr-8 py-2 bg-white/80 border border-[#e0e5e3] rounded-2xl text-xs font-semibold text-(--brand-ink) placeholder:text-(--brand-muted)/70 focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--brand-muted) hover:text-(--brand-ink) font-bold text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 3. NOTIFICATIONS STREAM ── */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map(n => {
            const isBooking = n.type === 'booking';
            const isMessage = n.type === 'message';

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className={`p-4 sm:px-6 sm:py-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !n.read
                    ? 'bg-white border-(--brand-blue)/40 shadow-sm ring-1 ring-(--brand-blue)/20'
                    : 'bg-white/70 hover:bg-white border-[#e0e5e3]/90 shadow-2xs'
                }`}
              >
                {/* Left: Icon & Notification Info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border ${
                    isBooking
                      ? 'bg-(--brand-blue)/10 border-(--brand-blue)/20 text-(--brand-blue-deep)'
                      : isMessage
                      ? 'bg-(--brand-green)/10 border-(--brand-green)/20 text-(--brand-green-deep)'
                      : 'bg-amber-50 border-amber-200 text-amber-600'
                  }`}>
                    {isBooking ? (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    ) : isMessage ? (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-xs sm:text-sm font-black truncate ${!n.read ? 'text-(--brand-ink)' : 'text-(--brand-ink)/80'}`}>
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-(--brand-blue) shrink-0" />
                      )}
                      <span className="text-[10px] font-bold text-(--brand-muted) shrink-0">
                        · {timeAgo(n.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-(--brand-muted) font-medium leading-relaxed">
                      {n.message}
                    </p>

                    {(n.stationName || n.driverName) && (
                      <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] font-bold text-(--brand-blue-deep)">
                        {n.stationName && (
                          <span className="flex items-center gap-1">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span>{n.stationName}</span>
                          </span>
                        )}
                        {n.driverName && (
                          <span className="flex items-center gap-1">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            <span>{n.driverName}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {n.targetTab && (
                    <button
                      onClick={() => handleOpenAction(n)}
                      className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-black text-xs shadow-2xs hover:brightness-105 cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>View</span>
                      <span>→</span>
                    </button>
                  )}

                  <button
                    onClick={() => markAsRead(n.id)}
                    title={n.read ? 'Mark as Unread' : 'Mark as Read'}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      n.read
                        ? 'bg-white text-(--brand-muted) border-[#e0e5e3] hover:text-(--brand-ink)'
                        : 'bg-(--brand-blue)/10 text-(--brand-blue-deep) border-(--brand-blue)/20'
                    }`}
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      archiveNotification(n.id);
                      setToastMessage({ msg: 'Notification archived.', type: 'info' });
                    }}
                    title={n.archived ? 'Archived' : 'Archive'}
                    className="p-2 rounded-xl bg-white hover:bg-(--surface-soft) border border-[#e0e5e3] text-(--brand-muted) hover:text-(--brand-ink) text-xs font-bold cursor-pointer transition-all"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      deleteNotification(n.id);
                      setToastMessage({ msg: 'Notification removed.', type: 'info' });
                    }}
                    title="Delete"
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-[#e0e5e3] hover:border-rose-200 text-(--brand-muted) hover:text-rose-600 text-xs font-bold cursor-pointer transition-all"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-3xl border border-[#e0e5e3] space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-(--surface-soft) border border-[#e0e5e3] flex items-center justify-center mx-auto text-(--brand-muted)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <h3 className="text-base font-black text-(--brand-ink)">All Caught Up!</h3>
          <p className="text-xs text-(--brand-muted)">
            {searchQuery ? `No notifications match "${searchQuery}".` : 'No new notifications in this category.'}
          </p>
        </div>
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage?.msg || null} type={toastMessage?.type || 'info'} onClose={() => setToastMessage(null)} />

      {/* Clear All Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear All Notifications?"
        message="Are you sure you want to permanently clear all notifications from your notification center?"
        confirmText="Clear All"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          clearAll();
          setShowClearConfirm(false);
          setToastMessage({ msg: 'All notifications cleared.', type: 'info' });
        }}
        onClose={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
