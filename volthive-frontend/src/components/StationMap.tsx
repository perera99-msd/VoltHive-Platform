'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';
import { AnimatePresence, motion } from 'framer-motion';

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo

// --- TYPES ---
interface Charger {
  plugType: string;
  powerKW: number;
  status: 'Available' | 'Occupied' | 'Offline';
}

export interface Station {
  _id: string;
  name?: string;
  stationName?: string;
  address?: string;
  location: { coordinates: [number, number] }; // [lng, lat]
  pricePerKWh?: number;
  chargers?: Charger[];
}

interface RankedStation extends Station {
  currentDynamicPrice: number;
  demandStatus: string;
  routeData: { distanceKm: string; driveTimeMins: number };
}

interface StationMapProps {
  userLocation?: { lat: number; lng: number } | null;
  stations?: Station[];
  onBookClick?: (station: Station) => void;
}

const PLUG_TYPES = ['CCS2', 'CHAdeMO', 'CCS1', 'Type 2', 'Type 1', 'GB/T'];

const fadeSlide = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 18, scale: 0.98 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

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

export default function StationMap({ userLocation, stations = [], onBookClick }: StationMapProps) {
  const [detectedUserLocation, setDetectedUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const hasAutoCenteredUser = useRef(false);

  const effectiveUserLocation = userLocation ?? detectedUserLocation;

  // Controlled viewport state so map doesn't jump unexpectedly on popup close.
  const [viewportCenter, setViewportCenter] = useState<{ lat: number; lng: number }>(defaultCenter);
  const [viewportZoom, setViewportZoom] = useState<number>(13);

  useEffect(() => {
    if (userLocation) return;
    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setDetectedUserLocation(nextLocation);

        // Auto-center once on first resolved location.
        if (!hasAutoCenteredUser.current) {
          setViewportCenter(nextLocation);
          setViewportZoom(13);
          hasAutoCenteredUser.current = true;
        }
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true }
    );
  }, [userLocation]);

  // --- UI STATES ---
  const [viewState, setViewState] = useState<'idle' | 'searching' | 'results'>('idle');
  const [activeIdleStation, setActiveIdleStation] = useState<Station | null>(null);

  // --- SEARCH FORM STATES ---
  const [batteryLevel, setBatteryLevel] = useState<number>(50);
  const [selectedPlugs, setSelectedPlugs] = useState<string[]>(['CCS2']);
  const [isLoading, setIsLoading] = useState(false);

  // --- RESULTS STATES ---
  const [results, setResults] = useState<RankedStation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const currentOption = results[selectedIndex];

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  // AdvancedMarkerElement requires a valid map ID. Use project env if present,
  // otherwise fall back to Google's demo map ID for local/dev environments.
  const resolvedMapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

  // --- ROUTING EFFECT ---
  useEffect(() => {
    if (viewState === 'results' && results.length > 0 && effectiveUserLocation && window.google) {
      const targetStation = results[selectedIndex];
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: effectiveUserLocation,
          destination: { lat: targetStation.location.coordinates[1], lng: targetStation.location.coordinates[0] },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
          } else {
            console.error(`Route error: ${status}`);
            setDirectionsResponse(null);
          }
        }
      );
    }
  }, [results, selectedIndex, effectiveUserLocation, viewState]);

  // --- HANDLERS ---
  const togglePlug = (plug: string) => {
    setSelectedPlugs(prev => 
      prev.includes(plug) ? prev.filter(p => p !== plug) : [...prev, plug]
    );
  };

  const handleSearch = async () => {
    if (!effectiveUserLocation) return alert("Waiting for GPS location...");
    if (selectedPlugs.length === 0) return alert("Please select at least one plug type.");
    
    setIsLoading(true);
    // Mocking API delay for UX
    setTimeout(() => {
      // TODO: Replace with actual backend fetch
      // Mock Data mimicking your AI Smart Match output
      const mockResults: RankedStation[] = stations.slice(0, 3).map((s, i) => ({
        ...s,
        currentDynamicPrice: 85 + (i * 10),
        demandStatus: i === 0 ? 'Optimal' : 'High Demand',
        routeData: { distanceKm: (2.5 + i).toFixed(1), driveTimeMins: 10 + (i * 4) }
      }));
      
      setResults(mockResults);
      setSelectedIndex(0);
      setViewState('results');
      setDirectionsResponse(null);
      setActiveIdleStation(null);
      if (mockResults[0]) {
        setViewportCenter({
          lat: mockResults[0].location.coordinates[1],
          lng: mockResults[0].location.coordinates[0],
        });
        setViewportZoom(14);
      }
      setIsLoading(false);
    }, 1500);
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  const smoothPanTo = (target: { lat: number; lng: number }, nextZoom?: number) => {
    if (mapRef.current) {
      mapRef.current.panTo(target);
      window.setTimeout(() => {
        setViewportCenter(target);
        if (typeof nextZoom === 'number') {
          mapRef.current?.setZoom(nextZoom);
          setViewportZoom(nextZoom);
        }
      }, 360);
      return;
    }

    setViewportCenter(target);
    if (typeof nextZoom === 'number') setViewportZoom(nextZoom);
  };

  const focusOnStation = (station: Station) => {
    const stationCenter = {
      lat: station.location.coordinates[1],
      lng: station.location.coordinates[0],
    };
    smoothPanTo(stationCenter);
  };

  if (!isLoaded) return <div className="h-full w-full bg-(--background) flex items-center justify-center font-semibold text-(--brand-blue)">Loading Map Engine...</div>;

  const handleRecenterToUser = () => {
    if (!effectiveUserLocation) return;
    setViewState('idle');
    setDirectionsResponse(null);
    setActiveIdleStation(null);
    smoothPanTo(effectiveUserLocation, 13);
  };

  const jumpToResult = (nextIndex: number) => {
    const next = results[nextIndex];
    if (!next) return;
    setSelectedIndex(nextIndex);
    smoothPanTo({
      lat: next.location.coordinates[1],
      lng: next.location.coordinates[0],
    }, 14);
  };

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapInstance(map);
  };

  const handleMapDragEnd = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    if (!center) return;
    setViewportCenter({ lat: center.lat(), lng: center.lng() });
  };

  const handleMapZoomChanged = () => {
    if (!mapRef.current) return;
    const nextZoom = mapRef.current.getZoom();
    if (typeof nextZoom === 'number') setViewportZoom(nextZoom);
  };

  return (
    <div className="relative w-full h-full font-sans">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={viewportCenter}
        zoom={viewportZoom}
        options={{
          disableDefaultUI: true,
          mapId: resolvedMapId,
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }]
        }}
        onLoad={handleMapLoad}
        onDragEnd={handleMapDragEnd}
        onZoomChanged={handleMapZoomChanged}
        onClick={() => setActiveIdleStation(null)} // Click map to close popups
      >
        {/* User Location */}
        {effectiveUserLocation && (
          <AdvancedMapMarker
            map={mapInstance}
            position={effectiveUserLocation}
            iconUrl="/icons/car.png"
            iconSize={60}
          />
        )}

        {/* Idle Mode: Show all stations */}
        {viewState === 'idle' && stations.map((station) => (
           <AdvancedMapMarker
             key={station._id}
             map={mapInstance}
             position={{ lat: station.location.coordinates[1], lng: station.location.coordinates[0] }}
             iconUrl="/icons/station.png"
             iconSize={32}
             onClick={() => {
               // If a parent supplied an onBookClick handler (dashboard), prefer that
               // so the central BookingDrawer shows the updated UI. Otherwise fall
               // back to the map's internal popup behavior.
               if (onBookClick) {
                 onBookClick(station);
                 // Ensure the map's internal popup doesn't remain visible
                 setActiveIdleStation(null);
                 focusOnStation(station);
               } else {
                 setActiveIdleStation(station);
                 focusOnStation(station);
               }
             }}
           />
        ))}

        {/* Results Mode: Target Route */}
        {viewState === 'results' && currentOption && (
          <AdvancedMapMarker
            map={mapInstance}
            position={{ lat: currentOption.location.coordinates[1], lng: currentOption.location.coordinates[0] }}
            iconUrl="/icons/station.png"
            iconSize={36}
          />
        )}

        {/* Drawing the Route */}
        {directionsResponse && viewState === 'results' && (
          <DirectionsRenderer directions={directionsResponse} options={{ suppressMarkers: true, polylineOptions: { strokeColor: 'var(--brand-blue)', strokeWeight: 5 } }} />
        )}
      </GoogleMap>

      {/* --- OVERLAYS & UI --- */}

      <AnimatePresence>
      {effectiveUserLocation && (
        <motion.button
          key="recenter-btn"
          initial={{ opacity: 0, y: 14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.94 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleRecenterToUser}
          title="Back to my location"
          className="absolute right-4 bottom-28 md:bottom-8 z-20 w-11 h-11 rounded-xl bg-(--brand-card)/85 backdrop-blur-xl border border-(--brand-border) text-(--brand-ink) shadow-[0_10px_24px_rgba(0,0,0,0.12)] hover:bg-(--brand-card) transition-all flex items-center justify-center"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m13.5 0a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
        </motion.button>
      )}
      </AnimatePresence>

      {/* 1. TOP BAR: Find Best Station (Idle State) */}
      <AnimatePresence mode="wait">
      {viewState === 'idle' && (
        <motion.div
          key="find-best-btn"
          {...fadeSlide}
          className="absolute top-6 md:top-10 left-1/2 -translate-x-1/2 z-10 w-[74%] max-w-xs"
        >
          <button 
            onClick={() => { setViewState('searching'); setActiveIdleStation(null); setDirectionsResponse(null); }}
            className="w-full py-3 bg-gradient-to-r from-(--brand-card)/95 to-(--background)/95 backdrop-blur-xl text-(--brand-ink) border border-(--brand-border) rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.14)] font-bold text-sm flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02]"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="var(--brand-blue)" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
            Find Best Value Station
          </button>
        </motion.div>
      )}
      </AnimatePresence>

      {/* 2. SEARCH MODAL: Smart Match Input */}
      <AnimatePresence mode="wait">
      {viewState === 'searching' && (
        <motion.div
          key="search-modal"
          {...fadeSlide}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[88%] max-w-md bg-gradient-to-br from-(--brand-card)/95 via-(--brand-card)/85 to-(--background)/80 backdrop-blur-3xl rounded-3xl shadow-2xl border border-(--brand-border) p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-(--brand-blue) to-(--brand-ink) bg-clip-text text-transparent">Smart Match Setup</h3>
            <button onClick={() => { setViewState('idle'); setDirectionsResponse(null); }} className="text-(--brand-muted) hover:text-(--ui-error) transition-colors">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="mb-5 h-px w-full bg-gradient-to-r from-transparent via-(--brand-border) to-transparent" />

          <div className="space-y-6">
            {/* Battery Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-(--brand-muted) uppercase tracking-wider">Current Battery</label>
                <span className="font-bold text-(--brand-blue)">{batteryLevel}%</span>
              </div>
              <input 
                type="range" min="1" max="100" value={batteryLevel} onChange={(e) => setBatteryLevel(Number(e.target.value))}
                className="w-full h-2 bg-(--brand-border) rounded-lg appearance-none cursor-pointer accent-(--brand-blue)"
              />
            </div>
            
            {/* Plug Type Grid */}
            <div>
              <label className="text-sm font-bold text-(--brand-muted) uppercase tracking-wider block mb-3">Compatible Plugs</label>
              <div className="grid grid-cols-3 gap-2">
                {PLUG_TYPES.map(plug => (
                  <button
                    key={plug}
                    onClick={() => togglePlug(plug)}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                      selectedPlugs.includes(plug) 
                        ? 'bg-(--brand-blue)/10 border-(--brand-blue) text-(--brand-blue)' 
                        : 'bg-(--background) border-(--brand-border) text-(--brand-muted) hover:border-(--brand-blue)/50'
                    }`}
                  >
                    {plug}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSearch} disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-(--brand-blue) to-(--accent-blue) text-(--brand-card) font-bold text-lg hover:opacity-95 transition-transform shadow-lg shadow-(--brand-blue)/25 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-(--brand-card) vh-loader-soft" />
                  Running AI Model...
                </span>
              ) : 'Find Top 3 Matches'}
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* 3. STATION POPUP: Full Centered Glassmorphic Booking Drawer */}
      <AnimatePresence mode="wait">
      {activeIdleStation && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 font-sans">
          
          {/* BACKGROUND DIMMER */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-(--brand-ink)/40 backdrop-blur-sm"
            onClick={() => setActiveIdleStation(null)}
          />

          {/* THE SMART MODAL */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl bg-(--brand-card)/95 backdrop-blur-3xl rounded-t-[2.5rem] md:rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-(--brand-border) flex flex-col max-h-[92dvh] md:max-h-[85dvh] overflow-hidden"
          >
            {/* Header / Drag Handle & Close Button */}
            <div className="flex justify-center md:justify-end items-center p-5 pb-2 shrink-0">
              {/* Mobile Handle */}
              <div className="w-12 h-1.5 bg-(--brand-border) rounded-full md:hidden absolute left-1/2 -translate-x-1/2 top-4" />
              
              {/* Close Button */}
              <button 
                onClick={() => setActiveIdleStation(null)}
                className="w-8 h-8 bg-(--background) hover:bg-(--brand-border) text-(--brand-muted) hover:text-(--ui-error) rounded-full flex items-center justify-center transition-colors z-10 ml-auto"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              
              {/* Station Identity */}
              <div className="mb-6">
                {((activeIdleStation as RankedStation).routeData || (activeIdleStation as RankedStation).currentDynamicPrice) && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-(--background) p-3 rounded-xl border border-(--brand-border)">
                      <p className="text-[10px] uppercase font-bold text-(--brand-muted) mb-1">Distance</p>
                      <p className="text-lg font-black text-(--brand-ink)">{(activeIdleStation as RankedStation).routeData?.distanceKm || 'N/A'} km</p>
                      <p className="text-xs font-bold text-(--brand-blue)">{(activeIdleStation as RankedStation).routeData?.driveTimeMins || '--'} min drive</p>
                    </div>
                    <div className="bg-(--background) p-3 rounded-xl border border-(--brand-border)">
                      <p className="text-[10px] uppercase font-bold text-(--brand-muted) mb-1">Matched Price</p>
                      <p className="text-lg font-black text-(--ui-success)">Rs. {(((activeIdleStation as RankedStation).currentDynamicPrice ?? activeIdleStation.pricePerKWh ?? 85)).toFixed(2)}</p>
                      <p className="text-xs font-bold text-(--brand-muted)">{(activeIdleStation as RankedStation).demandStatus || 'Live estimate'}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  {activeIdleStation.chargers && activeIdleStation.chargers.filter(c => c.status === 'Available').length > 0 ? (
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--ui-success)/10 text-(--ui-success) text-[11px] font-bold uppercase tracking-widest border border-(--ui-success)/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--ui-success) animate-pulse" />
                      {activeIdleStation.chargers.filter(c => c.status === 'Available').length} of {activeIdleStation.chargers.length} Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--ui-error)/10 text-(--ui-error) text-[11px] font-bold uppercase tracking-widest border border-(--ui-error)/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--ui-error)" />
                      Currently Full
                    </span>
                  )}
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-(--brand-ink) tracking-tight leading-tight mb-2">
                  {activeIdleStation.name || activeIdleStation.stationName || 'VoltHive Station'}
                </h2>
                
                <p className="text-(--brand-muted) text-[15px] flex items-start gap-2 leading-relaxed font-medium">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0 text-(--brand-muted) mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {activeIdleStation.address || 'Location provided on map'}
                </p>

                <p className="text-xs text-(--brand-muted) mt-2">
                  Charger Types:{' '}
                  <span className="font-semibold text-(--brand-ink)">
                    {activeIdleStation.chargers && activeIdleStation.chargers.length > 0
                      ? Array.from(new Set(activeIdleStation.chargers.map(c => c.plugType))).join(', ')
                      : 'N/A'}
                  </span>
                </p>

                {/* QUICK ACTIONS ROW */}
                <div className="flex items-center gap-3 mt-6">
                  <button 
                    onClick={() => openGoogleMaps(activeIdleStation.location.coordinates[1], activeIdleStation.location.coordinates[0])}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-(--brand-blue)/10 hover:bg-(--brand-blue)/20 text-(--brand-blue) rounded-xl text-[13px] font-bold transition-all border border-(--brand-blue)/20"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Directions
                  </button>

                  <a 
                    href="tel:0112345678" 
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-(--background) hover:bg-(--brand-border) text-(--brand-ink) rounded-xl text-[13px] font-bold transition-all border border-(--brand-border) shadow-sm"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-ink)">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.041l-3.286-.47a1.125 1.125 0 00-1.073.436l-2.276 3.034c-2.126-1.01-3.951-2.835-4.96-4.96l3.034-2.276a1.125 1.125 0 00.436-1.073l-.47-3.286c-.075-.512-.525-.864-1.041-.864H4.5a2.25 2.25 0 00-2.25 2.25z" />
                    </svg>
                    Contact
                  </a>
                </div>
              </div>

              {/* Premium Specs Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {/* Price - Full Width Hero Card */}
                <div className="col-span-2 bg-(--background) p-5 rounded-2xl border border-(--brand-border) shadow-sm flex items-end justify-between">
                  <div>
                    <p className="text-(--brand-muted) text-[11px] font-bold uppercase tracking-widest mb-1">Charging Rate</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl md:text-5xl font-black tracking-tighter text-(--brand-ink)">{((activeIdleStation as RankedStation).currentDynamicPrice ?? activeIdleStation.pricePerKWh ?? 85).toFixed(2)}</span>
                      <span className="text-sm font-bold text-(--brand-muted)">LKR / kWh</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-(--accent-blue)/15 flex items-center justify-center text-(--brand-blue)">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* Max Power Card */}
                <div className="bg-(--background) p-5 rounded-2xl border border-(--brand-border) shadow-sm">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-(--brand-muted) mb-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-0.5">Max Output</p>
                  <p className="text-2xl font-black text-(--brand-ink)">
                    {activeIdleStation.chargers && activeIdleStation.chargers.length > 0 
                      ? Math.max(...activeIdleStation.chargers.map(c => c.powerKW)) 
                      : 0} 
                    <span className="text-sm font-bold text-(--brand-muted)">kW</span>
                  </p>
                </div>

                {/* Connectors Card */}
                <div className="bg-(--background) p-5 rounded-2xl border border-(--brand-border) shadow-sm">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-(--brand-muted) mb-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                  <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-2">Connectors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeIdleStation.chargers && activeIdleStation.chargers.length > 0 ? 
                      Array.from(new Set(activeIdleStation.chargers.map(c => c.plugType))).map(plug => (
                      <span key={plug} className="px-2 py-1 bg-(--brand-card) text-(--brand-ink) text-xs font-bold rounded-lg border border-(--brand-border)">
                        {plug}
                      </span>
                    )) : <span className="text-xs text-(--brand-muted)">N/A</span>}
                  </div>
                </div>
              </div>

              {/* Hardware Network (Minimalist List) */}
              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest mb-3 ml-1">Hardware Status</h3>
                <div className="bg-(--background) rounded-2xl border border-(--brand-border) shadow-sm overflow-hidden">
                  {activeIdleStation.chargers && activeIdleStation.chargers.length > 0 ? activeIdleStation.chargers.map((charger, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 ${idx !== activeIdleStation.chargers!.length - 1 ? 'border-b border-(--brand-border)' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-bold text-(--brand-muted) w-6">
                          0{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-(--brand-ink) text-[15px]">{charger.plugType}</p>
                          <p className="text-xs font-semibold text-(--brand-muted)">{charger.powerKW} kW Fast Charge</p>
                        </div>
                      </div>
                      {charger.status === 'Available' ? (
                         <span className="text-(--ui-success) font-bold text-sm bg-(--ui-success)/10 px-2.5 py-1 rounded-md">
                           Available
                         </span>
                      ) : (
                        <span className="text-(--ui-error) font-bold text-sm bg-(--ui-error)/10 px-2.5 py-1 rounded-md">
                          Occupied
                        </span>
                      )}
                    </div>
                  )) : (
                    <div className="p-4 text-sm text-(--brand-muted) font-medium">No hardware details available for this station.</div>
                  )}
                </div>
              </div>

            </div>

            {/* FIXED BOTTOM ACTION BAR */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 bg-gradient-to-t from-(--brand-card) via-(--brand-card)/95 to-transparent rounded-b-[2rem]">
              <button 
                onClick={() => onBookClick && onBookClick(activeIdleStation)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-(--brand-blue) to-(--accent-blue) text-(--brand-card) font-bold text-[16px] hover:opacity-95 transition-transform active:scale-[0.98] shadow-lg shadow-(--brand-blue)/30 flex justify-center items-center gap-2"
              >
                Reserve Slot
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>

          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* 4. RESULTS CAROUSEL: Smart Match Top 3 */}
      <AnimatePresence mode="wait">
      {viewState === 'results' && currentOption && (
        <motion.div
          key={`results-${currentOption._id}-${selectedIndex}`}
          {...fadeSlide}
          className="absolute bottom-28 md:bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md bg-(--brand-card) rounded-3xl shadow-2xl border border-(--brand-border) overflow-hidden"
        >
          
          <div className="bg-(--background) px-4 py-3 flex justify-between items-center border-b border-(--brand-border)">
            <button onClick={() => jumpToResult(Math.max(0, selectedIndex - 1))} disabled={selectedIndex === 0} className={`text-sm font-bold ${selectedIndex === 0 ? 'text-(--brand-border)' : 'text-(--brand-blue) hover:underline'}`}>← Prev</button>
            <span className="text-xs font-black text-(--brand-muted) uppercase tracking-widest bg-(--brand-border)/50 px-3 py-1 rounded-full">Match {selectedIndex + 1} of 3</span>
            <button onClick={() => jumpToResult(Math.min(results.length - 1, selectedIndex + 1))} disabled={selectedIndex === results.length - 1} className={`text-sm font-bold ${selectedIndex === results.length - 1 ? 'text-(--brand-border)' : 'text-(--brand-blue) hover:underline'}`}>Next →</button>
          </div>

          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-(--brand-ink)">{currentOption.name || currentOption.stationName || 'VoltHive Station'}</h3>
                <p className="text-sm font-medium text-(--brand-muted) mt-0.5">Predictive AI Selected</p>
              </div>
              <button onClick={() => { setViewState('idle'); setDirectionsResponse(null); }} className="text-(--brand-muted) hover:text-(--ui-error) bg-(--background) p-1.5 rounded-full">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-(--background) p-3 rounded-xl border border-(--brand-border)">
                <p className="text-[10px] uppercase font-bold text-(--brand-muted) mb-1">Route & Time</p>
                <p className="text-lg font-black text-(--brand-ink)">{currentOption.routeData.driveTimeMins} min</p>
                <p className="text-xs font-bold text-(--brand-blue)">{currentOption.routeData.distanceKm} km away</p>
              </div>
              <div className="bg-(--background) p-3 rounded-xl border border-(--brand-border)">
                 <p className="text-[10px] uppercase font-bold text-(--brand-muted) mb-1">Dynamic Rate</p>
                 <p className="text-lg font-black text-(--ui-success)">Rs. {currentOption.currentDynamicPrice.toFixed(2)}</p>
                 <p className={`text-xs font-bold ${currentOption.demandStatus === 'Optimal' ? 'text-(--brand-green)' : 'text-(--ui-warning)'}`}>{currentOption.demandStatus}</p>
              </div>
            </div>

            <button
               onClick={() => setActiveIdleStation(currentOption)}
               className="w-full py-3 mb-3 bg-(--background) text-(--brand-ink) rounded-xl border border-(--brand-border) font-bold transition-shadow"
            >
              View Details
            </button>

            <button 
               onClick={() => onBookClick && onBookClick(currentOption)}
               className="w-full py-4 bg-(--brand-blue) text-(--brand-card) rounded-xl font-bold shadow-lg shadow-(--brand-blue)/20 hover:bg-(--brand-blue-deep) transition-colors"
            >
              Secure This Booking
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}