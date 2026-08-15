'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Reveal from '../common/Reveal';

interface HubStation {
  id: string;
  name: string;
  location: string;
  corridor: string;
  description: string;
  image: string;
  maxPower: string;
  connectors: string[];
  availableSlots: number;
  totalSlots: number;
  pricePerKwh: number;
  rating: number;
  distanceKm: number;
  avgChargeTimeMin: number;
}

const FEATURED_HUBS: HubStation[] = [
  {
    id: 'colombo-port-city',
    name: 'Colombo Port City Superhub',
    location: 'Galle Face & Port City Blvd, Colombo 01',
    corridor: 'Urban Core Corridor',
    description: 'Ultra-fast liquid-cooled DC hyperchargers powered by rooftop solar and battery energy storage buffer.',
    image: '/Home%20Page%20Assets/06eef07b5babf927d5c975741088cebf.jpg',
    maxPower: '150 kW',
    connectors: ['CCS2', 'Type 2', 'Tesla NACS'],
    availableSlots: 4,
    totalSlots: 6,
    pricePerKwh: 85,
    rating: 4.9,
    distanceKm: 2.8,
    avgChargeTimeMin: 22,
  },
  {
    id: 'southern-welipenna',
    name: 'Southern Highway Welipenna Hub',
    location: 'E01 Expressway Service Area, Welipenna',
    corridor: 'Southern Expressway E01',
    description: 'High-throughput charging for expressway commuters with guaranteed pre-booked bays and lounge access.',
    image: '/Home%20Page%20Assets/374b431587a046af7b2b8adb2897c2ae.jpg',
    maxPower: '120 kW',
    connectors: ['CCS2', 'CHAdeMO', 'GB/T'],
    availableSlots: 3,
    totalSlots: 4,
    pricePerKwh: 90,
    rating: 4.9,
    distanceKm: 44.5,
    avgChargeTimeMin: 25,
  },
  {
    id: 'kandy-express-gateway',
    name: 'Kandy Gateway Central Hub',
    location: 'Kandy City Center & Peradeniya Rd, Kandy',
    corridor: 'Central Highlands E04',
    description: 'Central spine hypercharger linking the Central Province. Dynamic load balancing with AI smart dispatch.',
    image: '/Home%20Page%20Assets/3d932095e587f30ed41afa3c5d8babee.jpg',
    maxPower: '90 kW',
    connectors: ['CCS2', 'Type 2'],
    availableSlots: 2,
    totalSlots: 4,
    pricePerKwh: 80,
    rating: 4.9,
    distanceKm: 98.2,
    avgChargeTimeMin: 30,
  },
  {
    id: 'galle-fort-marina',
    name: 'Galle Fort Coastal Supercharger',
    location: 'Rampart St & Marine Walk, Galle Fort',
    corridor: 'Coastal Tourist Spine',
    description: 'Scenic charging point overlooking the Indian Ocean. Zero carbon certified with integrated battery backup.',
    image: '/Home%20Page%20Assets/6655bf1b9c0dc1d6990df5e3f42d5c11.jpg',
    maxPower: '120 kW',
    connectors: ['CCS2', 'CHAdeMO', 'Type 2'],
    availableSlots: 3,
    totalSlots: 4,
    pricePerKwh: 88,
    rating: 5.0,
    distanceKm: 116.0,
    avgChargeTimeMin: 24,
  },
  {
    id: 'negombo-lagoon',
    name: 'Negombo Airport Marina Depot',
    location: 'BIA Expressway Link, Negombo',
    corridor: 'Airport Transit Corridor',
    description: 'Direct link for fleet and airport transfers. Fast turnaround with 1-tap automated biometric authorization.',
    image: '/Home%20Page%20Assets/6d7deb9b692b2cca9ae1cc05ef0c8d42.jpg',
    maxPower: '150 kW',
    connectors: ['CCS2', 'GB/T', 'Tesla NACS'],
    availableSlots: 5,
    totalSlots: 6,
    pricePerKwh: 82,
    rating: 4.9,
    distanceKm: 31.4,
    avgChargeTimeMin: 20,
  },
  {
    id: 'jaffna-northern-hub',
    name: 'Jaffna City Point Hypercharger',
    location: 'KKS Road & Hospital Rd, Jaffna',
    corridor: 'Northern Corridor',
    description: 'High-capacity renewable charging hub supporting cross-island EV road trips and commercial fleets.',
    image: '/Home%20Page%20Assets/94e3cbeef6ec3cbdb49060f2fd730242.jpg',
    maxPower: '90 kW',
    connectors: ['CCS2', 'Type 2', 'CHAdeMO'],
    availableSlots: 2,
    totalSlots: 3,
    pricePerKwh: 78,
    rating: 4.8,
    distanceKm: 395.0,
    avgChargeTimeMin: 32,
  },
];

export default function HubStackCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % FEATURED_HUBS.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + FEATURED_HUBS.length) % FEATURED_HUBS.length);

  // Slow, serene automatic rotation (8 seconds)
  useEffect(() => {
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="hubs" className="relative z-10 w-full bg-(--background) py-20 sm:py-28 px-5 sm:px-10 overflow-hidden font-sans border-t border-(--brand-border)">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 -left-20 w-[450px] h-[450px] bg-(--brand-blue)/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-[450px] h-[450px] bg-(--brand-green)/8 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-[1500px] mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16">
          <Reveal direction="left" className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-(--surface-soft) border border-(--brand-border) font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-(--brand-blue-deep) mb-4 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
              <span>National Charging Corridors</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-(--brand-ink) leading-[1.06] mb-4">
              Strategic Superhubs. Guaranteed Slots.
            </h2>
            <p className="text-sm sm:text-lg text-(--brand-muted) font-medium leading-relaxed">
              Explore primary high-throughput corridors connecting every major provincial highway across Sri Lanka with real-time slot reservation.
            </p>
          </Reveal>

          {/* Navigation Controls */}
          <Reveal direction="right" delay={0.15} className="flex items-center gap-2.5 self-start lg:self-end shrink-0">
            <button
              onClick={prevSlide}
              aria-label="Previous Superhub"
              className="w-11 h-11 rounded-full bg-white border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-soft) shadow-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next Superhub"
              className="w-11 h-11 rounded-full bg-white border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-soft) shadow-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </Reveal>
        </div>

        {/* 3D Stack / Perspective Coverflow Container */}
        <Reveal direction="up" delay={0.2} className="relative min-h-[580px] sm:min-h-[620px] flex items-center justify-center">
          <div className="relative w-full max-w-5xl h-[520px] sm:h-[570px] flex items-center justify-center">
            {FEATURED_HUBS.map((hub, index) => {
              const offset = (index - activeIndex + FEATURED_HUBS.length) % FEATURED_HUBS.length;
              const normalizedOffset = offset > FEATURED_HUBS.length / 2 ? offset - FEATURED_HUBS.length : offset;
              const isCenter = normalizedOffset === 0;
              const isVisible = Math.abs(normalizedOffset) <= 2;

              if (!isVisible) return null;

              const xPos = normalizedOffset * 220;
              const scale = isCenter ? 1 : 0.88 - Math.abs(normalizedOffset) * 0.05;
              const zIndex = 20 - Math.abs(normalizedOffset) * 5;
              const opacity = isCenter ? 1 : 0.65 - Math.abs(normalizedOffset) * 0.15;
              const rotateY = normalizedOffset * -8;

              return (
                <motion.div
                  key={hub.id}
                  onClick={() => setActiveIndex(index)}
                  initial={false}
                  animate={{
                    x: xPos,
                    scale,
                    opacity,
                    zIndex,
                    rotateY,
                  }}
                  transition={{
                    duration: 1.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ transformPerspective: 1200 }}
                  className={`absolute top-0 w-[90%] max-w-[420px] sm:max-w-[440px] h-full rounded-4xl bg-white/95 backdrop-blur-xl border cursor-pointer transition-shadow duration-500 overflow-hidden flex flex-col justify-between ${
                    isCenter
                      ? 'border-(--brand-blue)/50 shadow-[0_26px_70px_-30px_rgba(74,144,164,0.35)] ring-2 ring-(--brand-blue)/20'
                      : 'border-(--brand-border) shadow-md hover:opacity-90'
                  }`}
                >
                  {/* Card Image Header */}
                  <div className="relative h-[240px] sm:h-[260px] w-full overflow-hidden shrink-0">
                    <Image
                      src={hub.image}
                      alt={hub.name}
                      fill
                      sizes="(max-width: 640px) 90vw, 440px"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                      priority={isCenter}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />
                    
                    {/* Top Floating Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-(--brand-blue-deep) shadow-xs">
                        {hub.maxPower} Fast DC
                      </span>
                      <span className="px-3 py-1 rounded-full bg-(--brand-green)/90 text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {hub.availableSlots} / {hub.totalSlots} Ready
                      </span>
                    </div>

                    {/* Bottom Image Title Info */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-(--accent-green)">
                        {hub.corridor}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mt-0.5 text-white">
                        {hub.name}
                      </h3>
                      <p className="text-xs text-white/80 font-medium truncate mt-1">
                        {hub.location}
                      </p>
                    </div>
                  </div>

                  {/* Card Body & Real Data Metrics */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs sm:text-sm text-(--brand-muted) font-medium leading-relaxed line-clamp-2">
                      {hub.description}
                    </p>

                    {/* Connector Standards Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {hub.connectors.map((c) => (
                        <span
                          key={c}
                          className="px-2.5 py-0.5 rounded-lg bg-(--surface-soft) text-(--brand-blue-deep) font-mono text-[10px] font-bold border border-(--brand-border)/80"
                        >
                          {c}
                        </span>
                      ))}
                      <span className="px-2.5 py-0.5 rounded-lg bg-(--surface-tint) text-(--brand-green-deep) font-mono text-[10px] font-bold border border-(--brand-border)/80">
                        ~{hub.avgChargeTimeMin}m to 80%
                      </span>
                    </div>

                    {/* Metric Row: Distance | Rating | Price */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-(--brand-border) text-center">
                      <div className="p-2 rounded-2xl bg-(--background)/80 border border-(--brand-border)/60">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-(--brand-muted)">Distance</div>
                        <div className="text-xs sm:text-sm font-black text-(--brand-ink)">{hub.distanceKm} km</div>
                      </div>
                      <div className="p-2 rounded-2xl bg-(--background)/80 border border-(--brand-border)/60">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-(--brand-muted)">Rating</div>
                        <div className="text-xs sm:text-sm font-black text-(--brand-ink)">{hub.rating.toFixed(1)} / 5.0</div>
                      </div>
                      <div className="p-2 rounded-2xl bg-(--background)/80 border border-(--brand-border)/60">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-(--brand-muted)">Rate</div>
                        <div className="text-xs sm:text-sm font-black text-(--brand-blue-deep)">LKR {hub.pricePerKwh}</div>
                      </div>
                    </div>

                    {/* Action CTA */}
                    <div className="pt-2">
                      <Link
                        href="/driver-login"
                        className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-[0.16em] text-center flex items-center justify-center gap-2 transition-all ${
                          isCenter
                            ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white shadow-md hover:brightness-105 active:scale-98'
                            : 'bg-(--surface-soft) text-(--brand-ink) hover:bg-(--surface-tint)'
                        }`}
                      >
                        <span>Reserve Slot</span>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Reveal>

        {/* Carousel Pagination Dots */}
        <div className="mt-8 flex justify-center items-center gap-3">
          {FEATURED_HUBS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to hub ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-700 cursor-pointer ${
                i === activeIndex
                  ? 'w-10 bg-linear-to-r from-(--brand-blue) to-(--brand-green)'
                  : 'w-2.5 bg-(--brand-border) hover:bg-(--brand-muted)/40'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
