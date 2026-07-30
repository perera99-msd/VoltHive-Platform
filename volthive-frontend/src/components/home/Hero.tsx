'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_SLIDES = [
  {
    id: 'grid-sync',
    badge: 'VOLTHIVE INTELLIGENT GRID v2.4',
    title: 'Engineered for Speed, Intelligence & Direct Sync.',
    subtitle: 'Get your time back with AI-driven charging.',
    description: 'VoltHive balances grid loads in real-time, predicting station availability and guaranteeing your ultra-fast charging slot before you arrive.',
    bgImage: '/hero/hero_perfect_1.png',
    primaryCta: { text: 'Reserve a Charger', href: '/driver-login' },
    secondaryCta: { text: 'Explore Capabilities', href: '#services' },
    stats: [
      { value: '350 kW', label: 'Max Charge Speed' },
      { value: '99.9%', label: 'Guaranteed Uptime' },
      { value: '2,450+', label: 'Active Connectors' },
      { value: '4.2 Min', label: 'Queue Time Saved' }
    ]
  },
  {
    id: 'predictive-yield',
    badge: 'PREDICTIVE AI & DYNAMIC TARIFFS',
    title: 'Energy That Keeps You Moving Forward.',
    subtitle: 'Automated peak shaving & instant surge discounts.',
    description: 'Our digital city grid synchronizes solar, wind, and battery storage. Charge at automated discounted rates during peak renewable generation windows.',
    bgImage: '/hero/hero_perfect_2.png',
    primaryCta: { text: 'Driver Portal', href: '/driver-login' },
    secondaryCta: { text: 'Admin Center', href: '/owner-login' },
    stats: [
      { value: '0%', label: 'Gateway Cut' },
      { value: '-24%', label: 'Peak Tariff Saved' },
      { value: '< 1 Sec', label: 'Telemetry Sync' },
      { value: 'FIDO2', label: 'Biometric Auth' }
    ]
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 12000); // 12 seconds slow, serene rotation
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section id="hero" className="relative w-full min-h-[100dvh] md:h-[100dvh] overflow-hidden bg-(--background) flex items-center font-sans">
      
      {/* Full-bleed Crisp AI Background Image */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 2.8, ease: 'easeInOut' }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={slide.bgImage}
            alt={slide.title}
            fill
            className="object-cover opacity-100"
            priority
          />
          {/* Responsive Soft Mask Overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-(--background)/90 via-(--background)/60 md:via-(--background)/45 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-b from-(--background)/60 via-transparent to-(--background)/70 pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Floating Content Layout - Responsive Padding */}
      <div className="relative z-10 w-full max-w-[1500px] mx-auto px-5 sm:px-10 h-full flex flex-col justify-center py-20 md:py-0 md:pt-16 md:pb-20">
        
        <div className="max-w-3xl space-y-6 sm:space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${slide.id}`}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Floating Badge */}
              <motion.div 
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4.5 py-1.5 sm:py-2 rounded-full bg-white/95 backdrop-blur-md border border-(--brand-border) font-mono text-[10px] sm:text-xs font-black tracking-[0.16em] sm:tracking-[0.2em] uppercase text-(--brand-blue-deep) shadow-2xs"
              >
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-(--brand-green) animate-pulse" />
                <span>{slide.badge}</span>
              </motion.div>

              {/* Floating Main Title */}
              <motion.h1 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.4, delay: 0.3 }}
                className="text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight text-(--brand-ink) leading-[1.08] sm:leading-[1.05]"
              >
                {slide.title}
              </motion.h1>

              {/* Subtitle & Description */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4, delay: 0.5 }}
                className="space-y-2 sm:space-y-3"
              >
                <p className="text-lg sm:text-2xl font-extrabold text-(--brand-blue-deep) tracking-tight">
                  {slide.subtitle}
                </p>
                <p className="text-sm sm:text-xl text-(--brand-muted) font-medium leading-relaxed max-w-2xl text-balance">
                  {slide.description}
                </p>
              </motion.div>

              {/* Floating Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.4, delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4"
              >
                <Link
                  href={slide.primaryCta.href}
                  className="w-full sm:w-auto px-6 py-3.5 sm:px-10 sm:py-5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] bg-linear-to-r from-(--brand-blue-deep) via-(--brand-blue) to-(--brand-green) text-white shadow-xl shadow-(--brand-blue)/20 hover:brightness-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                >
                  <span>{slide.primaryCta.text}</span>
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href={slide.secondaryCta.href}
                  className="w-full sm:w-auto px-6 py-3.5 sm:px-10 sm:py-5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] bg-white/90 backdrop-blur-md border border-(--brand-border) text-(--brand-ink) hover:bg-white active:scale-95 transition-all text-center flex items-center justify-center shadow-2xs"
                >
                  <span>{slide.secondaryCta.text}</span>
                </Link>
              </motion.div>

              {/* Floating Stat Pills */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4, delay: 0.9 }}
                className="pt-4 sm:pt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-2xl"
              >
                {slide.stats.map((st, i) => (
                  <div key={i} className="p-2.5 sm:p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-(--brand-border) shadow-2xs">
                    <div className="text-lg sm:text-2xl font-black text-(--brand-ink)">{st.value}</div>
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-(--brand-muted) mt-0.5">{st.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Slider Controls */}
      <div className="absolute bottom-6 left-5 sm:bottom-10 sm:left-10 z-20 flex gap-2.5 sm:gap-3 items-center">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-1000 cursor-pointer ${
              idx === currentSlide 
                ? 'w-10 sm:w-12 bg-linear-to-r from-(--brand-blue) to-(--brand-green)' 
                : 'w-3 sm:w-4 bg-(--brand-border) hover:bg-(--brand-muted)/40'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}