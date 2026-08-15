'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOwnerNotifications, OwnerNotification } from '../../context/OwnerNotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AVATAR_OPTIONS } from './views/OwnerProfileView';

interface OwnerTopBarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onToggleMobileSidebar: () => void;
  onLogout: () => void;
}

const TAB_TITLES: Record<string, { title: string; category: string }> = {
  dashboard: { title: 'Executive Overview', category: 'Analytics & Revenue' },
  ai: { title: 'AI Demand & Dynamic Pricing', category: 'Intelligence Engine' },
  map: { title: 'Station Network Map', category: 'GIS Telemetry' },
  stations: { title: 'Station Infrastructure', category: 'Premise Fleet' },
  chargers: { title: 'Hardware Chargers', category: 'Port Management' },
  bookings: { title: 'Live Operations & POS', category: 'POS & Queue' },
  rates: { title: 'Rate Calculator & Scheduler', category: 'Tariff Rules' },
  chat: { title: 'Driver Support & Messages', category: 'Communication' },
  notifications: { title: 'Notification Center', category: 'Communication & Alerts' },
  profile: { title: 'Operator Account Profile', category: 'Security & Settings' },
  settings: { title: 'System & Portal Settings', category: 'Account & Preferences' },
  help: { title: 'Help & Platform Documentation', category: 'Support & Manuals' },
};

const timeAgo = (iso?: string | null) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function OwnerTopBar({
  activeTab,
  onNavigate,
  onToggleMobileSidebar,
  onLogout,
}: OwnerTopBarProps) {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useOwnerNotifications();

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    if (user?.photoURL) return user.photoURL;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('volthive_owner_avatar');
      if (cached) return cached;
    }
    return AVATAR_OPTIONS[0].url;
  });

  useEffect(() => {
    if (user?.photoURL) {
      setAvatarUrl(user.photoURL);
    }
    const handleAvatarUpdate = () => {
      const cached = localStorage.getItem('volthive_owner_avatar');
      if (cached) setAvatarUrl(cached);
    };
    window.addEventListener('volthive_avatar_updated', handleAvatarUpdate);
    return () => window.removeEventListener('volthive_avatar_updated', handleAvatarUpdate);
  }, [user]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabInfo = TAB_TITLES[activeTab] || { title: 'Operator Console', category: 'VoltHive Portal' };
  const recentNotifications = notifications.filter(n => !n.archived).slice(0, 5);

  const handleNotificationClick = (n: OwnerNotification) => {
    markAsRead(n.id);
    setDropdownOpen(false);
    if (n.targetTab) {
      onNavigate(n.targetTab);
    } else {
      onNavigate('notifications');
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 backdrop-blur-2xl border-b border-[#e0e5e3]/90 px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] shrink-0 transition-all select-none">
      
      {/* ── LEFT: Mobile Trigger & Breadcrumbs ── */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Mobile Hamburger */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl bg-(--surface-soft) border border-[#e0e5e3] text-(--brand-ink) hover:bg-white transition-colors cursor-pointer shrink-0"
          aria-label="Toggle navigation"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Section Breadcrumbs */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-(--brand-muted)">
            <span className="hidden sm:inline hover:text-(--brand-blue) cursor-pointer" onClick={() => onNavigate('dashboard')}>
              VoltHive
            </span>
            <span className="hidden sm:inline text-(--brand-border)">/</span>
            <span className="text-(--brand-blue-deep) truncate">{tabInfo.category}</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-(--brand-ink) tracking-tight truncate leading-tight mt-0.5">
            {tabInfo.title}
          </h2>
        </div>
      </div>

      {/* ── RIGHT: [Notification Bell + Dropdown] [Time Badge] [Avatar Profile Chip] ── */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        
        {/* 1. NOTIFICATION BELL & DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Notifications"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center border transition-all cursor-pointer relative shadow-2xs ${
              dropdownOpen || activeTab === 'notifications'
                ? 'bg-linear-to-r from-(--brand-blue)/15 to-(--brand-green)/15 border-(--brand-blue) text-(--brand-blue-deep) shadow-xs'
                : 'bg-white hover:bg-(--surface-soft)/70 border-[#e0e5e3] text-(--brand-ink)'
            }`}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5 sm:w-5 sm:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Animated Notification Dropdown Popup */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3] shadow-2xl overflow-hidden z-50 font-sans"
              >
                {/* Dropdown Header */}
                <div className="p-4 border-b border-[#e0e5e3]/80 flex items-center justify-between bg-(--surface-soft)/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-(--brand-ink)">Live Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black border border-rose-200">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold text-(--brand-blue-deep) hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Dropdown Notification Stream */}
                <div className="max-h-[320px] overflow-y-auto divide-y divide-[#e0e5e3]/60 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#e0e5e3] [&::-webkit-scrollbar-thumb]:rounded-full">
                  {recentNotifications.length === 0 ? (
                    <div className="p-8 text-center space-y-1">
                      <div className="w-10 h-10 rounded-2xl bg-(--surface-soft) border border-[#e0e5e3] flex items-center justify-center mx-auto text-(--brand-muted)">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                      </div>
                      <p className="text-xs font-black text-(--brand-ink)">No new notifications</p>
                      <p className="text-[11px] text-(--brand-muted)">Incoming bookings and messages will appear here.</p>
                    </div>
                  ) : (
                    recentNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 hover:bg-(--surface-soft)/60 transition-colors cursor-pointer flex items-start gap-3 ${
                          !n.read ? 'bg-linear-to-r from-(--brand-blue)/5 to-transparent' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                          n.type === 'booking'
                            ? 'bg-(--brand-blue)/10 border-(--brand-blue)/20 text-(--brand-blue-deep)'
                            : n.type === 'message'
                            ? 'bg-(--brand-green)/10 border-(--brand-green)/20 text-(--brand-green-deep)'
                            : 'bg-amber-50 border-amber-200 text-amber-600'
                        }`}>
                          {n.type === 'booking' ? (
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                          ) : n.type === 'message' ? (
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                            </svg>
                          ) : (
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className={`text-xs font-black truncate ${!n.read ? 'text-(--brand-ink)' : 'text-(--brand-muted)'}`}>
                              {n.title}
                            </h5>
                            <span className="text-[9px] font-bold text-(--brand-muted) shrink-0">
                              {timeAgo(n.timestamp)}
                            </span>
                          </div>
                          <p className="text-[11px] text-(--brand-muted) line-clamp-2 leading-relaxed font-medium">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Dropdown Footer */}
                <div className="p-3 border-t border-[#e0e5e3]/80 bg-(--surface-soft)/40 text-center">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate('notifications');
                    }}
                    className="w-full py-2 rounded-xl bg-white hover:bg-(--surface-soft) border border-[#e0e5e3] text-xs font-black text-(--brand-blue-deep) transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>View All in Notification Center</span>
                    <span>→</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. LIVE TIME / DATE BADGE */}
        <div className="flex flex-col items-end px-3.5 py-1.5 bg-(--surface-soft)/60 border border-[#e0e5e3] rounded-2xl text-right shadow-2xs">
          <span className="text-xs font-black text-(--brand-ink) leading-none">{timeStr}</span>
          <span className="text-[9px] font-bold text-(--brand-muted) uppercase tracking-wider leading-tight mt-0.5">{dateStr}</span>
        </div>

        {/* 3. PROFILE AVATAR CHIP */}
        <button
          onClick={() => onNavigate('profile')}
          title="Open Operator Profile"
          className={`flex items-center gap-2.5 p-1.5 sm:pr-3.5 rounded-2xl border transition-all cursor-pointer group ${
            activeTab === 'profile'
              ? 'bg-linear-to-r from-(--brand-blue)/10 to-(--brand-green)/10 border-(--brand-blue) shadow-xs'
              : 'bg-white hover:bg-(--surface-soft)/60 border-[#e0e5e3] shadow-2xs hover:shadow-sm hover:border-(--brand-blue)/40'
          }`}
        >
          {/* Animated Avatar / Image */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-linear-to-tr from-(--brand-blue) to-(--brand-green) border border-white shadow-xs shrink-0 flex items-center justify-center text-white font-black text-xs group-hover:scale-105 transition-transform">
            <img
              src={avatarUrl || user?.photoURL || AVATAR_OPTIONS[0].url}
              alt={user?.displayName || 'Operator'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = AVATAR_OPTIONS[0].url;
              }}
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-(--brand-green) rounded-full border border-white" />
          </div>

          {/* Name & Role */}
          <div className="hidden sm:flex flex-col text-left min-w-0">
            <span className="text-xs font-black text-(--brand-ink) group-hover:text-(--brand-blue-deep) transition-colors truncate max-w-[110px] leading-tight">
              {user?.displayName || user?.email?.split('@')[0] || 'Operator'}
            </span>
            <span className="text-[9px] font-bold text-(--brand-muted) uppercase tracking-wider leading-tight">
              Host Profile
            </span>
          </div>

          {/* Chevron */}
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-(--brand-muted) group-hover:text-(--brand-blue) group-hover:translate-x-0.5 transition-all hidden sm:block">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
