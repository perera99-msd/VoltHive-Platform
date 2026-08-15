'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Reveal from '../common/Reveal';

interface NetworkStation {
  _id: string;
  name?: string;
  stationName?: string;
  address?: string;
  pricePerKWh?: number;
  chargers?: Array<{ _id: string; plugType?: string; powerKW?: number; status?: string }>;
}

const ALL_ASSET_IMAGES = [
  '/Home%20Page%20Assets/06eef07b5babf927d5c975741088cebf.jpg',
  '/Home%20Page%20Assets/10dc414401da2b05852877d5d2c634f9.jpg',
  '/Home%20Page%20Assets/374b431587a046af7b2b8adb2897c2ae.jpg',
  '/Home%20Page%20Assets/3d932095e587f30ed41afa3c5d8babee.jpg',
  '/Home%20Page%20Assets/409609433f860d55a0a9f2d0400933d9.jpg',
  '/Home%20Page%20Assets/43b32459f7f680105f540a847d3bd6bf.jpg',
  '/Home%20Page%20Assets/6655bf1b9c0dc1d6990df5e3f42d5c11.jpg',
  '/Home%20Page%20Assets/6b8170d1b41565c9cc0bbd7baa89ebc3.jpg',
  '/Home%20Page%20Assets/6c0555571f7d8c7129523b2f8a25a96b.jpg',
  '/Home%20Page%20Assets/6d30a75ded7d0af81deae0f995859c1e.jpg',
  '/Home%20Page%20Assets/6d7deb9b692b2cca9ae1cc05ef0c8d42.jpg',
  '/Home%20Page%20Assets/89cd9baab15ec4cc387e61730b2d96a0.jpg',
  '/Home%20Page%20Assets/8a2f6059fb1bd6e3e2e225a3edd891d9.jpg',
  '/Home%20Page%20Assets/8c4bf3bf5d8ee96c71c64b6f9af3b4ad.jpg',
  '/Home%20Page%20Assets/91d5a71d26416bbca8d6c5b68526df73.jpg',
  '/Home%20Page%20Assets/94e3cbeef6ec3cbdb49060f2fd730242.jpg',
  '/Home%20Page%20Assets/a3a8772f5db5aeda72089a153c67bef4.jpg',
  '/Home%20Page%20Assets/a8dcd58b3946f906f79adb2c381371a7.jpg',
  '/Home%20Page%20Assets/b1c7769b20c64b1d4d79b34c6eb3eba0.jpg',
  '/Home%20Page%20Assets/c33398713186229aa2f8010da0a4dec9.jpg',
  '/Home%20Page%20Assets/e8d723b228923ffdfd90dcf39a1bc41c.jpg',
];

const CITY_FILTERS = ['All Hubs', 'Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna', 'Expressways'];

export default function NetworkCarousel({ stations = [] }: { stations?: NetworkStation[] }) {
  const [selectedCity, setSelectedCity] = useState('All Hubs');
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.75), behavior: 'smooth' });
  };

  const filteredStations = useMemo(() => {
    if (selectedCity === 'All Hubs') return stations;
    const query = selectedCity.toLowerCase();
    return stations.filter((s) => {
      const name = (s.name || s.stationName || '').toLowerCase();
      const addr = (s.address || '').toLowerCase();
      if (selectedCity === 'Expressways') {
        return name.includes('express') || addr.includes('highway') || addr.includes('e01') || addr.includes('e04');
      }
      return name.includes(query) || addr.includes(query);
    });
  }, [stations, selectedCity]);

  const displayList = filteredStations.length > 0 ? filteredStations : stations;

  // Slow auto-scroll every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      scrollByCard(1);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="network" className="relative z-10 w-full bg-(--background) py-20 sm:py-28 px-5 sm:px-10 overflow-hidden font-sans border-t border-(--brand-border)">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/4 w-[450px] h-[450px] bg-(--brand-blue)/8 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-[1500px] mx-auto">
        
        {/* Header */}
        <Reveal direction="left" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 sm:mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-(--surface-soft) border border-(--brand-border) font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-(--brand-blue-deep) mb-4 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
              <span>LIVE NATIONAL DIRECTORY</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-(--brand-ink) leading-[1.06] mb-4">
              Real Stations. Real-Time Availability.
            </h2>
            <p className="text-sm sm:text-lg text-(--brand-muted) font-medium leading-relaxed">
              Browse live charging points across the island with verified socket health, kW power rates, and live connector occupancy.
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => scrollByCard(-1)}
              aria-label="Scroll left"
              className="w-11 h-11 rounded-full bg-white border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-soft) shadow-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scrollByCard(1)}
              aria-label="Scroll right"
              className="w-11 h-11 rounded-full bg-white border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-soft) shadow-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </Reveal>

        {/* City Filter Pills */}
        <Reveal direction="up" delay={0.1} className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {CITY_FILTERS.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                selectedCity === city
                  ? 'bg-(--brand-ink) text-white shadow-sm'
                  : 'bg-white border border-(--brand-border) text-(--brand-muted) hover:text-(--brand-ink) hover:bg-(--surface-soft)'
              }`}
            >
              {city}
            </button>
          ))}
        </Reveal>

        {/* Horizontal Card Track with no-scrollbar */}
        <Reveal direction="up" delay={0.15}>
          <div
            ref={trackRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 no-scrollbar"
          >
            {displayList.map((s, i) => {
              const img = ALL_ASSET_IMAGES[i % ALL_ASSET_IMAGES.length];
              const total = s.chargers?.length || 0;
              const available = s.chargers?.filter((c) => c.status === 'AVAILABLE').length || 0;
              const name = s.name || s.stationName || 'VoltHive Station';
              const maxKw = s.chargers && s.chargers.length > 0
                ? Math.max(...s.chargers.map((c) => c.powerKW || 50))
                : 60;
              const plugs = Array.from(new Set((s.chargers || []).map((c) => c.plugType).filter(Boolean)));

              return (
                <div
                  key={s._id || i}
                  className="snap-start shrink-0 w-[82%] sm:w-[350px] rounded-4xl border border-(--brand-border) bg-white/95 backdrop-blur-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-(--brand-blue)/40 transition-all duration-500 group flex flex-col justify-between"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-(--surface-soft)">
                    <Image
                      src={img}
                      alt={name}
                      fill
                      sizes="(max-width: 640px) 82vw, 350px"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-(--brand-ink)/80 via-transparent to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-(--brand-blue-deep) shadow-xs">
                        {maxKw} kW DC
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-white shadow-xs ${available > 0 ? 'bg-(--brand-green)' : 'bg-(--brand-muted)'}`}>
                        {available > 0 ? `${available} / ${total} Free` : 'Occupied'}
                      </span>
                    </div>

                    <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                      <h3 className="text-base font-black text-white tracking-tight truncate">
                        {name}
                      </h3>
                      <p className="text-xs text-white/80 font-medium truncate mt-0.5">
                        {s.address || 'Sri Lanka'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Plug Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {(plugs.length > 0 ? plugs : ['CCS2', 'Type 2']).map((plug, pIdx) => (
                        <span
                          key={pIdx}
                          className="px-2.5 py-0.5 rounded-lg bg-(--surface-soft) text-(--brand-blue-deep) font-mono text-[10px] font-bold border border-(--brand-border)"
                        >
                          {plug}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-(--brand-border) flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-(--brand-muted) block">
                          Current Tariff
                        </span>
                        <span className="text-sm font-black text-(--brand-ink)">
                          {s.pricePerKWh ? `LKR ${s.pricePerKWh}` : 'LKR 85'}
                          <span className="text-[10px] font-bold text-(--brand-muted)"> / kWh</span>
                        </span>
                      </div>

                      <Link
                        href="/driver-login"
                        className="px-5 py-2.5 rounded-full bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-[11px] font-black uppercase tracking-wider hover:brightness-105 transition-all shadow-xs"
                      >
                        Reserve
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {displayList.length === 0 && (
              <div className="w-full rounded-3xl border border-(--brand-border) bg-white p-12 text-center text-sm font-semibold text-(--brand-muted)">
                Connecting to live network feed…
              </div>
            )}
          </div>
        </Reveal>

      </div>
    </section>
  );
}
