'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

type Station = {
  _id: string;
  stationName: string;
  ownerName?: string;
  address: string;
  chargers?: unknown[];
};

export default function StationsView() {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<'list' | 'create'>('list');

  // Map Picker State
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 6.9271, lng: 79.8612 });

  // Station Form
  const [sName, setSName] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sLat, setSLat] = useState('');
  const [sLng, setSLng] = useState('');
  const [sDescription, setSDescription] = useState('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(apiUrl('/api/stations/owner'), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setStations(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await user?.getIdToken();
      const payload = {
        stationName: sName,
        address: sAddress,
        phone: sPhone,
        description: sDescription,
        ownerName: user?.displayName || 'VoltHive Partner',
        location: { type: 'Point', coordinates: [Number(sLng), Number(sLat)] }
      };

      const res = await fetch(apiUrl('/api/stations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchStations();
        setViewState('list');
        setSName(''); setSAddress(''); setSPhone(''); setSLat(''); setSLng(''); setSDescription('');
      } else {
        alert("Failed to create station.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setSLat(e.latLng.lat().toFixed(6));
      setSLng(e.latLng.lng().toFixed(6));
    }
  };

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setShowMapPicker(true);
      });
    } else {
      setShowMapPicker(true);
    }
  };

  const inputCls = "w-full px-4 py-3.5 bg-background border border-(--brand-border) rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/20 focus:border-(--brand-blue) text-(--brand-ink)";

  if (loading) return <div className="p-10 font-bold text-(--brand-blue)">Loading Network Data...</div>;

  return (
    <div className="max-w-6xl mx-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-(--brand-ink) mb-1">My Stations</h1>
          <p className="text-(--brand-muted) text-[15px] font-medium">Establish and manage your physical site locations.</p>
        </div>
        {viewState === 'list' && (
          <button onClick={() => setViewState('create')} className="flex items-center gap-2 bg-gradient-to-r from-(--brand-blue) to-(--brand-green) text-white px-6 py-3.5 rounded-xl text-[15px] font-bold shadow-lg shadow-(--brand-blue)/25 hover:brightness-105 active:scale-95 transition-all">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add New Station
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewState === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.length === 0 ? (
              <div className="col-span-full py-20 bg-(--brand-card)/50 border border-dashed border-(--brand-border) rounded-3xl text-center">
                <div className="w-16 h-16 bg-(--surface-soft) rounded-full flex items-center justify-center mx-auto mb-4 text-(--brand-blue)">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-(--brand-ink)">No Locations Deployed</h3>
                <p className="text-sm text-(--brand-muted) mt-1 max-w-sm mx-auto">Establish a physical premise before installing hardware chargers.</p>
              </div>
            ) : (
              stations.map(station => (
                <div key={station._id} className="bg-(--brand-card) border border-(--brand-border) rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-(--brand-blue)/20 to-(--brand-green)/10 flex items-center justify-center text-(--brand-blue) mb-5">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-(--brand-ink) mb-1 truncate">{station.stationName}</h3>
                  <p className="text-xs font-semibold text-(--brand-muted) uppercase tracking-wider mb-3">Owner: {station.ownerName || user?.displayName}</p>
                  <p className="text-sm text-(--brand-muted) mb-4 line-clamp-2">{station.address}</p>
                  <div className="mt-auto pt-4 border-t border-(--brand-border)/60 flex justify-between items-center text-[12px] font-bold text-(--brand-muted)">
                    <span>{station.chargers?.length || 0} Hardware Units Linked</span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {viewState === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl bg-(--brand-card) rounded-[2rem] p-8 border border-(--brand-border) shadow-[0_20px_60px_-15px_rgba(9,32,52,0.1)] relative">
            <button onClick={() => setViewState('list')} className="absolute top-8 right-8 text-(--brand-muted) hover:text-(--brand-ink)"><svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <h2 className="text-2xl font-bold text-(--brand-ink) mb-6">Create New Premise</h2>
            
            <form onSubmit={handleCreateStation} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider">Station Name</label>
                  <input required type="text" placeholder="e.g. VoltHive City Center Parking" value={sName} onChange={e => setSName(e.target.value)} className={inputCls} />
                </div>
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider">Physical Address</label>
                  <input required type="text" placeholder="Full street address" value={sAddress} onChange={e => setSAddress(e.target.value)} className={inputCls} />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider">Map Coordinates</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input required type="text" placeholder="Latitude" value={sLat} onChange={e => setSLat(e.target.value)} className={`${inputCls} flex-1`} />
                    <input required type="text" placeholder="Longitude" value={sLng} onChange={e => setSLng(e.target.value)} className={`${inputCls} flex-1`} />
                    <button type="button" onClick={handleLocationRequest} className="px-6 py-3.5 bg-(--surface-soft) text-(--brand-blue) rounded-xl border border-(--brand-border) font-bold hover:bg-(--brand-blue)/10 transition-colors shrink-0 flex justify-center items-center gap-2">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Pin on Map
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider">Contact Phone</label>
                  <input type="text" required placeholder="+94 7X XXX XXXX" value={sPhone} onChange={e => setSPhone(e.target.value)} className={inputCls} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider">Owner / Operating Company</label>
                  <input type="text" disabled value={user?.displayName || 'Auto-Detected'} className={`${inputCls} bg-(--background) opacity-70 cursor-not-allowed`} />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider">Short Description (Optional)</label>
                  <textarea rows={3} placeholder="e.g. Basement level 2, next to the elevators." value={sDescription} onChange={e => setSDescription(e.target.value)} className={inputCls} />
                </div>
              </div>

              <button type="submit" className="w-full py-4 mt-4 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white rounded-xl font-bold shadow-lg shadow-(--brand-blue)/30 hover:brightness-105 active:scale-[0.98] transition-all">
                Finalize & Create Station
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAP MODAL OVERLAY */}
      <AnimatePresence>
        {showMapPicker && isLoaded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-(--brand-ink)/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-(--brand-card) rounded-[2rem] overflow-hidden w-full max-w-4xl h-[70vh] shadow-2xl flex flex-col border border-(--brand-border)">
              <div className="px-6 py-4 border-b border-(--brand-border) flex justify-between items-center bg-(--background)">
                <div>
                  <h3 className="font-bold text-(--brand-ink) text-lg">Pin Location</h3>
                  <p className="text-xs font-medium text-(--brand-muted)">Click anywhere on the map to grab exact coordinates.</p>
                </div>
              </div>
              <div className="flex-1 relative bg-slate-100">
                <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={mapCenter} zoom={14} onClick={handleMapClick} options={{ disableDefaultUI: true }}>
                  {sLat && sLng && <Marker position={{ lat: Number(sLat), lng: Number(sLng) }} />}
                </GoogleMap>
              </div>
              <div className="p-4 bg-(--background) border-t border-(--brand-border) flex justify-between items-center">
                <div className="text-sm font-bold text-(--brand-blue)">{sLat && sLng ? `Selected: ${sLat}, ${sLng}` : 'Click map...'}</div>
                <button onClick={() => setShowMapPicker(false)} className="px-6 py-3 bg-(--brand-ink) text-white rounded-xl font-bold hover:bg-(--brand-blue-deep) transition-colors">Confirm Pin</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}