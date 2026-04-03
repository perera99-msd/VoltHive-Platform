'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HomeNavbar from '../components/home/HomeNavbar';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import Footer from '../components/home/Footer';
import StationMap from '../components/StationMap';

interface Station {
  _id: string;
  name: string;
  address: string;
  location: { coordinates: [number, number] };
  pricePerKWh: number;
  chargers: { plugType: string; powerKW: number; status: string }[];
}

// ============================================================================
// PUBLIC STATION DRAWER (Locked Features for non-logged-in users)
// ============================================================================
const PublicStationDrawer = ({ station, onClose }: { station: Station | null, onClose: () => void }) => {
  if (!station) return null;

  const availableChargers = station.chargers.filter(c => c.status === 'Available').length;
  const totalChargers = station.chargers.length;
  const maxPower = Math.max(...station.chargers.map(c => c.powerKW));
  const plugTypes = Array.from(new Set(station.chargers.map(c => c.plugType)));

  return (
    <>
      <div className="fixed inset-0 bg-(--brand-ink)/10 backdrop-blur-[2px] z-70 transition-opacity duration-300" onClick={onClose} />
      <div className="fixed z-80 flex flex-col bg-(--brand-card)/95 backdrop-blur-3xl shadow-[0_-10px_80px_rgba(0,0,0,0.15)] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] animate-in bottom-0 left-0 right-0 h-[85dvh] sm:h-[75dvh] md:w-110 md:h-dvh md:top-0 md:bottom-auto md:left-auto md:rounded-l-[2.5rem] md:border-l border-(--brand-border) rounded-t-[2.5rem] slide-in-from-bottom-full md:slide-in-from-right-full pb-8 md:pb-0 overflow-x-hidden">
        
        {/* Handle for Mobile, Close Button for Desktop */}
        <div className="flex justify-center md:justify-end items-center p-6 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-(--brand-border) rounded-full md:hidden" />
          <button onClick={onClose} className="hidden md:flex w-8 h-8 bg-background hover:bg-(--accent-blue)/10 text-(--brand-muted) rounded-full items-center justify-center transition-colors">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          
          <div className="mb-6 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--accent-green)/10 text-(--brand-green-deep) text-[11px] font-bold uppercase tracking-widest border border-(--brand-green)/20">
                <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) animate-pulse" />
                {availableChargers} of {totalChargers} Available
              </span>
            </div>
            <h2 className="text-[28px] font-semibold text-(--brand-ink) tracking-tight leading-tight mb-2">{station.name}</h2>
            <p className="text-(--brand-muted) text-[14px] flex items-start gap-2 leading-relaxed">{station.address}</p>

            {/* Public Quick Actions */}
            <div className="flex items-center gap-3 mt-6">
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${station.location.coordinates[1]},${station.location.coordinates[0]}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-(--accent-blue)/10 hover:bg-(--accent-blue)/20 text-(--brand-blue-deep) rounded-2xl text-[13px] font-bold transition-all border border-(--accent-blue)/20"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                Directions
              </a>
              <a 
                href="tel:0112345678" 
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-(--brand-card) hover:bg-background text-(--brand-ink) rounded-2xl text-[13px] font-bold transition-all border border-(--brand-border) shadow-sm"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.041l-3.286-.47a1.125 1.125 0 00-1.073.436l-2.276 3.034c-2.126-1.01-3.951-2.835-4.96-4.96l3.034-2.276a1.125 1.125 0 00.436-1.073l-.47-3.286c-.075-.512-.525-.864-1.041-.864H4.5a2.25 2.25 0 00-2.25 2.25z" /></svg>
                Call
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="col-span-2 bg-(--brand-card)/60 p-5 rounded-3xl border border-(--brand-border) shadow-sm flex items-end justify-between">
              <div>
                <p className="text-(--brand-muted) text-[11px] font-bold uppercase tracking-widest mb-1">Charging Rate</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-light tracking-tighter text-(--brand-ink)">{station.pricePerKWh}</span>
                  <span className="text-sm font-semibold text-(--brand-muted)">LKR / kWh</span>
                </div>
              </div>
            </div>
            <div className="bg-(--brand-card)/60 p-5 rounded-3xl border border-(--brand-border) shadow-sm">
              <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-0.5">Max Output</p>
              <p className="text-xl font-light text-(--brand-ink)">{maxPower} <span className="text-sm font-semibold text-(--brand-muted)">kW</span></p>
            </div>
            <div className="bg-(--brand-card)/60 p-5 rounded-3xl border border-(--brand-border) shadow-sm">
              <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-2">Connectors</p>
              <div className="flex flex-wrap gap-1.5">
                {plugTypes.map(plug => (
                  <span key={plug} className="px-2 py-1 bg-background text-(--brand-muted) text-[10px] font-bold rounded uppercase border border-(--brand-border)">{plug}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Premium AI Lock Banner */}
          <div className="p-4 rounded-2xl bg-linear-to-r from-(--accent-blue)/10 to-(--accent-green)/10 border border-(--accent-blue)/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-(--brand-card) flex items-center justify-center shadow-sm text-(--brand-blue) shrink-0 border border-(--brand-border)">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-(--brand-ink)">Smart Match AI</p>
              <p className="text-[12px] font-medium text-(--brand-muted) mt-0.5 leading-relaxed">Sign in to unlock AI predictions, live queue tracking, and instant reservations.</p>
            </div>
          </div>
        </div>

        {/* Locked Reservation Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-(--brand-card) via-(--brand-card)/95 to-transparent rounded-b-[2.5rem] md:rounded-b-none">
          <Link href="/login" className="w-full py-4 rounded-2xl bg-(--brand-ink) text-(--brand-card) font-semibold text-[15px] hover:bg-(--brand-blue-deep) transition-all active:scale-[0.98] shadow-[0_12px_30px_rgba(26,26,26,0.18)] flex justify-center items-center gap-2">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            Sign in to Reserve Slot
          </Link>
        </div>
      </div>
    </>
  );
};

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
      <section id="how-to-join" className="relative z-10 px-4 sm:px-6 py-8 sm:py-12 max-w-7xl mx-auto overflow-x-hidden">
        <div className="rounded-4xl sm:rounded-[2.4rem] border border-(--brand-border) bg-(--brand-card)/85 backdrop-blur-sm shadow-[0_20px_60px_-30px_rgba(9,32,52,0.24)] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-(--brand-muted) font-semibold mb-2">How to Join</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-(--brand-ink) mb-3">A simple path from signup to charging.</h2>
            <p className="text-base sm:text-lg text-(--brand-muted) leading-relaxed">The home page should make the journey obvious, especially on mobile where space is tight and decisions need to be fast.</p>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {joinSteps.map((step, index) => (
              <article key={step.title} className="rounded-3xl border border-(--brand-border) bg-linear-to-br from-background to-(--brand-card) p-5 sm:p-6 shadow-[0_12px_30px_-20px_rgba(9,32,52,0.2)]">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-(--accent-blue)/12 text-(--brand-blue) font-semibold mb-4">
                  0{index + 1}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-(--brand-ink) mb-2">{step.title}</h3>
                <p className="text-sm sm:text-[15px] leading-relaxed text-(--brand-muted)">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="news" className="relative z-10 px-4 sm:px-6 py-8 sm:py-12 max-w-7xl mx-auto overflow-x-hidden">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
          <div className="rounded-4xl sm:rounded-[2.4rem] border border-(--brand-border) bg-linear-to-br from-(--brand-blue) to-(--brand-green) text-(--brand-card) p-6 sm:p-8 lg:p-10 shadow-[0_24px_60px_-30px_rgba(74,144,164,0.55)] relative overflow-hidden">
            <div className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-(--brand-card)/15 blur-3xl" />
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-(--brand-card)/80 font-semibold mb-3">News</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Updates that keep the network moving.</h2>
            <p className="text-(--brand-card)/90 text-base sm:text-lg leading-relaxed max-w-xl">Use this space for product updates, station announcements, and service notices without forcing users to hunt across the app.</p>
          </div>

          <div className="grid gap-4 sm:gap-5">
            {newsItems.map((item) => (
              <article key={item.title} className="rounded-3xl border border-(--brand-border) bg-(--brand-card)/90 p-5 sm:p-6 shadow-[0_12px_30px_-20px_rgba(9,32,52,0.18)]">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-(--brand-muted) font-semibold mb-3">{item.badge}</p>
                <h3 className="text-lg sm:text-xl font-semibold text-(--brand-ink) mb-2">{item.title}</h3>
                <p className="text-sm sm:text-[15px] text-(--brand-muted) leading-relaxed">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="partners" className="relative z-10 px-4 sm:px-6 py-8 sm:py-12 max-w-7xl mx-auto overflow-x-hidden">
        <div className="rounded-4xl sm:rounded-[2.4rem] border border-(--brand-border) bg-(--brand-card)/85 backdrop-blur-sm shadow-[0_20px_60px_-30px_rgba(9,32,52,0.22)] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8 sm:mb-10">
            <div className="max-w-2xl">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-(--brand-muted) font-semibold mb-2">Partners</p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-(--brand-ink) mb-3">Built for operators, venues, and mobility teams.</h2>
              <p className="text-base sm:text-lg text-(--brand-muted) leading-relaxed">VoltHive works best when the whole charging network feels connected across property, fleet, and customer experiences.</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start lg:self-auto px-4 py-2 rounded-full border border-(--brand-border) bg-background text-(--brand-muted) text-sm font-semibold">
              Network ready
            </div>
          </div>

          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {partnerGroups.map((group) => (
              <div key={group} className="rounded-[1.35rem] border border-(--brand-border) bg-linear-to-br from-background to-(--brand-card) p-5 sm:p-6">
                <div className="w-11 h-11 rounded-2xl bg-(--accent-green)/18 text-(--brand-green-deep) flex items-center justify-center font-semibold mb-4">
                  •
                </div>
                <h3 className="text-lg font-semibold text-(--brand-ink) mb-2">{group}</h3>
                <p className="text-sm sm:text-[15px] text-(--brand-muted) leading-relaxed">Flexible rollout support, branded experiences, and consistent station visibility across the network.</p>
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
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [isMapView, setIsMapView] = useState(false);

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
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.error("Location error:", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stations');
        if (res.ok) {
          const data = await res.json();
          setStations(data);
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
             <StationMap stations={stations} onMarkerClick={setSelectedStation} userLocation={userLocation} />
          </div>
          {selectedStation && <PublicStationDrawer station={selectedStation} onClose={() => setSelectedStation(null)} />}
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
      <div className={`fixed bottom-6 right-6 md:bottom-8 md:right-auto md:left-1/2 md:-translate-x-1/2 z-60 transition-transform duration-500 ${selectedStation ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
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

    </main>
  );
}