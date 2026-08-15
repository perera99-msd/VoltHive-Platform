'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';
import { AnimatePresence, motion } from 'framer-motion';
import { apiUrl } from '../lib/api';
import { auth } from '../lib/firebase';
import Toast from './common/Toast';

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo

// --- TYPES ---
interface Charger {
  _id: string;
  plugType: string;
  powerKW: number;
  status: string;
}

export interface Station {
  _id: string;
  name?: string;
  stationName?: string;
  address?: string;
  phone?: string;
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
  onMessageClick?: (stationId: string) => void;
  isGuest?: boolean;
}

// Canonical charger/connector standards. KEEP IN SYNC with AddChargerModal, EditChargerModal, MyGarage, seedStations.js
const PLUG_TYPES = ['CCS2', 'CHAdeMO', 'CCS1', 'Type 2', 'Type 1', 'GB/T', 'Tesla NACS'];

// Straight-line (Haversine) distance in km — used for the 10 km radius filter.
const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la = (a.lat * Math.PI) / 180;
  const lb = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Read-only status badge for a charger (station popup).
const chargerStatusInfo = (status: string) => {
  const s = String(status || '').toUpperCase();
  if (s === 'AVAILABLE') return { label: 'Ready', cls: 'text-(--ui-success) bg-(--ui-success)/15 border-(--ui-success)/30' };
  if (s === 'PENDING_APPROVAL' || s === 'RESERVED') return { label: 'Booked', cls: 'text-amber-600 bg-amber-500/15 border-amber-500/30' };
  if (s === 'CHARGING') return { label: 'Charging', cls: 'text-(--brand-blue) bg-(--brand-blue)/15 border-(--brand-blue)/30' };
  if (s === 'OFFLINE') return { label: 'Offline', cls: 'text-(--ui-error) bg-(--ui-error)/10 border-(--ui-error)/20' };
  return { label: status || 'Unknown', cls: 'text-(--brand-muted) bg-(--surface-soft) border-(--brand-border)' };
};

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
  const markerRef = useRef<google.maps.Marker | google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let clickListener: google.maps.MapsEventListener | null = null;

    const setupMarker = async () => {
      if (!map || !window.google) return;

      // Advanced Markers REQUIRE a Map ID. Without one, fall back to the
      // classic google.maps.Marker so the map works out of the box.
      const hasMapId = !!process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

      if (hasMapId) {
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

        if (onClick) clickListener = marker.addListener('click', onClick);
        markerRef.current = marker;
      } else {
        const marker = new window.google.maps.Marker({
          map,
          position,
          icon: {
            url: iconUrl,
            scaledSize: new window.google.maps.Size(iconSize, iconSize),
            anchor: new window.google.maps.Point(iconSize / 2, iconSize / 2),
          },
        });

        if (onClick) clickListener = marker.addListener('click', onClick);
        markerRef.current = marker;
      }
    };

    setupMarker();

    return () => {
      isMounted = false;
      if (clickListener) clickListener.remove();
      if (markerRef.current) {
        if (typeof (markerRef.current as any).setMap === 'function') {
          (markerRef.current as any).setMap(null);
        } else {
          (markerRef.current as any).map = null;
        }
        markerRef.current = null;
      }
    };
  }, [map, position, iconUrl, iconSize, onClick]);

  return null;
}

export default function StationMap({ userLocation, stations = [], onBookClick, onMessageClick, isGuest = false }: StationMapProps) {
  const [detectedUserLocation, setDetectedUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const hasAutoCenteredUser = useRef(false);

  const effectiveUserLocation = userLocation ?? detectedUserLocation;

  const [viewportCenter, setViewportCenter] = useState<{ lat: number; lng: number }>(defaultCenter);
  const [viewportZoom, setViewportZoom] = useState<number>(13);

  useEffect(() => {
    if (userLocation) return;
    if (!('geolocation' in navigator)) {
      // Defer state update to avoid synchronous setState in effect
      const timer = setTimeout(() => setShowLocationWarning(true), 0);
      return () => clearTimeout(timer);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setDetectedUserLocation(nextLocation);
        setShowLocationWarning(false);

        if (!hasAutoCenteredUser.current) {
          setViewportCenter(nextLocation);
          setViewportZoom(13);
          hasAutoCenteredUser.current = true;
        }
      },
      (error) => {
        console.warn('Location error:', error);
        setShowLocationWarning(true);
      },
      { enableHighAccuracy: true }
    );
  }, [userLocation]);

  // --- UI STATES ---
  const [viewState, setViewState] = useState<'idle' | 'searching' | 'results'>('idle');
  const [activeIdleStation, setActiveIdleStation] = useState<Station | null>(null);

  // --- SEARCH FORM STATES ---
  const [batteryLevel, setBatteryLevel] = useState<number>(50);
  const [selectedPlugs, setSelectedPlugs] = useState<string[]>(['CCS2']);
  const plugsTouched = useRef(false); // once the driver customizes plugs, respect their choice
  const [isLoading, setIsLoading] = useState(false);

  // --- RESULTS STATES ---
  const [results, setResults] = useState<RankedStation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' | 'info' } | null>(null);
  const currentOption = results[selectedIndex];

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const resolvedMapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

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

  const togglePlug = (plug: string) => {
    plugsTouched.current = true;
    setSelectedPlugs(prev =>
      prev.includes(plug) ? prev.filter(p => p !== plug) : [...prev, plug]
    );
  };

  // When the driver opens Smart Match, auto-select their PRIMARY car's
  // connector (from the garage). If there is no car / connector, the default
  // stays. Manual plug selections are always respected (not overridden).
  useEffect(() => {
    if (isGuest || viewState !== 'searching' || plugsTouched.current) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch(apiUrl('/api/users/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const profile = await res.json();
        const vehicles = Array.isArray(profile.vehicles) ? profile.vehicles : [];
        const primary = vehicles.find((v: any) => v.isPrimary) || vehicles[0];
        const connector = String(primary?.connector || '');
        if (connector && PLUG_TYPES.includes(connector) && !cancelled) {
          setSelectedPlugs([connector]);
        }
      } catch (e) {
        console.warn('Could not load primary car connector:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [viewState, isGuest]);

  const handleSearch = async () => {
    if (!effectiveUserLocation) {
      setToastMessage({ msg: "Waiting for GPS location...", type: 'info' });
      return;
    }
    if (selectedPlugs.length === 0) {
      setToastMessage({ msg: "Please select at least one plug type.", type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(apiUrl('/api/stations/smart-match'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userLat: effectiveUserLocation.lat,
          userLng: effectiveUserLocation.lng,
          plugTypes: selectedPlugs.length ? selectedPlugs : ['CCS2'],
          currentBatteryLevel: batteryLevel
        })
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setResults(data.data);
        setSelectedIndex(0);
        setViewState('results');
        setDirectionsResponse(null);
        setActiveIdleStation(null);
        if (data.data[0]) {
          setViewportCenter({
            lat: data.data[0].location.coordinates[1],
            lng: data.data[0].location.coordinates[0],
          });
          setViewportZoom(14);
        }
      } else {
        setToastMessage({ msg: "No compatible chargers found within 10 km radius.", type: 'info' });
      }
    } catch (err) {
      console.error("Error fetching smart-match stations:", err);
      setToastMessage({ msg: "Failed to connect to smart match service.", type: 'error' });
    } finally {
      setIsLoading(false);
    }
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
          ...(resolvedMapId ? { mapId: resolvedMapId } : {})
        }}
        onLoad={handleMapLoad}
        onDragEnd={handleMapDragEnd}
        onZoomChanged={handleMapZoomChanged}
        onClick={() => setActiveIdleStation(null)}
      >
        {effectiveUserLocation && (
          <AdvancedMapMarker
            map={mapInstance}
            position={effectiveUserLocation}
            iconUrl="/icons/car.png"
            iconSize={60}
          />
        )}

        {viewState === 'idle' && stations
          .filter(station => Array.isArray(station?.location?.coordinates) && station.location.coordinates.length >= 2)
          .map((station) => (
            <AdvancedMapMarker
              key={station._id}
              map={mapInstance}
              position={{ lat: Number(station.location.coordinates[1]), lng: Number(station.location.coordinates[0]) }}
              iconUrl="/icons/station.png"
              iconSize={32}
              onClick={() => {
                if (onBookClick) {
                  onBookClick(station);
                  setActiveIdleStation(null);
                  focusOnStation(station);
                } else {
                  setActiveIdleStation(station);
                  focusOnStation(station);
                }
              }}
            />
          ))}

        {viewState === 'results' && currentOption && (
          <AdvancedMapMarker
            map={mapInstance}
            position={{ lat: currentOption.location.coordinates[1], lng: currentOption.location.coordinates[0] }}
            iconUrl="/icons/station.png"
            iconSize={36}
          />
        )}

        {directionsResponse && viewState === 'results' && (
          <DirectionsRenderer directions={directionsResponse} options={{ suppressMarkers: true, polylineOptions: { strokeColor: 'var(--brand-blue)', strokeWeight: 5 } }} />
        )}
      </GoogleMap>

      {(!effectiveUserLocation && showLocationWarning) && (
        <div className="fixed bottom-32 left-4 right-4 md:bottom-8 md:right-8 md:left-auto z-[100] bg-(--brand-card) border border-(--brand-border) shadow-xl p-3 rounded-2xl flex items-start gap-3 max-w-sm md:max-w-sm mx-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="text-(--accent-blue) shrink-0 mt-0.5">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-(--brand-ink)">Location Services Disabled</p>
            <p className="text-[13px] text-(--brand-muted) mt-1 leading-relaxed">Enable device location to center the map and see nearby stations.</p>
          </div>
          <button
            onClick={() => setShowLocationWarning(false)}
            className="text-(--brand-muted) hover:text-(--brand-ink) bg-background hover:bg-(--brand-border) rounded-full p-1 transition-colors self-start -mt-1 -mr-1"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <AnimatePresence>
        {effectiveUserLocation && (
          <motion.button
            key="recenter-btn"
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.94 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            onClick={handleRecenterToUser}
            className="absolute right-4 bottom-28 md:bottom-8 z-20 w-11 h-11 rounded-xl bg-(--brand-card)/85 backdrop-blur-xl border border-(--brand-border) text-(--brand-ink) shadow-[0_10px_24px_rgba(0,0,0,0.12)] hover:bg-(--brand-card) transition-all flex items-center justify-center"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m13.5 0a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {viewState === 'idle' && (
          <motion.div
            key="find-best-btn"
            {...fadeSlide}
            className="absolute top-24 sm:top-28 md:top-32 left-1/2 -translate-x-1/2 z-10 w-[85%] max-w-sm"
          >
            <button
              onClick={() => {
                if (isGuest) return;
                setViewState('searching'); setActiveIdleStation(null); setDirectionsResponse(null);
              }}
              disabled={isGuest}
              className={`w-full py-3 bg-gradient-to-r from-(--brand-card)/95 to-(--background)/95 backdrop-blur-xl text-(--brand-ink) border border-(--brand-border) rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.14)] font-bold flex flex-col items-center justify-center transition-all ${isGuest ? 'opacity-90 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            >
              <div className="flex items-center gap-2.5 text-sm">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="var(--brand-blue)" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                Find Best Value Station
                {isGuest && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-(--brand-blue)/10 text-(--brand-blue) uppercase tracking-wider">Locked</span>
                )}
              </div>
              {isGuest && (
                <span className="text-[10px] font-medium text-(--brand-muted) mt-0.5">Sign in to unlock AI Smart Match</span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

              <div>
                <label className="text-sm font-bold text-(--brand-muted) uppercase tracking-wider block mb-3">Compatible Plugs</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLUG_TYPES.map(plug => (
                    <button
                      key={plug}
                      onClick={() => togglePlug(plug)}
                      className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${selectedPlugs.includes(plug)
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

      <AnimatePresence mode="wait">
        {activeIdleStation && (
          <div className="fixed inset-x-0 bottom-[calc(8rem+env(safe-area-inset-bottom))] md:inset-0 z-50 flex items-end md:items-center justify-center p-3 md:p-6 font-sans pointer-events-none">

            {/* Transparent click outside overlay on map */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 pointer-events-auto cursor-pointer"
              onClick={() => setActiveIdleStation(null)}
            />

            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative pointer-events-auto w-full max-w-[420px] bg-(--brand-card)/95 backdrop-blur-3xl rounded-3xl shadow-[0_24px_60px_-15px_rgba(9,32,52,0.5)] border border-(--brand-border) flex flex-col max-h-[68dvh] md:max-h-[82dvh] overflow-hidden text-(--brand-ink)"
            >
              <div className="flex justify-between items-center p-4 pb-2 shrink-0 border-b border-(--brand-border)/30 z-10">
                <div className="w-10 h-1 bg-(--brand-muted)/30 rounded-full md:hidden absolute left-1/2 -translate-x-1/2 top-2.5" />
                
                <div className="flex items-center gap-2">
                  {activeIdleStation.chargers && activeIdleStation.chargers.filter(c => c.status === 'AVAILABLE' || c.status === 'Available').length > 0 ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-(--ui-success)/15 text-(--ui-success) text-[10px] font-extrabold uppercase tracking-widest border border-(--ui-success)/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--ui-success) animate-pulse" />
                      {activeIdleStation.chargers.filter(c => c.status === 'AVAILABLE' || c.status === 'Available').length} of {activeIdleStation.chargers.length} Ready
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-(--ui-error)/15 text-(--ui-error) text-[10px] font-extrabold uppercase tracking-widest border border-(--ui-error)/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--ui-error)" />
                      Station Full
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setActiveIdleStation(null)}
                  className="w-8 h-8 bg-(--surface-soft) hover:bg-(--surface-tint) text-(--brand-muted) hover:text-(--ui-error) rounded-full flex items-center justify-center transition-all border border-(--brand-border) cursor-pointer ml-auto"
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pt-3 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                <div className="mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-(--brand-ink) tracking-tight leading-tight mb-1.5">
                    {activeIdleStation.name || activeIdleStation.stationName || 'VoltHive Station'}
                  </h2>

                  <p className="text-(--brand-muted) text-xs flex items-start gap-1.5 leading-relaxed font-medium">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0 text-(--brand-blue) opacity-80 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {activeIdleStation.address || 'Location provided on map'}
                  </p>

                  {((activeIdleStation as RankedStation).routeData || (activeIdleStation as RankedStation).currentDynamicPrice) && (
                    <div className="flex items-center gap-2.5 mt-2.5 text-[11px] font-bold">
                      {(activeIdleStation as RankedStation).routeData?.distanceKm && (
                        <span className="text-(--brand-blue) bg-(--brand-blue)/10 px-2 py-0.5 rounded-lg border border-(--brand-blue)/20">
                          {(activeIdleStation as RankedStation).routeData.distanceKm} km away
                        </span>
                      )}
                      {(activeIdleStation as RankedStation).routeData?.driveTimeMins && (
                        <span className="text-(--brand-muted) bg-(--surface-soft) px-2 py-0.5 rounded-lg border border-(--brand-border)">
                          ~{(activeIdleStation as RankedStation).routeData.driveTimeMins} min drive
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => openGoogleMaps(activeIdleStation.location.coordinates[1], activeIdleStation.location.coordinates[0])}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-(--brand-blue)/12 hover:bg-(--brand-blue)/20 text-(--brand-blue) rounded-xl text-xs font-bold border border-(--brand-blue)/25 transition-all cursor-pointer"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      Directions
                    </button>

                    <button
                      onClick={() => {
                        if (onMessageClick) {
                          onMessageClick(activeIdleStation._id);
                          setActiveIdleStation(null);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-(--brand-green)/12 hover:bg-(--brand-green)/20 text-(--brand-green-deep) rounded-xl text-xs font-bold border border-(--brand-green)/25 transition-all cursor-pointer"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Message
                    </button>

                    <a
                      href={activeIdleStation.phone ? `tel:${activeIdleStation.phone}` : '#'}
                      onClick={activeIdleStation.phone ? undefined : (e) => e.preventDefault()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-(--surface-soft) hover:bg-(--surface-tint) text-(--brand-ink) rounded-xl text-xs font-bold border border-(--brand-border) transition-all"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-70">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.041l-3.286-.47a1.125 1.125 0 00-1.073.436l-2.276 3.034c-2.126-1.01-3.951-2.835-4.96-4.96l3.034-2.276a1.125 1.125 0 00.436-1.073l-.47-3.286c-.075-.512-.525-.864-1.041-.864H4.5a2.25 2.25 0 00-2.25 2.25z" />
                      </svg>
                      {activeIdleStation.phone ? 'Call' : 'No Contact'}
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="col-span-2 bg-(--brand-card) p-3.5 rounded-xl border border-(--brand-border) flex items-center justify-between">
                    <div>
                      <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-0.5">Average Rate</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black tracking-tighter text-(--brand-ink)">{((activeIdleStation.pricePerKWh ?? (activeIdleStation as RankedStation).currentDynamicPrice ?? 0)).toFixed(2)}</span>
                        <span className="text-xs font-bold text-(--brand-muted)">LKR / kWh</span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-(--accent-blue)/14 flex items-center justify-center text-(--brand-blue)">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-widest mb-2 ml-1">Hardware Status</h3>
                  <div className="bg-(--surface-soft) rounded-xl border border-(--brand-border) overflow-hidden">
                    {activeIdleStation.chargers && activeIdleStation.chargers.length > 0 ? activeIdleStation.chargers.map((charger, idx) => {
                      const cRate = ((charger as unknown) as Record<string, unknown>).currentRate as number ?? ((charger as unknown) as Record<string, unknown>).pricePerKWh as number ?? ((charger as unknown) as Record<string, unknown>).rate as number ?? Math.round(((activeIdleStation as RankedStation).currentDynamicPrice ?? activeIdleStation.pricePerKWh ?? 85));
                      return (
                        <div key={idx} className={`flex items-center justify-between p-3 ${idx !== activeIdleStation.chargers!.length - 1 ? 'border-b border-(--brand-border)/40' : ''}`}>
                          <div className="flex items-center gap-2.5">
                            <div className="text-xs font-bold text-(--brand-muted) w-5">
                              0{idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-(--brand-ink)">
                                {charger.plugType} • <span className="text-(--brand-green-deep)">{charger.powerKW} kW</span> • <span className="text-(--brand-blue)">LKR {cRate}/kWh</span>
                              </p>
                            </div>
                          </div>
                          <span className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded-lg border ${chargerStatusInfo(charger.status).cls}`}>
                            {chargerStatusInfo(charger.status).label}
                          </span>
                        </div>
                      );
                    }) : (
                      <div className="p-3 text-xs text-(--brand-muted) font-medium">No hardware details available for this station.</div>
                    )}
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {viewState === 'results' && currentOption && (
          <motion.div
            key={`results-${currentOption._id}-${selectedIndex}`}
            {...fadeSlide}
            className="absolute bottom-[calc(8rem+env(safe-area-inset-bottom))] sm:bottom-[calc(7rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md bg-(--brand-card)/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-(--brand-border) overflow-hidden"
          >

            <div className="bg-(--background) px-4 py-3 flex justify-between items-center border-b border-(--brand-border)">
              <button onClick={() => jumpToResult(Math.max(0, selectedIndex - 1))} disabled={selectedIndex === 0} className={`text-sm font-bold ${selectedIndex === 0 ? 'text-(--brand-border)' : 'text-(--brand-blue) hover:underline'}`}>← Prev</button>
              <span className="text-xs font-black text-(--brand-muted) uppercase tracking-widest bg-(--brand-border)/50 px-3 py-1 rounded-full">Match {selectedIndex + 1} of {results.length}</span>
              <button onClick={() => jumpToResult(Math.min(results.length - 1, selectedIndex + 1))} disabled={selectedIndex === results.length - 1} className={`text-sm font-bold ${selectedIndex === results.length - 1 ? 'text-(--brand-border)' : 'text-(--brand-blue) hover:underline'}`}>Next →</button>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-(--brand-ink)">{currentOption.name || currentOption.stationName || 'VoltHive Station'}</h3>
                  <p className="text-sm font-medium text-(--brand-muted) mt-0.5">Predictive AI Selected</p>
                </div>
                <button onClick={() => { setViewState('idle'); setDirectionsResponse(null); }} className="text-(--brand-muted) hover:text-(--ui-error) bg-(--background) p-1.5 rounded-full cursor-pointer">
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
                  <p className="text-lg font-black text-(--ui-success)">Rs. {(currentOption.currentDynamicPrice ?? 0).toFixed(2)}</p>
                  <p className={`text-xs font-bold ${/low|discount/i.test(currentOption.demandStatus) ? 'text-(--brand-green)' : /high|surge/i.test(currentOption.demandStatus) ? 'text-(--ui-error)' : 'text-(--ui-warning)'}`}>{currentOption.demandStatus}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveIdleStation(currentOption)}
                className="w-full py-3 mb-3 bg-(--background) text-(--brand-ink) rounded-xl border border-(--brand-border) font-bold transition-all hover:bg-(--surface-soft) cursor-pointer"
              >
                View Details
              </button>

              <button
                onClick={() => onBookClick && onBookClick(currentOption)}
                className="w-full py-3.5 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white rounded-xl font-bold shadow-lg hover:brightness-105 transition-all cursor-pointer"
              >
                Secure This Booking
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}