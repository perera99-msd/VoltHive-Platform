 'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import StationMap from '../../../components/StationMap';
import type { Station } from '../../../components/StationMap';
import DriverSidebar from '../../../components/driver/DriverSidebar';
import BookingDrawer from '../../../components/driver/BookingDrawer';
import DriverHome from '../../../components/driver/views/DriverHome';
import MyGarage from '../../../components/driver/views/MyGarage';
import ReservationsView from '../../../components/driver/views/ReservationsView';
import AccountView from '../../../components/driver/views/AccountView';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../../../lib/api';

export default function DriverDashboard() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState<'home' | 'garage' | 'map' | 'reservations' | 'account'>('map');

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

  const handleMarkerClick = (station: Station) => {
    setSelectedStation(station);
  };

  return (
    <ProtectedRoute>
      <main className="fixed inset-0 w-full h-full font-sans overflow-hidden">
        {/* Keep map mounted to avoid remount lag/glitches when switching tabs */}
        <div className="absolute inset-0 z-0">
          <StationMap stations={stations} onBookClick={handleMarkerClick} />
        </div>

        {/* Lightweight premium tab-switch shimmer */}
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={`driver-tab-pulse-${activeTab}`}
            initial={{ opacity: 0.55, scaleX: 0, transformOrigin: 'left center' }}
            animate={{ opacity: 0, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 right-0 h-[2px] z-30 bg-linear-to-r from-(--brand-blue) to-(--brand-green) pointer-events-none"
          />
        </AnimatePresence>

        <AnimatePresence mode="sync" initial={false}>
          {activeTab !== 'map' && (
            <motion.div
              key={`driver-tab-${activeTab}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-20 bg-(--background)/94 backdrop-blur-2xl overflow-y-auto"
            >
              <div className="w-full min-h-dvh md:pl-30 md:pr-12 pt-12 px-6 pb-36 md:pb-14 max-w-7xl mx-auto">
                {activeTab === 'home' && <DriverHome onBookNow={() => setActiveTab('map')} />}
                {activeTab === 'garage' && <MyGarage />}
                {activeTab === 'reservations' && <ReservationsView />}
                {activeTab === 'account' && <AccountView />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Dock */}
        <DriverSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Booking Drawer */}
        <BookingDrawer station={selectedStation} onClose={() => setSelectedStation(null)} />
      </main>
    </ProtectedRoute>
  );
}