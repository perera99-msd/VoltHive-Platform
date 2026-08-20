'use client';
import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import StationMap from '../../../components/StationMap';
import type { Station } from '../../../components/StationMap';
import DriverSidebar from '../../../components/driver/DriverSidebar';
import BookingDrawer from '../../../components/driver/BookingDrawer';
import DriverHome from '../../../components/driver/views/DriverHome';
import MyGarage from '../../../components/driver/views/MyGarage';
import ReservationsView from '../../../components/driver/views/ReservationsView';
import AccountView from '../../../components/driver/views/AccountView';
import Toast from '../../../components/common/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../../../lib/api';

export default function DriverDashboard() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState<'home' | 'garage' | 'map' | 'reservations' | 'account'>('map');

  // --- Chat target: a station picked from the map/drawer to open a conversation ---
  const [chatTargetStationId, setChatTargetStationId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' | 'info' } | null>(null);

  // Open chat inside the Profile (Account) section with a specific station pre-selected
  const handleMessageStation = (stationId: string) => {
    setChatTargetStationId(stationId);
    setActiveTab('account');
    setSelectedStation(null);
  };

  // Load stations and keep charger status/availability current (real DB data).
  const loadStations = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/stations'));
      if (res.ok) {
        const payload = await res.json();
        const stationsArray: Station[] = Array.isArray(payload) ? payload : (payload?.data ?? []);
        setStations(stationsArray);
        // Keep the currently open station drawer in sync with the fresh data.
        setSelectedStation(prev => {
          if (!prev) return prev;
          return stationsArray.find(s => s._id === prev._id) || prev;
        });
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    }
  }, []);

  useEffect(() => {
    loadStations();
    const interval = setInterval(loadStations, 45000); // keep station/charger status current
    return () => clearInterval(interval);
  }, [loadStations]);

  const handleMarkerClick = (station: Station) => {
    setSelectedStation(station);
  };

  return (
    <ProtectedRoute>
      <main className="fixed inset-0 w-full h-full font-sans overflow-hidden">
        {/* Keep map mounted to avoid remount lag/glitches when switching tabs */}
        <div className="absolute inset-0 z-0">
          <StationMap stations={stations} onBookClick={handleMarkerClick} onMessageClick={handleMessageStation} />
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
              className="absolute inset-0 z-20 overflow-y-auto bg-(--background)"
            >
              <div className="fixed inset-0 bg-(--background) pointer-events-none -z-10" />
              <div className="w-full min-h-dvh md:pl-[120px] lg:pl-[140px] md:pr-12 pt-12 px-6 pb-36 md:pb-14">
                {activeTab === 'home' && <DriverHome onBookNow={() => setActiveTab('map')} />}
                {activeTab === 'garage' && <MyGarage />}
                {activeTab === 'reservations' && <ReservationsView onMessageClick={handleMessageStation} />}
                {activeTab === 'account' && (
                  <AccountView
                    initialChatStationId={chatTargetStationId}
                    onChatConsumed={() => setChatTargetStationId(null)}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Dock */}
        <DriverSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Booking Drawer */}
        <BookingDrawer station={selectedStation} onClose={() => setSelectedStation(null)} onMessageClick={handleMessageStation} />

        <Toast
          message={toastMessage?.msg || null}
          type={toastMessage?.type || 'info'}
          onClose={() => setToastMessage(null)}
        />
      </main>
    </ProtectedRoute>
  );
}