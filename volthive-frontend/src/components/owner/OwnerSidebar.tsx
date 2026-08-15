'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useOwnerNotifications } from '../../context/OwnerNotificationContext';
import { apiUrl } from '../../lib/api';
import ConfirmModal from '../common/ConfirmModal';

interface OwnerSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function OwnerSidebar({ activeTab, setActiveTab, onLogout }: OwnerSidebarProps) {
  const { user } = useAuth();
  const { notifications, unreadCount: notifUnreadCount } = useOwnerNotifications();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Derive unread driver message count directly from shared notification context (0 extra network requests)
  const unreadChatCount = notifications.filter(n => n.type === 'message' && !n.read && !n.archived).length;

  const navSections = [
    {
      title: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        },
        {
          id: 'ai',
          label: 'AI Intelligence',
          badge: 'Live',
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.496 1.508 1.333 1.508 2.316V18" />
        },
        {
          id: 'map',
          label: 'Network Map',
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        },
      ]
    },
    {
      title: 'Operations',
      items: [
        {
          id: 'stations',
          label: 'My Stations',
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        },
        {
          id: 'chargers',
          label: 'My Chargers',
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        },
        {
          id: 'bookings',
          label: 'Bookings & Ops',
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        },
        {
          id: 'rates',
          label: 'Rate Calculator',
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        },
      ]
    },
    {
      title: 'Communication',
      items: [
        {
          id: 'chat',
          label: 'Messages',
          badge: unreadChatCount > 0 ? `${unreadChatCount}` : undefined,
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        },
        {
          id: 'notifications',
          label: 'Notifications',
          badge: notifUnreadCount > 0 ? `${notifUnreadCount}` : undefined,
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          label: 'Operator Profile',
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        },
        {
          id: 'settings',
          label: 'System Settings',
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        },
        {
          id: 'help',
          label: 'Help & Guidance',
          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        }
      ]
    }
  ];

  return (
    <aside className="w-68 h-full bg-white/85 backdrop-blur-2xl border-r border-[#e0e5e3]/80 flex flex-col shadow-[4px_0_30px_rgba(9,32,52,0.03)] relative z-20 font-sans select-none">
      {/* Brand Header */}
      <div className="p-6 pb-5 border-b border-[#e0e5e3]/60">
        <div className="flex items-center justify-between">
          <Image
            src="/brand/logo-without-slogan.png"
            alt="VoltHive"
            width={130}
            height={34}
            className="h-7 w-auto object-contain"
            priority
          />
          <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse shadow-sm" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-extrabold uppercase tracking-widest border border-(--brand-blue)/20">
            Operator Portal
          </span>
          <span className="text-[10px] text-(--brand-muted) font-semibold tracking-wide">
            v2.4 Grid
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3.5 py-4 space-y-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-[10px] font-black text-(--brand-muted) uppercase tracking-[0.16em] mb-1.5 opacity-70">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all relative overflow-hidden group cursor-pointer ${
                    isActive
                      ? 'text-white shadow-md shadow-(--brand-blue)/20'
                      : 'text-(--brand-ink) hover:bg-(--surface-soft)/60'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="owner-sidebar-active"
                      className="absolute inset-0 bg-linear-to-r from-(--brand-blue) to-(--brand-green) rounded-xl z-0"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-3 relative z-10 min-w-0">
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.2}
                      stroke="currentColor"
                      className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-(--brand-muted) group-hover:text-(--brand-blue)'
                      }`}
                    >
                      {item.icon}
                    </svg>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`relative z-10 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                        isActive
                          ? 'bg-white/25 text-white border border-white/30'
                          : item.id === 'chat' || item.id === 'notifications'
                          ? 'bg-rose-500 text-white shadow-xs animate-bounce'
                          : 'bg-(--brand-green)/15 text-(--brand-green-deep) border border-(--brand-green)/25'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Sign Out */}
      <div className="p-3.5 border-t border-[#e0e5e3]/70 bg-white/50 backdrop-blur-md">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-black text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-rose-200 shadow-2xs"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Sign Out
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out of Operator Console?"
        message="Are you sure you want to end your operator session? You will need to log in again to access station controls."
        confirmText="Sign Out"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </aside>
  );
}