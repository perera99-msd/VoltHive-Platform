'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HomeNavbar from '../components/home/HomeNavbar';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import Footer from '../components/home/Footer';
import StationMap from '../components/StationMap';
import BookingDrawer from '../components/driver/BookingDrawer';
import { apiUrl } from '../lib/api';

interface Station {
  _id: string;
  name: string;
  address: string;
  location: { coordinates: [number, number] };
  pricePerKWh: number;
  chargers: { _id: string; plugType: string; powerKW: number; status: string }[];
}

const joinSteps = [
  {
    title: 'Create your account',
    description: 'Create your account once and keep your driver profile, vehicle details, and charging preferences in one place.',
  },
  {
    title: 'Choose a station',
    description: 'Use live availability, pricing, and location data to find the right stop before you arrive.',
  },
  {
    title: 'Plug in and go',
    description: 'Reserve a slot, start charging, and keep your trip moving without extra friction.',
  },
];

const newsItems = [
  {
    badge: 'Platform update',
    title: 'Faster station discovery on mobile',
    description: 'The home map now opens with a cleaner, thumb-friendly action button on smaller screens.',
  },
  {
    badge: 'Operations',
    title: 'Better pricing visibility for owners',
    description: 'Station partners can read demand signals faster and react with more confidence.',
  },
  {
    badge: 'Travel insights',
    title: 'More reliable trip planning',
    description: 'Drivers can compare nearby chargers, capacity, and timing without losing context.',
  },
];

const partnerGroups = [
  'Fleet operators',
  'Retail locations',
  'Hospitality venues',
  'Energy providers',
];

function HomeSections() {
  return (
    <>
      {/* SECTION: AI NETWORK TELEMETRY GAZETTE */}
      <section id="news" className="relative z-10 px-6 sm:px-10 py-12 sm:py-20 max-w-[1500px] mx-auto font-sans">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-stretch">
          
          {/* Main Gazette Flagship Card */}
          <div className="rounded-3xl sm:rounded-[3rem] border border-(--brand-border) bg-linear-to-br from-(--brand-blue-deep) via-(--brand-blue) to-(--brand-green) text-white p-10 sm:p-14 lg:p-16 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/12 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 font-mono text-xs font-black uppercase tracking-widest text-white">
                <span>TELEMETRY ENGINE ● ARCHITECTURE</span>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                Smart pricing decisions computed from live grid data.
              </h2>
              <p className="text-white/95 text-base sm:text-xl leading-relaxed max-w-2xl font-medium text-balance">
                Our predictive Python tariff module continuously queries active hardware sensor streams and local weather APIs to balance station demand loads across peak 6-hour windows.
              </p>
            </div>
            
            <div className="pt-8 mt-10 border-t border-white/20 flex items-center justify-between font-mono text-xs font-black text-white/95 relative z-10">
              <span>PROTOCOL v2.1 ACTIVE</span>
              <span>● AUTONOMOUS YIELD SYNC</span>
            </div>
          </div>

          {/* Side Telemetry Stack */}
          <div className="grid gap-6">
            {newsItems.map((item, idx) => (
              <article key={item.title} className="rounded-3xl border border-(--brand-border) bg-(--brand-card) p-7 sm:p-9 shadow-sm hover:border-(--brand-blue) transition-all flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 font-mono text-xs font-black tracking-wider uppercase text-(--brand-blue) mb-3">
                  <span>LOG ● 0{idx + 1}</span>
                  <span>— {item.badge}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-(--brand-ink) mb-2.5 tracking-tight">{item.title}</h3>
                <p className="text-sm sm:text-base text-(--brand-muted) leading-relaxed font-medium">{item.description}</p>
              </article>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION: COMMERCIAL FLEETS & POS PORTALS */}
      <section id="partners" className="relative z-10 px-6 sm:px-10 py-12 sm:py-20 max-w-[1500px] mx-auto font-sans">
        <div className="rounded-3xl sm:rounded-[3rem] border border-(--brand-border) bg-(--brand-card) p-10 sm:p-14 lg:p-18 shadow-[0_30px_90px_-25px_rgba(74,144,164,0.22)]">
          
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-(--brand-green-deep) font-black mb-3">Commercial Operators</p>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-(--brand-ink) mb-5">
                Hardware checkouts without gateway fees.
              </h2>
              <p className="text-base sm:text-xl text-(--brand-muted) leading-relaxed font-medium text-balance">
                Connect your physical charging station hardware to VoltHive's predictive Python surge engine and stream direct zero-cut hardware settlements.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              <Link 
                href="/owner-login" 
                className="px-9 py-4.5 rounded-full text-xs font-extrabold uppercase tracking-[0.18em] bg-linear-to-r from-(--brand-blue-deep) via-(--brand-blue) to-(--brand-green) text-white shadow-lg hover:brightness-105 active:scale-95 transition-all text-center flex items-center justify-center"
              >
                <span>ADMIN CENTER</span>
              </Link>
              <Link 
                href="/driver-login" 
                className="px-9 py-4.5 rounded-full text-xs font-extrabold uppercase tracking-[0.18em] bg-(--surface-soft) border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-tint) transition-all text-center flex items-center justify-center"
              >
                <span>DRIVER PORTAL →</span>
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {partnerGroups.map((group, gIdx) => (
              <div key={group} className="rounded-3xl border border-(--brand-border) bg-(--surface-soft)/30 p-8 hover:border-(--brand-green) hover:bg-(--brand-card) transition-all group shadow-none hover:shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-(--brand-card) border border-(--brand-border) shadow-xs text-(--brand-green-deep) flex items-center justify-center font-mono font-black text-sm mb-6 group-hover:scale-110 transition-transform">
                  0{gIdx + 1}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-(--brand-ink) mb-3 tracking-tight">{group}</h3>
                <p className="text-sm sm:text-base text-(--brand-muted) leading-relaxed font-medium">
                  Zero-fee POS hardware checkouts, custom AI surge threshold parameters, and real-time dashboard auditing.
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function Home() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [isMapView, setIsMapView] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  useEffect(() => {
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isPwa) {
      router.replace('/driver-login');
    }
  }, [router]);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showHome = (sectionId = 'about-us') => {
    setIsMapView(false);
    setSelectedStation(null);
    window.setTimeout(() => scrollToSection(sectionId), 50);
  };

  const navigateToSection = (sectionId: string) => {
    if (isMapView) {
      showHome(sectionId);
      return;
    }

    scrollToSection(sectionId);
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setShowLocationWarning(false);
        },
        (error) => {
          console.warn("Location access denied or unavailable.");
          setShowLocationWarning(true);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setTimeout(() => setShowLocationWarning(true), 0);
    }
  }, []);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await fetch(apiUrl('/api/stations'));
        if (res.ok) {
          const payload = await res.json();
          const stationsArray = Array.isArray(payload) ? payload : (payload?.data ?? []);
          setStations(stationsArray);
        }
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      }
    };
    fetchStations();
  }, []);

  return (
    <main className="min-h-dvh w-full text-(--brand-ink) selection:bg-(--accent-blue)/30 font-sans bg-background flex flex-col relative overflow-hidden">
      
      {/* 1. TOP NAVBAR */}
      <HomeNavbar
        onLogoClick={() => showHome('about-us')}
        onNavigateSection={navigateToSection}
      />

      {/* 2. DYNAMIC CONTENT AREA */}
      <div className="flex-1 w-full relative">
        
        {/* MAP VIEW */}
        <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${isMapView ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <div className="w-full h-full pt-22 sm:pt-26 overflow-x-hidden">
             <StationMap
               stations={stations}
               isGuest={true}
               onBookClick={(station) =>
                 setSelectedStation({
                   _id: station._id,
                   name: station.name || station.stationName || 'VoltHive Station',
                   address: station.address || 'Location on map',
                   location: station.location,
                   pricePerKWh: station.pricePerKWh ?? 0,
                   chargers: station.chargers ?? [],
                 })
               }
               userLocation={userLocation}
             />
          </div>
          {selectedStation && (
            <BookingDrawer 
              station={selectedStation} 
              onClose={() => setSelectedStation(null)} 
              isGuest={true} 
            />
          )}
        </div>

        {/* HOME / MARKETING VIEW */}
        <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar pb-32 transition-opacity duration-500 ease-in-out ${!isMapView ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <Hero />
          <Features />
          <HomeSections />
          <Footer />
        </div>
      </div>

      {/* 3. COMPACT CIRCULAR FLOATING ACTION BUTTON */}
      <div className={`fixed bottom-6 right-6 md:bottom-8 md:right-auto md:left-1/2 md:-translate-x-1/2 z-[60] transition-transform duration-500 ${selectedStation ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <button
          onClick={() => {
            if (isMapView) {
              showHome('about-us');
              return;
            }

            setIsMapView(true);
            setSelectedStation(null);
          }}
          className="flex items-center justify-center gap-2 w-14 h-14 md:w-auto md:h-14 md:px-5 rounded-full bg-(--brand-ink) text-(--brand-card) shadow-xl shadow-(--brand-ink)/30 border border-(--brand-border) hover:scale-105 hover:bg-(--brand-blue-deep) active:scale-95 transition-all"
          aria-label={isMapView ? 'Return to Home' : 'Explore Live Map'}
        >
          {isMapView ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="hidden md:inline text-sm font-semibold">Home</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" x2="9" y1="3" y2="18" />
                <line x1="15" x2="15" y1="6" y2="21" />
              </svg>
              <span className="hidden md:inline text-sm font-semibold">Live Map</span>
            </>
          )}
        </button>
      </div>

      {/* 4. LOCATION WARNING TOAST (Non-blocking) */}
      {(showLocationWarning && isMapView) && (
        <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[100] bg-(--brand-card) border border-(--brand-border) shadow-xl p-4 rounded-2xl flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="text-(--accent-blue) shrink-0 mt-0.5">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-(--brand-ink)">Location Services Disabled</p>
            <p className="text-[13px] text-(--brand-muted) mt-1 leading-relaxed">
              Turn on device location to see nearby charging stations and accurate distances.
            </p>
          </div>
          <button 
            onClick={() => setShowLocationWarning(false)} 
            className="text-(--brand-muted) hover:text-(--brand-ink) bg-background hover:bg-(--brand-border) rounded-full p-1 transition-colors self-start -mt-1 -mr-1"
            aria-label="Dismiss location warning"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

    </main>
  );
}