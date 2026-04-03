'use client';

import type { ReactNode } from 'react';
import { useAuth } from '../../../context/AuthContext';

// --- SUB-COMPONENTS FOR CLEAN ARCHITECTURE ---

const SettingsRow = ({ 
  icon, 
  title, 
  value, 
  iconBgClass, 
  onClick, 
  isDestructive 
}: { 
  icon: ReactNode; 
  title: string; 
  value?: string; 
  iconBgClass?: string; 
  onClick?: () => void; 
  isDestructive?: boolean;
}) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-4 sm:px-6 cursor-pointer transition-all duration-200 border-b border-(--brand-border) last:border-0 hover:bg-[#5FAFC0]/8 active:bg-[#5FAFC0]/12 ${isDestructive ? 'hover:bg-red-50/30' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shadow-sm border border-(--brand-border) ${iconBgClass || 'bg-[#5FAFC0]/12 text-(--brand-muted)'}`}>
        {icon}
      </div>
      <p className={`text-[15px] font-medium tracking-tight ${isDestructive ? 'text-(--ui-error) font-semibold' : 'text-(--brand-ink)'}`}>
        {title}
      </p>
    </div>
    <div className="flex items-center gap-3">
      {value && <span className="text-[13px] font-medium text-(--brand-muted)">{value}</span>}
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${isDestructive ? 'text-red-300' : 'text-(--brand-muted)'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  </div>
);

const SettingsCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mb-8">
    <h3 className="text-xs font-bold text-(--brand-muted) uppercase tracking-[0.15em] mb-3 ml-2">{title}</h3>
    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
      {children}
    </div>
  </div>
);

export default function AccountView() {
  const { user, logout } = useAuth();

  // Mock data
  const joinDate = "March 2026";
  const defaultAddress = "19/A Beach Rd, Negombo";

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 animate-in fade-in duration-500">
      
      <header className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-semibold text-(--brand-ink) tracking-tight">Account</h1>
        <p className="text-(--brand-muted) text-sm mt-2 font-medium">Manage your settings and preferences.</p>
      </header>

      {/* --- PROFILE HEADER CARD --- */}
      <div className="bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.04)] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 mb-10 ring-1 ring-black/5 relative overflow-hidden">
        
        {/* Subtle background glow effect */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#5FAFC0]/16 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#7BC96F]/16 rounded-full blur-3xl pointer-events-none" />

        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-(--brand-blue) to-(--brand-green) rounded-[1.5rem] flex items-center justify-center text-4xl font-light text-white shadow-xl shadow-[color:var(--accent-blue)]/25 border-2 border-white/80 z-10 relative">
            {user?.displayName?.charAt(0) || 'D'}
          </div>
          <button className="absolute -bottom-2 -right-2 w-9 h-9 bg-white rounded-xl shadow-md border border-(--brand-border) flex items-center justify-center text-(--brand-muted) hover:text-(--brand-blue) hover:scale-105 transition-transform z-20">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
          </button>
        </div>

        <div className="text-center sm:text-left flex-1 relative z-10">
          <h2 className="text-2xl font-semibold text-(--brand-ink) tracking-tight">{user?.displayName || 'Dimalsha Perera'}</h2>
          <p className="text-[15px] font-medium text-(--brand-muted) mt-1">{user?.email || 'driver@volthive.com'}</p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5FAFC0]/12 text-(--brand-muted) text-[11px] font-bold uppercase tracking-widest border border-(--brand-border) shadow-sm">
            Member since {joinDate}
          </div>
        </div>
      </div>

      {/* --- SETTINGS CARDS --- */}
      <SettingsCard title="Profile Details">
        <SettingsRow 
          title="Display Name" 
          value={user?.displayName || 'Dimalsha Perera'}
          iconBgClass="bg-[#5FAFC0]/16 text-(--brand-blue)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>} 
        />
        <SettingsRow 
          title="Email Address" 
          value={user?.email || 'driver@volthive.com'}
          iconBgClass="bg-[#5FAFC0]/16 text-(--brand-blue)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>} 
        />
        <SettingsRow 
          title="Change Password" 
          value="Updated 1mo ago"
          iconBgClass="bg-[#7BC96F]/20 text-(--brand-green-deep)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>} 
        />
      </SettingsCard>

      <SettingsCard title="Billing & Payments">
        <SettingsRow 
          title="Payment Methods" 
          value="Visa •••• 4242"
          iconBgClass="bg-amber-50 text-amber-700"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>} 
        />
        <SettingsRow 
          title="Billing Address" 
          value={defaultAddress}
          iconBgClass="bg-[#5FAFC0]/10 text-(--brand-muted)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>} 
        />
        <SettingsRow 
          title="Transaction History" 
          iconBgClass="bg-[#5FAFC0]/10 text-(--brand-muted)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} 
        />
      </SettingsCard>

      <SettingsCard title="Support & Legal">
        <SettingsRow 
          title="Help Center" 
          iconBgClass="bg-[#5FAFC0]/16 text-(--brand-blue)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>} 
        />
        <SettingsRow 
          title="About VoltHive" 
          value="v2.1.0"
          iconBgClass="bg-[#5FAFC0]/10 text-(--brand-muted)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>} 
        />
        <SettingsRow 
          title="Privacy Policy" 
          iconBgClass="bg-[#5FAFC0]/10 text-(--brand-muted)"
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} 
        />
      </SettingsCard>

      {/* --- DESTRUCTIVE ACTION --- */}
      <div className="mt-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-red-100 shadow-sm overflow-hidden ring-1 ring-red-500/10">
          <SettingsRow 
            isDestructive 
            onClick={logout}
            title="Sign Out Securely" 
            iconBgClass="bg-red-50 text-(--ui-error) border-red-100"
            icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>} 
          />
        </div>
      </div>
      
    </div>
  );
}