'use client';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: 'overview' | 'stations' | 'map' | 'rates' | 'account';
  onTabChange: (tab: 'overview' | 'stations' | 'map' | 'rates' | 'account') => void;
}

export default function OwnerSidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();

  const getDesktopTabStyle = (tabName: string) => {
    const isActive = activeTab === tabName;
    return isActive
      ? "flex items-center gap-3 px-4 py-3 w-full rounded-xl bg-(--brand-ink) text-(--brand-card) shadow-md shadow-slate-900/10 font-medium transition-all"
      : "flex items-center gap-3 px-4 py-3 w-full rounded-xl bg-transparent text-(--brand-muted) hover:bg-slate-50 hover:text-(--brand-ink) font-medium transition-all";
  };

  const getMobileTabStyle = (tabName: string) => {
    const isActive = activeTab === tabName;
    if (tabName === 'map') {
      return isActive 
        ? "w-[56px] h-[56px] rounded-full bg-(--brand-ink) text-(--brand-card) shadow-[0_8px_25px_rgba(26,26,26,0.4)] ring-2 ring-(--brand-ink)/10 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] -translate-y-5 scale-105"
        : "w-[56px] h-[56px] rounded-full bg-(--brand-ink)/85 text-(--brand-card)/80 shadow-md border border-(--brand-border)/30 transition-all duration-300 hover:scale-105 -translate-y-4";
    }
    return isActive
      ? "w-12 h-12 rounded-xl bg-(--brand-card) shadow-sm text-(--brand-blue) border border-(--brand-border) transition-all duration-300 scale-110"
      : "w-12 h-12 rounded-xl bg-transparent text-(--brand-muted) hover:bg-black/5 hover:text-(--brand-ink) transition-all duration-300";
  };

  return (
    <>
      {/* =========================================================
          DESKTOP LAYOUT (Traditional SaaS Vertical Sidebar)
      ========================================================= */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[260px] bg-(--brand-card)/80 backdrop-blur-2xl border-r border-(--brand-border) flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Logo Area */}
        <div className="h-24 flex items-center px-8 border-b border-(--brand-border)/50">
          <Image src="/brand/logo-without-slogan.png" alt="VoltHive" width={140} height={35} className="h-7 w-auto" />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-8 space-y-2">
          <p className="px-4 text-[10px] font-bold text-(--brand-muted) uppercase tracking-widest mb-4">Main Menu</p>
          
          <button onClick={() => onTabChange('overview')} className={getDesktopTabStyle('overview')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </button>

          <button onClick={() => onTabChange('stations')} className={getDesktopTabStyle('stations')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Hardware
          </button>

          <button onClick={() => onTabChange('rates')} className={getDesktopTabStyle('rates')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Tariff Calendar
          </button>

          <button onClick={() => onTabChange('map')} className={getDesktopTabStyle('map')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
            Live Map
          </button>
        </div>

        {/* User Profile Area (Bottom) */}
        <div className="p-4 border-t border-(--brand-border)/50">
          <button onClick={() => onTabChange('account')} className="flex items-center gap-3 p-3 w-full hover:bg-slate-50 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-(--brand-blue) to-(--brand-green) flex items-center justify-center text-white font-bold shadow-sm border-2 border-white">
              {user?.displayName?.charAt(0) || 'O'}
            </div>
            <div className="text-left flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-(--brand-ink) truncate">{user?.displayName || 'Station Owner'}</p>
              <p className="text-xs text-(--brand-muted) truncate">{user?.email || 'owner@volthive.com'}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* =========================================================
          MOBILE LAYOUT (Bottom Floating Pill - Unchanged logic)
      ========================================================= */}
      <nav className="lg:hidden absolute z-50 bottom-8 left-1/2 -translate-x-1/2 h-[72px] w-[92%] max-w-[380px] bg-(--brand-card)/70 backdrop-blur-[40px] saturate-[1.2] border border-(--brand-card)/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/5 rounded-[2.5rem] flex flex-row items-center justify-between px-3 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
        
        <div className="flex-1 flex justify-center cursor-pointer group" onClick={() => onTabChange('overview')}>
          <div className={`flex items-center justify-center ${getMobileTabStyle('overview')}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          </div>
        </div>

        <div className="flex-1 flex justify-center cursor-pointer group" onClick={() => onTabChange('stations')}>
          <div className={`flex items-center justify-center ${getMobileTabStyle('stations')}`}>
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
        </div>

        <div className="flex-1 flex justify-center cursor-pointer group mb-1" onClick={() => onTabChange('map')}>
          <div className={`flex items-center justify-center ${getMobileTabStyle('map')}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[26px] h-[26px]"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
          </div>
        </div>

        <div className="flex-1 flex justify-center cursor-pointer group" onClick={() => onTabChange('rates')}>
          <div className={`flex items-center justify-center ${getMobileTabStyle('rates')}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>

        <div className="flex-1 flex justify-center cursor-pointer group" onClick={() => onTabChange('account')}>
          <div className={`flex items-center justify-center ${getMobileTabStyle('account')}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>

      </nav>
    </>
  );
}