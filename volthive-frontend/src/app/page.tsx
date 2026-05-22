'use client';

import { useState, useEffect } from 'react';
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
            <div className="ml-3 self-start lg:self-auto">
              <Link href="/owner-login" className="px-4 py-2 rounded-full text-sm font-semibold bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-(--brand-card) shadow-[0_8px_20px_rgba(74,144,164,0.18)]">Owner Login</Link>
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
  const [showLocationWarning, setShowLocationWarning] = useState(false);

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