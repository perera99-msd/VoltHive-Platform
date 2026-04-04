'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import StationMap from '../../../components/StationMap';
import OwnerSidebar from '../../../components/owner/OwnerSidebar';
import OwnerHome from '../../../components/owner/views/OwnerHome';
import LiveOperationsView from '../../../components/owner/views/LiveOperationsView';
import StationsView from '../../../components/owner/views/StationsView';
import AccountView from '../../../components/driver/views/AccountView';
import RateCalendar from '../../../components/owner/RateCalendar';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../../../lib/api';
import { auth } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { Station } from '../../../components/StationMap';

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'liveops' | 'stations' | 'map' | 'rates' | 'account'>('liveops');
  const [stations, setStations] = useState<Station[]>([]);
  const isMapView = activeTab === 'map';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStations([]);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(apiUrl('/api/stations/owner'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await response.json();
        if (response.ok && payload?.data) {
          setStations(payload.data);
        }
      } catch (error) {
        console.error('Failed to load owner stations:', error);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ProtectedRoute>
      <main className="fixed inset-0 w-full h-full bg-background font-sans overflow-hidden flex">
        
        {/* MAP LAYER (Always in background) */}
        <div className="absolute inset-0 w-full h-full z-0 lg:pl-65">
          <StationMap stations={stations} onBookClick={() => {}} userLocation={null} />
        </div>

        {/* SIDEBAR NAVIGATION */}
        <OwnerSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* MAIN CONTENT AREA */}
        <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={`owner-tab-pulse-${activeTab}`}
          initial={{ opacity: 0.55, scaleX: 0, transformOrigin: 'left center' }}
          animate={{ opacity: 0, scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 left-0 right-0 h-0.5 z-30 bg-linear-to-r from-(--brand-blue) to-(--brand-green) pointer-events-none"
        />
        </AnimatePresence>

        <AnimatePresence mode="sync" initial={false}>
        {!isMapView && (
          <motion.div
            key={`owner-tab-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20 lg:left-65 bg-(--background)/95 backdrop-blur-2xl overflow-y-auto custom-scrollbar flex flex-col"
          >
            
            {/* Desktop Top Header (Search & Notifications) */}
            <header className="hidden lg:flex items-center justify-between h-20 px-10 sticky top-0 z-30 bg-(--background)/80 backdrop-blur-xl border-b border-(--brand-border)/60">
              <div className="flex items-center bg-white border border-(--brand-border) rounded-xl px-4 py-2.5 w-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow focus-within:shadow-md focus-within:border-(--accent-blue)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-(--brand-muted)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Search stations, hardware IDs, or bookings..." className="bg-transparent outline-none ml-3 text-sm w-full text-(--brand-ink) placeholder:text-(--brand-muted)" />
              </div>
              <div className="flex items-center gap-4">
                <button className="relative p-2.5 bg-white border border-(--brand-border) rounded-full text-(--brand-muted) hover:text-(--brand-ink) shadow-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-(--ui-error) rounded-full border-2 border-white"></span>
                </button>
              </div>
            </header>

            {/* Scrollable Views */}
            <div className="flex-1 w-full pb-40 md:pb-16 pt-8 px-6 lg:px-10 max-w-7xl mx-auto">
              {activeTab === 'overview' && <OwnerHome />}
              {activeTab === 'liveops' && <LiveOperationsView />}
              {activeTab === 'stations' && <StationsView />}
              {activeTab === 'rates' && <RateCalendar />}
              {activeTab === 'account' && <AccountView />}
            </div>
          </motion.div>
        )}
        </AnimatePresence>

      </main>
    </ProtectedRoute>
  );
}