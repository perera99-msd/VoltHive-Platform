'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import EditStationModal from '../EditStationModal';
import ConfirmModal from '../../common/ConfirmModal';
import Toast from '../../common/Toast';

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
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [deletingStationId, setDeletingStationId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' } | null>(null);

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
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;
      const res = await fetch(apiUrl('/api/stations/owner'), {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  const executeDeleteStation = async (stationId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(apiUrl(`/api/stations/${stationId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletingStationId(null);
      if (res.ok) {
        setToastMessage({ msg: 'Station premise and linked hardware permanently removed.', type: 'success' });
        fetchStations();
      } else {
        setToastMessage({ msg: 'Failed to delete station premise.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setDeletingStationId(null);
      setToastMessage({ msg: 'Network failure communicating with server.', type: 'error' });
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
        setToastMessage({ msg: 'Station premise deployed successfully!', type: 'success' });
      } else {
        setToastMessage({ msg: 'Failed to create station premise.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToastMessage({ msg: 'Network failure deploying station.', type: 'error' });
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

  const inputCls = "w-full px-4 py-3 bg-white border border-(--brand-border)/80 rounded-xl text-[13px] font-medium text-(--brand-ink) placeholder:text-(--brand-muted)/50 focus:outline-none focus:border-(--brand-blue) transition-colors shadow-sm";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--brand-blue)"></div>
      </div>
    );
  }

  return (
    <div className="w-full relative font-sans pb-16">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[24px] font-extrabold tracking-tight text-(--brand-ink)">My Stations</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--brand-blue)/10 text-(--brand-blue) text-[9px] font-extrabold uppercase tracking-[0.12em] border border-(--brand-blue)/20">
              {stations.length} Locations
            </span>
          </div>
          <p className="text-[12px] text-(--brand-muted) font-medium">Establish and manage your physical site locations across the network.</p>
        </div>

        {viewState === 'list' && (
          <button
            onClick={() => setViewState('create')}
            className="flex items-center gap-2 bg-(--brand-blue) text-white px-5 py-2.5 rounded-xl text-[12px] font-bold shadow-sm hover:bg-(--brand-blue-deep) hover:shadow-md transition-all cursor-pointer"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Station
          </button>
        )}
      </div>

      {/* ── VIEWS ── */}
      <AnimatePresence mode="wait">
        {viewState === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stations.length === 0 ? (
              <div className="col-span-full py-16 bg-(--surface-soft)/30 border-2 border-dashed border-(--brand-border)/80 rounded-2xl text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4a90a4] to-[#6cb567] flex items-center justify-center mx-auto mb-4">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h3 className="text-[14px] font-extrabold text-(--brand-ink)">No Locations Deployed</h3>
                <p className="text-[12px] text-(--brand-muted) mt-1 max-w-sm mx-auto font-medium">Establish a physical premise before installing hardware chargers.</p>
              </div>
            ) : (
              stations.map((station, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  key={station._id}
                  className="bg-white border border-(--brand-border)/80 rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex flex-col group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-(--brand-blue) to-(--brand-green) opacity-80" />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-(--surface-soft)/60 border border-(--brand-border)/60 flex items-center justify-center text-(--brand-blue) group-hover:scale-105 transition-transform">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditingStation(station)} className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-(--surface-soft) hover:text-(--brand-blue) transition-colors cursor-pointer" title="Edit">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                      </button>
                      <button onClick={() => setDeletingStationId(station._id)} className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-(--ui-error)/10 hover:text-(--ui-error) transition-colors cursor-pointer" title="Delete">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-[16px] font-bold text-(--brand-ink) mb-1 truncate">{station.stationName}</h3>
                  <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-[0.14em] mb-3">Owner: {station.ownerName || user?.displayName}</p>
                  <p className="text-[12px] text-(--brand-muted) mb-5 line-clamp-2 font-medium">{station.address}</p>
                  
                  <div className="mt-auto pt-3 border-t border-(--brand-border)/50 flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-(--surface-soft) text-(--brand-blue) border border-(--brand-border)/60">
                      {Array.isArray(station.chargers) ? station.chargers.length : 0} Hardware Units
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {viewState === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-3xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-(--brand-border)/80 shadow-xl relative">
            <button onClick={() => setViewState('list')} className="absolute top-6 right-6 p-2 rounded-lg text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </div>
              <div>
                <h2 className="text-[18px] font-extrabold text-(--brand-ink) tracking-tight">Deploy New Premise</h2>
                <p className="text-[11px] text-(--brand-muted) font-medium">Add a physical location to your network.</p>
              </div>
            </div>
            
            <form onSubmit={handleCreateStation} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Station Name</label>
                  <input required type="text" placeholder="e.g. VoltHive City Center Parking" value={sName} onChange={e => setSName(e.target.value)} className={inputCls} />
                </div>
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Physical Address</label>
                  <input required type="text" placeholder="Full street address" value={sAddress} onChange={e => setSAddress(e.target.value)} className={inputCls} />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Map Coordinates</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input required type="text" placeholder="Latitude" value={sLat} onChange={e => setSLat(e.target.value)} className={`${inputCls} flex-1`} />
                    <input required type="text" placeholder="Longitude" value={sLng} onChange={e => setSLng(e.target.value)} className={`${inputCls} flex-1`} />
                    <button type="button" onClick={handleLocationRequest} className="px-5 py-2.5 bg-(--surface-soft) text-(--brand-blue) rounded-xl border border-(--brand-border)/80 font-bold hover:bg-(--surface-tint) transition-colors shrink-0 flex justify-center items-center gap-2 cursor-pointer text-[12px]">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Pin on Map
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Support Contact</label>
                  <input required type="tel" placeholder="+94 11 234 5678" value={sPhone} onChange={e => setSPhone(e.target.value)} className={inputCls} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Owner / Operating Company</label>
                  <input type="text" disabled value={user?.displayName || 'Auto-Detected'} className={`${inputCls} bg-(--surface-soft)/40 opacity-70 cursor-not-allowed text-(--brand-muted)`} />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Premise Notes</label>
                  <input type="text" placeholder="Optional directions..." value={sDescription} onChange={e => setSDescription(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3.5 bg-(--brand-blue) text-white rounded-xl text-[13px] font-bold shadow-sm hover:bg-(--brand-blue-deep) hover:shadow-md transition-all cursor-pointer">
                  Deploy Premise
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAP MODAL ── */}
      <AnimatePresence>
        {showMapPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-(--brand-ink)/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.97, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 12 }} className="bg-white rounded-2xl overflow-hidden w-full max-w-4xl h-[80vh] flex flex-col border border-(--brand-border)/80 shadow-2xl">
              <div className="px-6 py-4 border-b border-(--brand-border)/60 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-(--brand-blue)/10 flex items-center justify-center text-(--brand-blue)">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <h3 className="font-extrabold text-(--brand-ink) tracking-tight text-[15px]">Pin Station Location</h3>
                </div>
                <button onClick={() => setShowMapPicker(false)} className="p-2 rounded-lg text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="flex-1 relative bg-(--surface-soft)/40">
                {isLoaded ? (
                  <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={mapCenter} zoom={14} onClick={handleMapClick} options={{ disableDefaultUI: true }}>
                    {sLat && sLng && <Marker position={{ lat: Number(sLat), lng: Number(sLng) }} />}
                  </GoogleMap>
                ) : <div className="flex h-full items-center justify-center text-[13px] font-bold text-(--brand-muted)">Loading Maps...</div>}
              </div>
              
              <div className="px-6 py-4 bg-white border-t border-(--brand-border)/60 flex justify-between items-center">
                <div className="text-[12px] font-bold text-(--brand-ink)">
                  {sLat && sLng ? <span className="font-mono bg-(--surface-soft) px-2 py-1 rounded-md border border-(--brand-border)">{sLat}, {sLng}</span> : <span className="text-(--brand-muted)">Click anywhere on the map to place a pin</span>}
                </div>
                <button onClick={() => setShowMapPicker(false)} className="px-5 py-2.5 bg-(--brand-ink) text-white rounded-xl text-[12px] font-bold hover:bg-black transition-colors cursor-pointer">
                  Confirm Pin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditStationModal
        station={editingStation as unknown as null}
        isOpen={!!editingStation}
        onClose={() => setEditingStation(null)}
        onSaved={fetchStations}
      />

      <ConfirmModal
        isOpen={Boolean(deletingStationId)}
        title="Permanently Delete Station"
        message="Are you sure you want to delete this station premise? This will permanently remove all linked hardware charging units and active operator logs."
        confirmText="Delete Station"
        isDanger={true}
        onClose={() => setDeletingStationId(null)}
        onConfirm={() => deletingStationId && executeDeleteStation(deletingStationId)}
      />

      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
