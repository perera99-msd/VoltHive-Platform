'use client';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: 'home' | 'garage' | 'map' | 'reservations' | 'account';
  onTabChange: (tab: 'home' | 'garage' | 'map' | 'reservations' | 'account') => void;
}

export default function DriverSidebar({ activeTab, onTabChange }: SidebarProps) {
  useAuth(); // Keeping this imported in case you need it later, though logout is now in Account view

  // Helper function dynamically styling tabs using ONLY globals.css theme variables
  const getTabStyle = (tabName: string) => {
    const isActive = activeTab === tabName;
    
    // The "Map" button is ALWAYS highlighted (Anchor)
    if (tabName === 'map') {
      return isActive 
        ? "w-[56px] h-[56px] md:w-12 md:h-12 rounded-full md:rounded-2xl bg-(--brand-ink) text-(--brand-card) shadow-[0_8px_25px_rgba(26,26,26,0.4)] ring-2 ring-(--brand-ink)/10 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] -translate-y-5 md:translate-y-0 scale-105"
        : "w-[56px] h-[56px] md:w-12 md:h-12 rounded-full md:rounded-2xl bg-(--brand-ink)/85 text-(--brand-card)/80 shadow-md border border-(--brand-border)/30 transition-all duration-300 hover:bg-(--brand-ink) hover:text-(--brand-card) hover:shadow-lg hover:scale-105 -translate-y-4 md:translate-y-0";
    }

    // Standard navigation tabs
    return isActive
      ? "w-12 h-12 md:w-10 md:h-10 rounded-full md:rounded-xl bg-(--brand-card) shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-(--brand-blue) border border-(--brand-border) transition-all duration-300 scale-110"
      : "w-12 h-12 md:w-10 md:h-10 rounded-full md:rounded-xl bg-transparent text-(--brand-muted) hover:bg-black/5 hover:text-(--brand-ink) transition-all duration-300";
  };

  return (
    <nav className="absolute z-40 
                    /* Mobile: Bottom Floating Pill */
                    bottom-8 left-1/2 -translate-x-1/2 h-[72px] w-[92%] max-w-[380px] 
                    bg-(--brand-card)/60 backdrop-blur-[40px] saturate-[1.2] border border-(--brand-card)/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/5 rounded-[2.5rem] 
                    flex flex-row items-center justify-between px-3
                    /* Desktop: Left Floating Dock */
                    md:bottom-auto md:top-1/2 md:translate-x-0 md:-translate-y-1/2 md:left-8 md:right-auto md:w-[72px] md:h-auto md:flex-col md:py-5 md:px-0 md:rounded-[2rem] md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] md:gap-4 
                    transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
      
      {/* 1. Map (Always Highlighted Anchor - Desktop: Top, Mobile: Center) */}
      <div className="order-3 md:order-1 flex-1 flex justify-center cursor-pointer group md:mb-1" onClick={() => onTabChange('map')}>
        <div className={`flex items-center justify-center ${getTabStyle('map')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[26px] h-[26px] md:w-[22px] md:h-[22px]">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
            <line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>
          </svg>
        </div>
        <span className="hidden md:block absolute left-[calc(100%+18px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-(--brand-ink) text-(--brand-card) text-[11px] font-semibold tracking-wide rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm">
          Live Map
        </span>
      </div>

      {/* 2. Home (Mobile: Pos 1, Desktop: Pos 2) */}
      <div className="order-1 md:order-2 flex-1 flex justify-center cursor-pointer group" onClick={() => onTabChange('home')}>
        <div className={`flex items-center justify-center ${getTabStyle('home')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 md:w-5 md:h-5">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <span className="hidden md:block absolute left-[calc(100%+18px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-(--brand-ink) text-(--brand-card) text-[11px] font-semibold tracking-wide rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm">
          Home
        </span>
      </div>

      {/* 3. Cars (Mobile: Pos 2, Desktop: Pos 3) */}
      <div className="order-2 md:order-3 flex-1 flex justify-center cursor-pointer group" onClick={() => onTabChange('garage')}>
        <div className={`flex items-center justify-center ${getTabStyle('garage')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 md:w-5 md:h-5">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <span className="hidden md:block absolute left-[calc(100%+18px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-(--brand-ink) text-(--brand-card) text-[11px] font-semibold tracking-wide rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm">
          My Cars
        </span>
      </div>

      {/* 4. Bookings (Mobile: Pos 4, Desktop: Pos 4) */}
      <div className="order-4 md:order-4 flex-1 flex justify-center cursor-pointer group" onClick={() => onTabChange('reservations')}>
        <div className={`flex items-center justify-center ${getTabStyle('reservations')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 md:w-5 md:h-5">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
            <path d="m9 16 2 2 4-4"/>
          </svg>
        </div>
        <span className="hidden md:block absolute left-[calc(100%+18px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-(--brand-ink) text-(--brand-card) text-[11px] font-semibold tracking-wide rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm">
          Bookings
        </span>
      </div>

      {/* 5. Account (Mobile: Pos 5, Desktop: Pos 5) */}
      <div className="order-5 md:order-5 flex-1 flex justify-center cursor-pointer group" onClick={() => onTabChange('account')}>
        <div className={`flex items-center justify-center ${getTabStyle('account')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 md:w-5 md:h-5">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <span className="hidden md:block absolute left-[calc(100%+18px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-(--brand-ink) text-(--brand-card) text-[11px] font-semibold tracking-wide rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm">
          Account
        </span>
      </div>

    </nav>
  );
}