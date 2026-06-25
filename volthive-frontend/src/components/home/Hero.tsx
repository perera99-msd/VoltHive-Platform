'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const sliderImages = [
  {
    url: 'https://i.pinimg.com/1200x/d9/de/b4/d9deb480c415baec5cff409061f8991c.jpg',
    fallback: '/brand/banner.jpg',
    tag: 'SYSTEM TELEMETRY v2.1',
    title: 'Intuitive Cockpit Control'
  },
  {
    url: 'https://i.pinimg.com/1200x/9a/2a/d8/9a2ad8a1a7a5af3471cdbfd276327d4a.jpg',
    fallback: '/owner login/owner login.jpg',
    tag: '800V HARDWARE ARCHITECTURE',
    title: 'High-Speed Supercharging'
  },
  {
    url: 'https://i.pinimg.com/736x/2f/2f/26/2f2f267289bad90757d7c16c00c101d8.jpg',
    fallback: '/brand/banner.jpg',
    tag: 'DIRECT SETTLEMENT POS',
    title: 'Zero-Fee Direct Checkouts'
  },
  {
    url: '/brand/banner.jpg',
    fallback: '/owner login/owner login.jpg',
    tag: 'PREDICTIVE AI ENGINE',
    title: 'Hourly Surge Optimization'
  }
];

const brandLogos = [
  { name: 'TOYOTA', spec: 'CCS2 COMPATIBLE' },
  { name: 'TATA MOTORS', spec: 'DIRECT POS' },
  { name: 'PORSCHE', spec: '800V HYPER' },
  { name: 'TESLA', spec: 'NACS ADAPTER' },
  { name: 'MERCEDES-EQ', spec: 'INTELLIGENT LOAD' },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activeSlide = sliderImages[currentSlide];

  return (
    <section id="about-us" className="relative pt-28 sm:pt-36 pb-16 lg:pt-44 lg:pb-24 px-6 sm:px-10 max-w-[1500px] mx-auto z-10 overflow-hidden font-sans">
      
      {/* Background Soft Gradients - Official Site Brand Palette */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[450px] bg-linear-to-tr from-(--surface-soft) via-(--brand-card) to-(--surface-tint) blur-3xl -z-10 rounded-full pointer-events-none opacity-80" />

      {/* Flagship Widescreen Widescope Hero Frame (Inspired by Volté Hyper & Tesla Model S interfaces) */}
      <div className="rounded-3xl sm:rounded-[3rem] border border-(--brand-border) bg-(--brand-card) p-8 sm:p-14 lg:p-18 shadow-[0_35px_100px_-30px_rgba(74,144,164,0.25)] relative overflow-hidden">
        
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-6 text-center lg:text-left z-20 flex flex-col justify-center">
            
            {/* Minimalist Tech Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-(--surface-soft) border border-(--brand-border) text-(--brand-blue-deep) text-[11px] font-black uppercase tracking-[0.2em] self-center lg:self-start mb-8 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
              <span>{activeSlide.tag}</span>
            </div>

            {/* Widescreen Automotive Flagship Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[4.35rem] font-black tracking-tight text-(--brand-ink) leading-[1.03] mb-6 text-balance">
              Power Forward. <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-(--brand-blue) via-(--brand-blue-deep) to-(--brand-green)">
                Intelligent EV Network.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-(--brand-muted) font-medium leading-relaxed mb-10 text-balance max-w-xl mx-auto lg:mx-0">
              Discover active connectors, reserve guaranteed 1-hour charging intervals, and stream instant hardware settlements directly via station POS kiosks.
            </p>

            {/* Flagship CTA Suite (Clean Typographic Buttons - No Emojis) */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center lg:justify-start max-w-md mx-auto lg:mx-0 w-full">
              <Link
                href="/driver-login"
                className="px-9 py-4.5 rounded-full bg-(--brand-ink) text-white font-extrabold text-xs sm:text-sm uppercase tracking-[0.18em] hover:bg-(--brand-blue) active:scale-95 transition-all shadow-[0_12px_30px_-10px_rgba(26,26,26,0.5)] flex items-center justify-center gap-2"
              >
                <span>DRIVER PORTAL →</span>
              </Link>

              <Link
                href="/owner-login"
                className="px-9 py-4.5 rounded-full bg-(--surface-soft) border border-(--brand-border) text-(--brand-ink) font-extrabold text-xs sm:text-sm uppercase tracking-[0.18em] hover:bg-(--surface-tint) active:scale-95 transition-all flex items-center justify-center"
              >
                <span>ADMIN CENTER</span>
              </Link>
            </div>

            {/* Slide Title Indicator */}
            <div className="mt-10 pt-7 border-t border-(--brand-border) flex items-center justify-between text-xs font-black tracking-wider uppercase text-(--brand-muted)">
              <span className="text-(--brand-ink)">Active View: {activeSlide.title}</span>
              <span className="font-mono text-(--brand-blue)">0{currentSlide + 1} / 0{sliderImages.length}</span>
            </div>
          </div>

          {/* Right Widescreen Showcase Box */}
          <div 
            className="lg:col-span-6 relative z-10 w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative rounded-3xl sm:rounded-[2.4rem] overflow-hidden border border-(--brand-border) bg-(--surface-soft) aspect-16/10 sm:aspect-4/3 shadow-2xl group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={imageErrors[currentSlide] ? activeSlide.fallback : activeSlide.url}
                    alt={activeSlide.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-102"
                    priority
                    unoptimized
                    onError={() => setImageErrors(prev => ({ ...prev, [currentSlide]: true }))}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-(--brand-ink)/50 via-transparent to-transparent opacity-70" />
                </motion.div>
              </AnimatePresence>

              {/* Minimalist Cockpit Overlay Card */}
              <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7 bg-(--brand-card)/92 backdrop-blur-xl rounded-2xl border border-(--brand-border) p-5 shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-(--brand-ink) text-white flex items-center justify-center font-mono font-bold text-xs">
                    0{currentSlide + 1}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-(--brand-ink)">Guaranteed Hourly Slot Grid</p>
                    <p className="text-[11px] font-semibold text-(--brand-muted) mt-0.5">00:00 - 24:00 Absolute Sync Windows</p>
                  </div>
                </div>
                <Link href="/download-app" className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-(--surface-soft) text-(--brand-blue-deep) font-black text-[11px] uppercase tracking-widest hover:bg-(--surface-tint) transition-colors border border-(--brand-border)">
                  ● NATIVE PWA
                </Link>
              </div>

              {/* Minimalist Directional Navigation Controls */}
              <div className="absolute top-5 right-5 flex gap-2 z-20">
                <button
                  type="button"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length)}
                  className="w-10 h-10 rounded-xl bg-(--brand-card)/85 hover:bg-(--brand-card) backdrop-blur-xl border border-(--brand-border) flex items-center justify-center text-(--brand-ink) font-bold text-base transition-all active:scale-95 cursor-pointer shadow-md"
                  aria-label="Previous image"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % sliderImages.length)}
                  className="w-10 h-10 rounded-xl bg-(--brand-card)/85 hover:bg-(--brand-card) backdrop-blur-xl border border-(--brand-border) flex items-center justify-center text-(--brand-ink) font-bold text-base transition-all active:scale-95 cursor-pointer shadow-md"
                  aria-label="Next image"
                >
                  →
                </button>
              </div>
            </div>

            {/* Minimalist Horizontal Track Bar Indicators */}
            <div className="flex justify-center gap-2.5 mt-6">
              {sliderImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-400 cursor-pointer ${
                    idx === currentSlide ? 'w-10 bg-(--brand-blue)' : 'w-2 bg-(--brand-border) hover:bg-(--brand-muted)'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Brand Ecosystem Specifications Footer Bar (No Emojis - Typographic Automotive Flagship Aesthetic) */}
        <div className="mt-16 pt-9 border-t border-(--brand-border)">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-(--brand-muted) text-center mb-8">
            Hardware & Automotive Ecosystem Compatibility Standard
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
            {brandLogos.map((brand) => (
              <div key={brand.name} className="rounded-2xl bg-(--surface-soft)/50 border border-(--brand-border)/80 p-4 text-center">
                <p className="font-black text-xs sm:text-sm text-(--brand-ink) tracking-wider uppercase mb-1">{brand.name}</p>
                <p className="text-[10px] font-bold text-(--brand-blue) tracking-widest uppercase">{brand.spec}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </section>
  );
}