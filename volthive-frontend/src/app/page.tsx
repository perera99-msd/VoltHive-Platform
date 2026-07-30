'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HomeNavbar from '../components/home/HomeNavbar';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import PWAGuide from '../components/home/PWAGuide';
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

// Removed HomeSections in favor of dedicated components// ============================================================================
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

  const showHome = (sectionId = 'hero') => {
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
        onLogoClick={() => showHome('hero')}
        onNavigateSection={navigateToSection}
      />

      {/* 2. DYNAMIC CONTENT AREA */}
      <div className="flex-1 w-full relative">
        
        {/* MAP VIEW */}
        <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${isMapView ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <div className="w-full h-full overflow-hidden">
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
        <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar transition-opacity duration-500 ease-in-out ${!isMapView ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <Hero />
          <Features />
          <PWAGuide />
          <Footer />
        </div>
      </div>

      {/* 3. COMPACT CIRCULAR FLOATING ACTION BUTTON */}
      <div className={`fixed bottom-6 right-6 md:bottom-8 md:right-auto md:left-1/2 md:-translate-x-1/2 z-[60] transition-transform duration-500 ${selectedStation ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <button
          onClick={() => {
            if (isMapView) {
              showHome('hero');
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