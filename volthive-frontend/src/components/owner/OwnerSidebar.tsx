'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface OwnerSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function OwnerSidebar({ activeTab, setActiveTab, onLogout }: OwnerSidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /> },
    { id: 'stations', label: 'My Stations', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /> },
    { id: 'chargers', label: 'My Chargers', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /> },
    { id: 'bookings', label: 'Bookings & Ops', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /> },
    { id: 'rates', label: 'Rate Calculator', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { id: 'map', label: 'Network Map', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /> },
  ];

  return (
    <aside className="w-64 h-full bg-(--brand-card)/80 backdrop-blur-2xl border-r border-(--brand-border)/70 flex flex-col shadow-[4px_0_24px_rgba(9,32,52,0.02)] relative z-20">
      <div className="p-7">
        <div className="inline-block select-none pointer-events-none">
          <Image src="/brand/logo-without-slogan.png" alt="VoltHive" width={140} height={36} className="h-7 w-auto" />
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-bold uppercase tracking-widest border border-(--brand-blue)/20">
          Operator Portal
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-(--brand-muted) uppercase tracking-widest mb-3 opacity-70">Main Menu</p>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14px] font-semibold transition-all relative overflow-hidden group ${
                isActive ? 'text-white shadow-md' : 'text-(--brand-ink) hover:bg-(--surface-soft)'
              }`}
            >
              {isActive && (
                <motion.div layoutId="owner-sidebar-active" className="absolute inset-0 bg-gradient-to-r from-(--brand-blue) to-(--accent-blue) rounded-2xl z-0" />
              )}
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-white' : 'text-(--brand-muted) group-hover:text-(--brand-blue)'}`}>
                {item.icon}
              </svg>
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-(--brand-border)/60">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[14px] font-semibold text-(--ui-error) hover:bg-(--ui-error)/10 transition-colors">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}