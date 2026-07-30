'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import { Station } from '../../StationMap';

const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
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
    
    if (stations.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      stations.forEach(s => {
        bounds.extend({ lat: s.location.coordinates[1], lng: s.location.coordinates[0] });
      });
      map.fitBounds(bounds);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--brand-blue)"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-100px)] relative font-sans">
      
      {/* ── MAP CONTAINER ── */}
      <div className="absolute inset-0 bg-white border border-(--brand-border)/80 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
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
              iconSize={40}
              onClick={() => {
                setActiveStation(station);
                mapRef.current?.panTo({ lat: station.location.coordinates[1], lng: station.location.coordinates[0] });
              }}
            />
          ))}
        </GoogleMap>
      </div>

      {/* ── FLOATING OVERLAY ── */}
      <div className="absolute top-5 left-5 z-10 bg-white/90 backdrop-blur-xl px-5 py-3.5 rounded-2xl border border-(--brand-border)/80 shadow-sm pointer-events-none flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-(--brand-blue)/10 flex items-center justify-center text-(--brand-blue)">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
          <h2 className="text-[13px] font-extrabold text-(--brand-ink) tracking-tight">Geospatial Network</h2>
          <p className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-wider mt-0.5">{stations.length} Active Nodes</p>
        </div>
      </div>

      {/* ── STATION POPUP ── */}
      <AnimatePresence>
        {activeStation && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm bg-white/95 backdrop-blur-2xl rounded-2xl p-5 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] border border-(--brand-border)/80"
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4a90a4] to-[#6cb567] opacity-80 rounded-t-2xl" />
            
            <div className="flex justify-between items-start mb-4 mt-1">
              <div className="w-10 h-10 rounded-xl bg-(--surface-soft)/60 border border-(--brand-border)/60 flex items-center justify-center text-(--brand-blue)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
              <button onClick={() => setActiveStation(null)} className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <h3 className="text-[15px] font-extrabold text-(--brand-ink) tracking-tight mb-1 truncate">{activeStation.stationName || 'Station Details'}</h3>
            <p className="text-[11px] font-medium text-(--brand-muted) mb-5 truncate leading-relaxed">{activeStation.address}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-(--surface-soft)/40 rounded-xl p-3 border border-(--brand-border)/50 flex flex-col justify-center">
                <p className="text-[9px] uppercase font-extrabold text-(--brand-muted) tracking-wider mb-0.5">Base Rate</p>
                <p className="text-[13px] font-black text-(--brand-ink)">LKR {activeStation.pricePerKWh || 85}</p>
              </div>
              <div className="bg-(--surface-soft)/40 rounded-xl p-3 border border-(--brand-border)/50 flex flex-col justify-center">
                 <p className="text-[9px] uppercase font-extrabold text-(--brand-muted) tracking-wider mb-0.5">Hardware</p>
                 <p className="text-[13px] font-black text-(--brand-green-deep)">{activeStation.chargers?.length || 0} Ports</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
