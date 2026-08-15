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
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = `/#${id}`;
      }
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 transition-all duration-500 font-sans pt-4 sm:pt-6 px-4 sm:px-8 pointer-events-none">
      {/* Morphing Navbar Container */}
      <div
        className={`mx-auto pointer-events-auto transition-all duration-500 ease-in-out flex items-center justify-between px-5 sm:px-8 ${
          isScrolled
            ? 'max-w-6xl py-3 bg-white/94 backdrop-blur-2xl border border-(--brand-border) rounded-full shadow-[0_16px_48px_-12px_rgba(9,32,52,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]'
            : 'max-w-[1500px] py-4 bg-white/85 backdrop-blur-xl border border-(--brand-border)/90 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]'
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
        <nav className="hidden lg:flex items-center gap-1 bg-(--surface-soft)/90 p-1.5 rounded-full border border-(--brand-border)/80">
          <button
            type="button"
            onClick={() => handleNavClick('hubs')}
            className="px-4 py-2 rounded-full text-[11px] font-extrabold tracking-[0.14em] uppercase text-(--brand-muted) hover:text-(--brand-ink) hover:bg-white transition-all cursor-pointer"
          >
            Corridors
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('pitch-deck')}
            className="px-4 py-2 rounded-full text-[11px] font-extrabold tracking-[0.14em] uppercase text-(--brand-muted) hover:text-(--brand-ink) hover:bg-white transition-all cursor-pointer"
          >
            Advantage
          </button>
          <Link
            href="/guide"
            className="px-4 py-2 rounded-full text-[11px] font-extrabold tracking-[0.14em] uppercase text-(--brand-muted) hover:text-(--brand-ink) hover:bg-white transition-all"
          >
            Driver Guide
          </Link>
          <Link
            href="/hosts"
            className="px-4 py-2 rounded-full text-[11px] font-extrabold tracking-[0.14em] uppercase text-(--brand-muted) hover:text-(--brand-ink) hover:bg-white transition-all"
          >
            Host Portal
          </Link>
          <Link
            href="/technology"
            className="px-4 py-2 rounded-full text-[11px] font-extrabold tracking-[0.14em] uppercase text-(--brand-muted) hover:text-(--brand-ink) hover:bg-white transition-all"
          >
            Grid AI
          </Link>
          <Link
            href="/download-app"
            className="px-4 py-2 rounded-full text-[11px] font-extrabold tracking-[0.14em] uppercase text-(--brand-muted) hover:text-(--brand-ink) hover:bg-white transition-all"
          >
            PWA App
          </Link>
        </nav>

        {/* RIGHT ACTION: SINGLE CLEAN CTA BUTTON */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('cta-section')}
            className="group px-7 py-3 rounded-full bg-linear-to-r from-(--brand-blue-deep) via-(--brand-blue) to-(--brand-green) text-white font-extrabold text-[11px] uppercase tracking-[0.18em] hover:brightness-105 hover:shadow-[0_10px_25px_-8px_rgba(74,144,164,0.65)] transition-all duration-300 active:scale-95 flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Try VoltHive</span>
            <svg
              className="w-3.5 h-3.5 text-white/90 group-hover:translate-x-1 group-hover:text-white transition-all duration-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 rounded-2xl bg-(--surface-soft) border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-tint) transition-colors cursor-pointer shrink-0"
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
            className="lg:hidden pointer-events-auto max-w-[1500px] mx-auto mt-3 rounded-3xl bg-white/98 backdrop-blur-2xl border border-(--brand-border) p-6 shadow-2xl flex flex-col gap-2 max-h-[80vh] overflow-y-auto"
          >
            <button
              onClick={() => handleNavClick('hubs')}
              className="text-left py-3 px-4 rounded-2xl hover:bg-(--surface-soft) text-(--brand-ink) font-extrabold text-sm tracking-wide flex items-center justify-between border-b border-(--brand-border)/60 cursor-pointer"
            >
              <span>Charging Corridors</span>
              <span className="text-xs text-(--brand-muted)">→</span>
            </button>
            <button
              onClick={() => handleNavClick('pitch-deck')}
              className="text-left py-3 px-4 rounded-2xl hover:bg-(--surface-soft) text-(--brand-ink) font-extrabold text-sm tracking-wide flex items-center justify-between border-b border-(--brand-border)/60 cursor-pointer"
            >
              <span>Platform Advantage</span>
              <span className="text-xs text-(--brand-muted)">→</span>
            </button>
            <Link
              href="/guide"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left py-3 px-4 rounded-2xl hover:bg-(--surface-soft) text-(--brand-ink) font-extrabold text-sm tracking-wide flex items-center justify-between border-b border-(--brand-border)/60"
            >
              <span>Driver Help &amp; Guide</span>
              <span className="text-xs text-(--brand-muted)">→</span>
            </Link>
            <Link
              href="/hosts"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left py-3 px-4 rounded-2xl hover:bg-(--surface-soft) text-(--brand-ink) font-extrabold text-sm tracking-wide flex items-center justify-between border-b border-(--brand-border)/60"
            >
              <span>Station Host Portal</span>
              <span className="text-xs text-(--brand-muted)">→</span>
            </Link>
            <Link
              href="/technology"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left py-3 px-4 rounded-2xl hover:bg-(--surface-soft) text-(--brand-ink) font-extrabold text-sm tracking-wide flex items-center justify-between border-b border-(--brand-border)/60"
            >
              <span>Grid AI Technology</span>
              <span className="text-xs text-(--brand-muted)">→</span>
            </Link>
            <Link
              href="/download-app"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left py-3 px-4 rounded-2xl hover:bg-(--surface-soft) text-(--brand-ink) font-extrabold text-sm tracking-wide flex items-center justify-between border-b border-(--brand-border)/60"
            >
              <span>PWA Mobile App</span>
              <span className="text-xs text-(--brand-muted)">→</span>
            </Link>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleNavClick('cta-section')}
                className="w-full py-4 rounded-full bg-linear-to-r from-(--brand-blue-deep) via-(--brand-blue) to-(--brand-green) text-white font-extrabold text-xs uppercase tracking-widest text-center shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <span>Try VoltHive</span>
                <span className="text-sm">→</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
