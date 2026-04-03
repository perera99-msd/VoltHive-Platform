'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HomeNavbarProps {
  onLogoClick: () => void;
  onNavigateSection: (sectionId: string) => void;
}

const navItems = [
  { id: 'services', label: 'Services' },
  { id: 'how-to-join', label: 'How to Join' },
  { id: 'news', label: 'News' },
  { id: 'partners', label: 'Partners' },
  { id: 'about-us', label: 'About Us' },
];

export default function HomeNavbar({ onLogoClick, onNavigateSection }: HomeNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigateSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    onNavigateSection(sectionId);
  };

  return (
    <nav className="fixed w-full z-90 top-0 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pointer-events-auto relative">
        
        {/* Main Navbar Bar */}
        <div className="h-16 sm:h-20 rounded-[1.25rem] sm:rounded-2xl border border-(--brand-border) bg-(--brand-card)/90 backdrop-blur-2xl shadow-[0_14px_38px_-25px_rgba(9,32,52,0.45)] flex items-center justify-between px-4 sm:px-7 transition-all relative z-50">
        
          {/* Logo */}
          <button type="button" className="flex items-center gap-3 active:scale-95 transition-transform" onClick={() => {
            setIsMobileMenuOpen(false);
            onLogoClick();
          }}>
            <Image
              src="/brand/logo-without-slogan.png"
              alt="VoltHive"
              width={180}
              height={50}
              className="h-6 sm:h-9 w-auto"
              priority
            />
          </button>
        
          {/* Desktop Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-(--brand-muted)">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigateSection(item.id)}
                className="hover:text-(--brand-ink) transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Auth Buttons (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 text-[14px] font-semibold text-(--brand-card) rounded-full bg-linear-to-r from-(--brand-blue) to-(--brand-green) shadow-[0_10px_20px_-10px_rgba(74,144,164,0.65)] transition-all hover:brightness-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger Toggle (Hidden on Desktop) */}
          <button 
            className="md:hidden p-2 -mr-2 text-(--brand-ink) transition-transform active:scale-95"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {/* Uses scale and opacity for a premium, snappy reveal animation */}
        <div className={`md:hidden absolute top-[calc(100%+8px)] left-4 right-4 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] origin-top z-40 ${isMobileMenuOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
          <div className="bg-(--brand-card)/95 backdrop-blur-3xl border border-(--brand-border) rounded-3xl shadow-[0_20px_60px_-15px_rgba(9,32,52,0.2)] p-4 flex flex-col gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigateSection(item.id)}
                className="text-left text-(--brand-ink) font-semibold px-4 py-3.5 hover:bg-background rounded-xl transition-colors"
              >
                {item.label}
              </button>
            ))}
            
            <div className="h-px w-full bg-(--brand-border) my-2" />
            
            <Link href="/login" className="text-center font-bold text-(--brand-card) px-4 py-3.5 bg-linear-to-r from-(--brand-blue) to-(--brand-green) rounded-xl shadow-md shadow-(color:--accent-blue)/20 active:scale-95 transition-all">Get Started</Link>
          </div>
        </div>
        
      </div>
    </nav>
  );
}