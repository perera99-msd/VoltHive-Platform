'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

interface HomeNavbarProps {
  onLogoClick?: () => void;
  onNavigate?: (id: string) => void;
  onNavigateSection?: (id: string) => void;
}

export default function HomeNavbar({ onLogoClick, onNavigate, onNavigateSection }: HomeNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                           ('standalone' in navigator && (navigator as any).standalone === true);
    setIsStandalone(standaloneMode);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sandbox PWA App Mode: Suppress marketing navigation bar in standalone mode
  if (isStandalone) return null;

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(id);
    } else if (onNavigate) {
      onNavigate(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-8 pt-4 sm:pt-6 pointer-events-none transition-all duration-500 font-sans">
      
      {/* FLOATING GLASS PILl COCKPIT BAR */}
      <div className={`max-w-[1500px] mx-auto rounded-2xl sm:rounded-full pointer-events-auto transition-all duration-300 px-5 sm:px-8 flex items-center justify-between gap-4 ${
        isScrolled 
          ? 'py-3 bg-white/92 backdrop-blur-2xl border border-[#e0e5e3] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)]' 
          : 'py-4 sm:py-5 bg-white/80 backdrop-blur-xl border border-[#e0e5e3]/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)]'
      }`}>
        
        {/* BRAND LOGO */}
        <Link 
          href="/" 
          onClick={onLogoClick}
          className="flex items-center gap-3 transition-transform active:scale-95 shrink-0"
        >
          <Image
            src="/brand/logo-without-slogan.png"
            alt="VoltHive Platform"
            width={170}
            height={44}
            className="h-7 sm:h-8.5 w-auto object-contain"
            priority
          />
        </Link>

        {/* CENTER SEGMENTED NAVIGATION TAB PILl */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#f5f7f6] p-1.5 rounded-full border border-[#e0e5e3] shadow-inner">
          <button 
            type="button"
            onClick={() => handleNavClick('about-us')} 
            className="px-5 py-2 rounded-full text-[11px] font-extrabold tracking-[0.16em] uppercase text-[#6b6f72] hover:text-[#1a1a1a] hover:bg-white transition-all cursor-pointer shadow-none hover:shadow-xs"
          >
            Platform
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('services')} 
            className="px-5 py-2 rounded-full text-[11px] font-extrabold tracking-[0.16em] uppercase text-[#6b6f72] hover:text-[#1a1a1a] hover:bg-white transition-all cursor-pointer shadow-none hover:shadow-xs"
          >
            Capabilities
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('news')} 
            className="px-5 py-2 rounded-full text-[11px] font-extrabold tracking-[0.16em] uppercase text-[#6b6f72] hover:text-[#1a1a1a] hover:bg-white transition-all cursor-pointer shadow-none hover:shadow-xs"
          >
            Telemetry
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('partners')} 
            className="px-5 py-2 rounded-full text-[11px] font-extrabold tracking-[0.16em] uppercase text-[#6b6f72] hover:text-[#1a1a1a] hover:bg-white transition-all cursor-pointer shadow-none hover:shadow-xs"
          >
            Operators
          </button>
          <Link 
            href="/download-app" 
            className="px-5 py-2 rounded-full text-[11px] font-extrabold tracking-[0.16em] uppercase text-[#4a90a4] hover:text-[#3f7f90] hover:bg-white transition-all flex items-center gap-1.5 shadow-none hover:shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#6cb567] animate-pulse" />
            <span>Standalone PWA</span>
          </Link>
        </nav>

        {/* RIGHT FLAGSHIP PORTAL TRIGGERS */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <Link
            href="/owner-login"
            className="px-5 py-2.5 rounded-full bg-[#e8f3ef] border border-[#dcefe8] text-[#1a1a1a] font-extrabold text-[11px] uppercase tracking-[0.18em] hover:bg-[#dcefe8] transition-all active:scale-95 flex items-center gap-2 shadow-2xs"
          >
            <span>Admin Center</span>
          </Link>
          <Link
            href="/driver-login"
            className="px-6 py-2.5 rounded-full bg-linear-to-r from-[#4a90a4] to-[#6cb567] text-white font-extrabold text-[11px] uppercase tracking-[0.18em] hover:brightness-105 transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <span>Driver Portal →</span>
          </Link>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 rounded-xl bg-[#e8f3ef] border border-[#e0e5e3] text-[#1a1a1a] hover:bg-[#dcefe8] transition-colors cursor-pointer shrink-0"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

      </div>

      {/* MOBILE DROPDOWN MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden pointer-events-auto max-w-[1500px] mx-auto mt-3 rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#e0e5e3] p-6 sm:p-8 shadow-2xl flex flex-col gap-6"
          >
            <div className="flex flex-col gap-3 text-sm font-bold text-[#1a1a1a]">
              <button 
                type="button"
                onClick={() => handleNavClick('about-us')} 
                className="text-left py-3 px-4 rounded-2xl hover:bg-[#f5f7f6] transition-colors font-extrabold tracking-wide flex items-center justify-between"
              >
                <span>Platform Architecture</span>
                <span className="text-xs text-[#6b6f72]">→</span>
              </button>
              <button 
                type="button"
                onClick={() => handleNavClick('services')} 
                className="text-left py-3 px-4 rounded-2xl hover:bg-[#f5f7f6] transition-colors font-extrabold tracking-wide flex items-center justify-between"
              >
                <span>Core Capabilities</span>
                <span className="text-xs text-[#6b6f72]">→</span>
              </button>
              <button 
                type="button"
                onClick={() => handleNavClick('news')} 
                className="text-left py-3 px-4 rounded-2xl hover:bg-[#f5f7f6] transition-colors font-extrabold tracking-wide flex items-center justify-between"
              >
                <span>Live Telemetry Gazette</span>
                <span className="text-xs text-[#6b6f72]">→</span>
              </button>
              <button 
                type="button"
                onClick={() => handleNavClick('partners')} 
                className="text-left py-3 px-4 rounded-2xl hover:bg-[#f5f7f6] transition-colors font-extrabold tracking-wide flex items-center justify-between"
              >
                <span>Commercial Operators</span>
                <span className="text-xs text-[#6b6f72]">→</span>
              </button>
              <Link 
                href="/download-app"
                onClick={() => setMobileMenuOpen(false)}
                className="text-left py-3 px-4 rounded-2xl bg-[#e8f3ef]/60 hover:bg-[#e8f3ef] transition-colors font-extrabold tracking-wide text-[#4a90a4] flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6cb567] animate-pulse" />
                  <span>Standalone PWA Installation</span>
                </div>
                <span className="text-xs">●</span>
              </Link>
            </div>

            <div className="flex flex-col sm:hidden gap-3 pt-4 border-t border-[#e0e5e3]">
              <Link
                href="/driver-login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-4 rounded-full bg-linear-to-r from-[#4a90a4] to-[#6cb567] text-white font-extrabold text-xs uppercase tracking-widest text-center shadow-lg"
              >
                Driver Portal →
              </Link>
              <Link
                href="/owner-login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-4 rounded-full bg-[#e8f3ef] border border-[#dcefe8] text-[#1a1a1a] font-extrabold text-xs uppercase tracking-widest text-center"
              >
                Admin Center
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}