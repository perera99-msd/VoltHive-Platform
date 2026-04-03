'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import StationMap from '../../../components/StationMap';
import DriverSidebar from '../../../components/driver/DriverSidebar';
import BookingDrawer from '../../../components/driver/BookingDrawer';
import SmartMatchPanel from '../../../components/driver/SmartMatchPanel';
import DriverHome from '../../../components/driver/views/DriverHome';
import MyGarage from '../../../components/driver/views/MyGarage';
import ReservationsView from '../../../components/driver/views/ReservationsView';
import AccountView from '../../../components/driver/views/AccountView';

interface Station {
  _id: string;
  name: string;
  address: string;
  location: { coordinates: [number, number] };
  pricePerKWh: number;
  chargers: { plugType: string; powerKW: number; status: string }[];
}

export default function DriverDashboard() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState<'home' | 'garage' | 'map' | 'reservations' | 'account'>('map');

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
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

  const handleMarkerClick = (station: Station) => {
    setSelectedStation(station);
  };

  return (
    <ProtectedRoute>
      <main className="fixed inset-0 w-full h-full bg-(--background) font-sans overflow-hidden">
        
        {/* 1. MAP CANVAS (Always rendered to preserve state/GPS) */}
        <div className="absolute inset-0 w-full h-full z-0">
          <StationMap stations={stations} onMarkerClick={handleMarkerClick} userLocation={userLocation} />
        </div>

        {/* 2. OVERLAY VIEWS (Covers map with a frosted blur when not on 'map' tab) */}
        {activeTab !== 'map' && (
          <div className="absolute inset-0 z-20 bg-(--background)/95 backdrop-blur-2xl overflow-y-auto custom-scrollbar transition-all duration-300 animate-in fade-in">
            {/* THE FIX: 
              1. Removed `h-full` so the div can actually grow with its content.
              2. Added `min-h-[100dvh]` so short pages still blur the whole background.
              3. Bumped mobile padding to `pb-40` to give a generous, native-feeling clearance above the nav pill.
            */}
            <div className="w-full min-h-[100dvh] pb-40 md:pb-16 md:pl-[120px] md:pr-12 pt-12 px-6 max-w-5xl mx-auto flex flex-col">
              {activeTab === 'home' && <DriverHome onBookNow={() => setActiveTab('map')} />}
              {activeTab === 'garage' && <MyGarage />}
              {activeTab === 'reservations' && <ReservationsView />}
              {activeTab === 'account' && <AccountView />}
            </div>
          </div>
        )}

        {/* 3. NAVIGATION DOCK */}
        <DriverSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 4. WIDGETS (Only show on Map view) */}
        {activeTab === 'map' && <SmartMatchPanel />}
        <BookingDrawer 
          station={selectedStation} 
          onClose={() => setSelectedStation(null)} 
        />

      </main>
    </ProtectedRoute>
  );
}