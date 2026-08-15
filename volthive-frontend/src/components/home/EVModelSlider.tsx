'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Reveal from '../common/Reveal';

interface EVModel {
  id: string;
  brand: string;
  name: string;
  category: string;
  batteryKwh: number;
  wltpRangeKm: number;
  maxDcKw: number;
  chargeTime10to80: number;
  plugStandard: string;
  estCostFullLkr: number;
  petrolSavingsLkr: number;
  image: string;
}

const EV_MODELS: EVModel[] = [
  {
    id: 'byd-atto-3',
    brand: 'BYD',
    name: 'Atto 3 Extended Range',
    category: 'Compact Crossover',
    batteryKwh: 60.48,
    wltpRangeKm: 420,
    maxDcKw: 88,
    chargeTime10to80: 29,
    plugStandard: 'CCS2',
    estCostFullLkr: 5140,
    petrolSavingsLkr: 16500,
    image: '/Home%20Page%20Assets/409609433f860d55a0a9f2d0400933d9.jpg',
  },
  {
    id: 'mg-zs-ev',
    brand: 'MG',
    name: 'ZS EV Trophy Edition',
    category: 'Electric SUV',
    batteryKwh: 51.1,
    wltpRangeKm: 320,
    maxDcKw: 75,
    chargeTime10to80: 36,
    plugStandard: 'CCS2',
    estCostFullLkr: 4340,
    petrolSavingsLkr: 13800,
    image: '/Home%20Page%20Assets/43b32459f7f680105f540a847d3bd6bf.jpg',
  },
  {
    id: 'hyundai-ioniq-5',
    brand: 'Hyundai',
    name: 'Ioniq 5 Long Range',
    category: '800V Ultra-Fast Crossover',
    batteryKwh: 72.6,
    wltpRangeKm: 480,
    maxDcKw: 150,
    chargeTime10to80: 18,
    plugStandard: 'CCS2',
    estCostFullLkr: 6170,
    petrolSavingsLkr: 19200,
    image: '/Home%20Page%20Assets/6b8170d1b41565c9cc0bbd7baa89ebc3.jpg',
  },
  {
    id: 'tesla-model-3',
    brand: 'Tesla',
    name: 'Model 3 Standard Range',
    category: 'Performance Sedan',
    batteryKwh: 60.0,
    wltpRangeKm: 491,
    maxDcKw: 150,
    chargeTime10to80: 22,
    plugStandard: 'CCS2 / NACS',
    estCostFullLkr: 5100,
    petrolSavingsLkr: 20400,
    image: '/Home%20Page%20Assets/6c0555571f7d8c7129523b2f8a25a96b.jpg',
  },
  {
    id: 'nissan-leaf',
    brand: 'Nissan',
    name: 'Leaf e+ Gen 2',
    category: 'Urban Commuter',
    batteryKwh: 40.0,
    wltpRangeKm: 270,
    maxDcKw: 50,
    chargeTime10to80: 40,
    plugStandard: 'CHAdeMO / Type 2',
    estCostFullLkr: 3400,
    petrolSavingsLkr: 10800,
    image: '/Home%20Page%20Assets/6d30a75ded7d0af81deae0f995859c1e.jpg',
  },
  {
    id: 'audi-etron',
    brand: 'Audi',
    name: 'e-tron 55 Quattro',
    category: 'Luxury Executive SUV',
    batteryKwh: 95.0,
    wltpRangeKm: 440,
    maxDcKw: 150,
    chargeTime10to80: 26,
    plugStandard: 'CCS2',
    estCostFullLkr: 8075,
    petrolSavingsLkr: 24500,
    image: '/Home%20Page%20Assets/89cd9baab15ec4cc387e61730b2d96a0.jpg',
  },
];

export default function EVModelSlider() {
  const [selectedId, setSelectedId] = useState(EV_MODELS[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToIndex = (idx: number) => {
    const safeIdx = (idx + EV_MODELS.length) % EV_MODELS.length;
    setCurrentIndex(safeIdx);
    setSelectedId(EV_MODELS[safeIdx].id);
    if (scrollContainerRef.current) {
      const cardWidth = 360 + 24; // width + gap
      scrollContainerRef.current.scrollTo({
        left: safeIdx * cardWidth,
        behavior: 'smooth',
      });
    }
  };

  // Slow auto-scroll every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      scrollToIndex(currentIndex + 1);
    }, 7000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  return (
    <section id="ev-compatibility" className="relative z-10 w-full bg-(--background) py-20 sm:py-28 px-5 sm:px-10 overflow-hidden font-sans border-t border-(--brand-border)">
      
      {/* Soft ambient background */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-(--brand-blue)/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1500px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <Reveal direction="left" className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-(--surface-soft) border border-(--brand-border) font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-(--brand-blue-deep) mb-4 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
              <span>EV Hardware Compatibility</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-(--brand-ink) leading-[1.06] mb-4">
              Optimized for Every Electric Vehicle.
            </h2>
            <p className="text-sm sm:text-lg text-(--brand-muted) font-medium leading-relaxed">
              Explore accurate battery capacities, 10%–80% charging durations, and real savings in LKR for Sri Lanka’s most popular EV models.
            </p>
          </Reveal>

          {/* Navigation Controls */}
          <Reveal direction="right" delay={0.1} className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => scrollToIndex(currentIndex - 1)}
              aria-label="Scroll left"
              className="w-11 h-11 rounded-full bg-white border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-soft) shadow-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scrollToIndex(currentIndex + 1)}
              aria-label="Scroll right"
              className="w-11 h-11 rounded-full bg-white border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-soft) shadow-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </Reveal>
        </div>

        {/* Horizontal Cards Slider with no-scrollbar */}
        <Reveal direction="up" delay={0.15}>
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 pt-2 px-1 no-scrollbar"
          >
            {EV_MODELS.map((ev, idx) => {
              const isSelected = ev.id === selectedId;
              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    setSelectedId(ev.id);
                    setCurrentIndex(idx);
                  }}
                  className={`snap-start shrink-0 w-[84%] sm:w-[360px] rounded-4xl bg-white/95 backdrop-blur-xl transition-all duration-500 overflow-hidden cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'border-2 border-(--brand-blue) shadow-[0_20px_50px_-15px_rgba(74,144,164,0.35)] ring-4 ring-(--brand-blue)/10 -translate-y-1.5'
                      : 'border border-(--brand-border) shadow-sm hover:shadow-lg hover:border-(--brand-blue)/40'
                  }`}
                >
                  {/* Photo Header */}
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-(--surface-soft)">
                    <Image
                      src={ev.image}
                      alt={`${ev.brand} ${ev.name}`}
                      fill
                      sizes="(max-width: 640px) 84vw, 360px"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Brand Pill */}
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-(--brand-ink) shadow-xs">
                        {ev.brand}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-(--surface-soft)/90 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-(--brand-blue-deep) border border-(--brand-border)">
                        {ev.plugStandard}
                      </span>
                    </div>

                    {/* Vehicle Title */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-(--accent-green)">
                        {ev.category}
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-white leading-snug">
                        {ev.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body Specs Grid */}
                  <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-(--background) border border-(--brand-border)/70">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-(--brand-muted)">Battery Pack</span>
                        <span className="block text-sm font-black text-(--brand-ink) mt-0.5">{ev.batteryKwh} kWh</span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-(--background) border border-(--brand-border)/70">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-(--brand-muted)">WLTP Range</span>
                        <span className="block text-sm font-black text-(--brand-ink) mt-0.5">{ev.wltpRangeKm} km</span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-(--background) border border-(--brand-border)/70">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-(--brand-muted)">10% to 80% Fast</span>
                        <span className="block text-sm font-black text-(--brand-blue-deep) mt-0.5">{ev.chargeTime10to80} mins</span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-(--background) border border-(--brand-border)/70">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-(--brand-muted)">Max DC Power</span>
                        <span className="block text-sm font-black text-(--brand-green-deep) mt-0.5">{ev.maxDcKw} kW</span>
                      </div>
                    </div>

                    {/* Savings Calculation Banner */}
                    <div className="p-3 rounded-2xl bg-(--surface-soft) border border-(--brand-border) flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-(--brand-muted)">
                          Est. Savings / Tank
                        </div>
                        <div className="text-xs font-black text-(--brand-green-deep)">
                          Save ~LKR {ev.petrolSavingsLkr.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-(--brand-muted)">
                          Full Charge
                        </div>
                        <div className="text-xs font-black text-(--brand-ink)">
                          LKR {ev.estCostFullLkr.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href="/guide"
                      className={`w-full py-3 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white shadow-md hover:brightness-105'
                          : 'bg-(--background) border border-(--brand-border) text-(--brand-ink) hover:bg-white'
                      }`}
                    >
                      <span>View Charging Specs &amp; Guide →</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

      </div>
    </section>
  );
}
