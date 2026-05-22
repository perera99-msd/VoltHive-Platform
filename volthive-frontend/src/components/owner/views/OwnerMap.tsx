'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import { Station } from '../../StationMap';

const containerStyle = { width: '100%', height: '100%', borderRadius: '1.5rem' };
const defaultCenter = { lat: 6.9271, lng: 79.8612 }; 

function AdvancedMapMarker({
  map,
  position,
  iconUrl,
  iconSize,
  onClick,
}: {
  map: google.maps.Map | null;
  position: { lat: number; lng: number };
  iconUrl: string;
  iconSize: number;
  onClick?: () => void;
}) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let clickListener: google.maps.MapsEventListener | null = null;

    const setupMarker = async () => {
      if (!map || !window.google) return;
      const markerLib = (await window.google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;
      if (!isMounted) return;

      const el = document.createElement('img');
      el.src = iconUrl;
      el.alt = 'marker';
      el.style.width = `${iconSize}px`;
      el.style.height = `${iconSize}px`;
      el.style.objectFit = 'contain';

      const marker = new markerLib.AdvancedMarkerElement({
        map,
        position,
        content: el,
      });

      if (onClick) {
        clickListener = marker.addListener('click', onClick);
      }
      markerRef.current = marker;
    };
    setupMarker();
    return () => {
      isMounted = false;
      if (clickListener) clickListener.remove();
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
  }, [map, position, iconUrl, iconSize, onClick]);
  return null;
}

export default function OwnerMap() {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch(apiUrl('/api/stations/owner'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStations(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch owner stations', err);
      }
    };
    fetchStations();
  }, [user]);

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapInstance(map);
    
    // Auto-fit bounds to show all stations if they exist
    if (stations.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      stations.forEach(s => {
        bounds.extend({ lat: s.location.coordinates[1], lng: s.location.coordinates[0] });
      });
      map.fitBounds(bounds);
    }
  };

  if (!isLoaded) return <div className="w-full h-[600px] flex items-center justify-center font-bold text-(--brand-blue)">Loading Premium Map Engine...</div>;

  return (
    <div className="w-full h-[calc(100vh-100px)] relative bg-(--brand-card) rounded-3xl border border-(--brand-border) shadow-sm overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        options={{ disableDefaultUI: true, mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID' }}
        onLoad={handleMapLoad}
        onClick={() => setActiveStation(null)}
      >
        {stations.map((station) => (
          <AdvancedMapMarker
            key={station._id}
            map={mapInstance}
            position={{ lat: station.location.coordinates[1], lng: station.location.coordinates[0] }}
            iconUrl="/icons/station.png"
            iconSize={36}
            onClick={() => {
              setActiveStation(station);
              mapRef.current?.panTo({ lat: station.location.coordinates[1], lng: station.location.coordinates[0] });
            }}
          />
        ))}
      </GoogleMap>

      {/* Floating Header Overlay */}
      <div className="absolute top-6 left-6 z-10 bg-(--brand-card)/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-(--brand-border) shadow-lg pointer-events-none">
        <h2 className="text-xl font-bold text-(--brand-ink)">Hardware Network</h2>
        <p className="text-sm font-medium text-(--brand-muted)">Currently viewing your deployed nodes ({stations.length})</p>
      </div>

      <AnimatePresence>
        {activeStation && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm bg-(--brand-card)/95 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_20px_60px_-15px_rgba(9,32,52,0.3)] border border-(--brand-border)"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-(--surface-soft) text-(--brand-blue) rounded-xl border border-(--brand-border)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
              <button onClick={() => setActiveStation(null)} className="text-(--brand-muted) hover:text-(--ui-error) transition-colors bg-background p-1.5 rounded-full border border-(--brand-border)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <h3 className="text-2xl font-bold text-(--brand-ink) mb-1 truncate">{activeStation.stationName || 'Station Details'}</h3>
            <p className="text-sm font-medium text-(--brand-muted) mb-5 truncate leading-relaxed">{activeStation.address}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background rounded-xl p-3 border border-(--brand-border)">
                <p className="text-[10px] uppercase font-bold text-(--brand-muted) mb-1 tracking-widest">Base Rate</p>
                <p className="text-lg font-black text-(--brand-ink)">Rs. {activeStation.pricePerKWh || 85}</p>
              </div>
              <div className="bg-background rounded-xl p-3 border border-(--brand-border)">
                 <p className="text-[10px] uppercase font-bold text-(--brand-muted) mb-1 tracking-widest">Connectors</p>
                 <p className="text-lg font-black text-(--brand-green)">{activeStation.chargers?.length || 0} Ready</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}