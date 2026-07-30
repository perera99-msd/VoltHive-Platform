'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

interface HomeNavbarProps {
  onLogoClick?: () => void;
  onNavigateSection?: (id: string) => void;
}

export default function HomeNavbar({ onLogoClick, onNavigateSection }: HomeNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 transition-all duration-500 font-sans pt-4 sm:pt-6 px-4 sm:px-8 pointer-events-none">
      {/* Morphing Navbar Container */}
      <div
        className={`mx-auto pointer-events-auto transition-all duration-500 ease-in-out flex items-center justify-between px-6 sm:px-8 ${
          isScrolled
            ? 'max-w-5xl py-3 bg-white/95 backdrop-blur-2xl border border-[#dce3e0] rounded-full shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)]'
            : 'max-w-[1500px] py-4 bg-white/80 backdrop-blur-xl border border-[#e0e5e3]/90 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
        }`}
      >
        {/* BRAND LOGO */}
        <Link
          href="/"
          onClick={onLogoClick}
          className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 shrink-0"
        >
          <Image
            src="/brand/logo-without-slogan.png"
            alt="VoltHive Platform"
            width={150}
            height={38}
            className="h-7 sm:h-8 w-auto object-contain transition-all duration-300"
            priority
          />
        </Link>

        {/* CENTER NAVIGATION - Desktop */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#f4f6f5] p-1.5 rounded-full border border-[#e0e5e3]">
          {[
            { name: 'Platform', id: 'hero' },
            { name: 'Capabilities', id: 'services' },
            { name: 'PWA App', id: 'pwa-guide' },
            { name: 'Partners', id: 'footer' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className="px-5 py-2 rounded-full text-[11px] font-extrabold tracking-[0.16em] uppercase text-[#555a5e] hover:text-[#1a1a1a] hover:bg-white transition-all cursor-pointer shadow-none hover:shadow-xs"
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <Link
            href="/owner-login"
            className="px-5 py-2.5 rounded-full bg-[#e8f3ef] border border-[#dcefe8] text-[#1a1a1a] font-extrabold text-[11px] uppercase tracking-[0.18em] hover:bg-[#dcefe8] transition-all active:scale-95 shadow-2xs"
          >
            Admin
          </Link>
          <Link
            href="/driver-login"
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#4a90a4] to-[#6cb567] text-white font-extrabold text-[11px] uppercase tracking-[0.18em] hover:brightness-105 transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <span>Driver Portal →</span>
          </Link>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 rounded-2xl bg-[#e8f3ef] border border-[#e0e5e3] text-[#1a1a1a] hover:bg-[#dcefe8] transition-colors cursor-pointer shrink-0"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {/* MOBILE DROPDOWN */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden pointer-events-auto max-w-[1500px] mx-auto mt-3 rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#e0e5e3] p-6 shadow-2xl flex flex-col gap-4"
          >
            {[
              { name: 'Platform', id: 'hero' },
              { name: 'Capabilities', id: 'services' },
              { name: 'PWA App', id: 'pwa-guide' },
              { name: 'Partners', id: 'footer' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="text-left py-3 px-4 rounded-2xl hover:bg-[#f4f6f5] text-[#1a1a1a] font-extrabold text-sm tracking-wide flex items-center justify-between border-b border-[#e0e5e3]/60"
              >
                <span>{item.name}</span>
                <span className="text-xs text-[#6b6f72]">→</span>
              </button>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/driver-login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#4a90a4] to-[#6cb567] text-white font-extrabold text-xs uppercase tracking-widest text-center shadow-md"
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