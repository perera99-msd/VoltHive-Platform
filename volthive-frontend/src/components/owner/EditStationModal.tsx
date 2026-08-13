'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import ConfirmModal from '../common/ConfirmModal';

type Station = {
  _id: string;
  stationName: string;
  address?: string;
  locationType?: string;
  phone?: string;
  description?: string;
  location?: { coordinates?: [number, number] };
};

type Props = {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (msg?: string) => void;
};

export default function EditStationModal({ station, isOpen, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [locType, setLocType] = useState('Urban Center');
  const [phone, setPhone] = useState('');
  const [desc, setDesc] = useState('');
  
  // Location States
  const [sLat, setSLat] = useState('');
  const [sLng, setSLng] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 6.9271, lng: 79.8612 });

  const [loading, setLoading] = useState(false);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    if (station) {
      setName(station.stationName || '');
      setAddress(station.address || '');
      setLocType(station.locationType || 'Urban Center');
      setPhone(station.phone || '');
      setDesc(station.description || '');
      if (station.location?.coordinates) {
        setSLng(station.location.coordinates[0].toString());
        setSLat(station.location.coordinates[1].toString());
        setMapCenter({
          lat: station.location.coordinates[1],
          lng: station.location.coordinates[0]
        });
      }
    }
  }, [station]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setSLat(e.latLng.lat().toFixed(6));
      setSLng(e.latLng.lng().toFixed(6));
    }
  }, []);

  const handleLocationRequest = () => {
    setShowMapPicker(true);
    if (!sLat && !sLng && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => console.warn("Geolocation denied or unavailable")
      );
    } else if (sLat && sLng) {
      setMapCenter({ lat: Number(sLat), lng: Number(sLng) });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!station || !user) return;
    setShowConfirmUpdate(true);
  };

  const executeUpdate = async () => {
    if (!station || !user) return;
    setLoading(true);

    try {
      const token = await user.getIdToken();
      
      const payload: any = {
        stationName: name,
        address,
        locationType: locType,
        phone,
        description: desc
      };

      if (sLat && sLng) {
        payload.location = {
          type: 'Point',
          coordinates: [parseFloat(sLng), parseFloat(sLat)]
        };
      }

      const res = await fetch(apiUrl(`/api/stations/${station._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowConfirmUpdate(false);
        onSaved('Station premise updated successfully!');
        onClose();
      } else {
        const err = await res.json();
        alert(`Error: ${err.message || 'Failed to update station'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-(--surface-soft)/40 border border-(--brand-border)/80 rounded-xl text-[13px] text-(--brand-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) transition-all placeholder:text-(--brand-muted)/50";

  return (
    <>
      <AnimatePresence>
        {isOpen && station && !showMapPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-(--brand-ink)/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-[24px] max-w-2xl w-full border border-(--brand-border)/80 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-(--brand-border)/60 flex justify-between items-center bg-(--surface-soft)/30">
                <div>
                  <h3 className="text-[18px] font-extrabold text-(--brand-ink) tracking-tight">Edit Premise Specifications</h3>
                  <p className="text-[12px] text-(--brand-muted) font-medium mt-0.5">Update site name, physical location, and contact information.</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 sm:px-8 overflow-y-auto">
                <form id="edit-station-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Premise Name</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. VoltHive City Center Parking" />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Physical Address</label>
                    <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputCls} placeholder="Full street address" />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Location Type <span className="text-(--brand-muted)/60 normal-case font-medium">(used by AI demand model)</span></label>
                    <select value={locType} onChange={e => setLocType(e.target.value)} className={`${inputCls} cursor-pointer`}>
                      {['Airport', 'Highway Corridor', 'Hotel/Hospitality', 'Residential', 'Shopping Center', 'Suburban', 'Urban Center', 'Workplace'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
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
                    <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Contact Hotline</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+94 7X XXX XXXX" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Owner / Operating Company</label>
                    <input type="text" disabled value={user?.displayName || 'Auto-Detected'} className={`${inputCls} bg-(--surface-soft)/40 opacity-70 cursor-not-allowed text-(--brand-muted)`} />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Description / Access Notes</label>
                    <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} className={inputCls} placeholder="Optional directions..." />
                  </div>
                </form>
              </div>

              {/* Footer Actions */}
              <div className="px-6 sm:px-8 py-5 border-t border-(--brand-border)/60 bg-(--surface-soft)/30 flex flex-col sm:flex-row gap-3 justify-end">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-(--brand-border)/80 text-(--brand-ink) font-bold rounded-xl hover:bg-(--surface-soft)/50 transition-colors text-[13px] cursor-pointer w-full sm:w-auto">
                  Cancel
                </button>
                <button type="submit" form="edit-station-form" disabled={loading} className="px-8 py-3 bg-(--brand-blue) text-white font-bold rounded-xl shadow-sm hover:bg-(--brand-blue-deep) hover:shadow-md transition-all text-[13px] cursor-pointer w-full sm:w-auto">
                  {loading ? 'Saving Changes...' : 'Save Updates'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAP MODAL ── */}
      <AnimatePresence>
        {showMapPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-(--brand-ink)/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.97, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 12 }} className="bg-white rounded-2xl overflow-hidden w-full max-w-4xl h-[80vh] flex flex-col border border-(--brand-border)/80 shadow-2xl">
              <div className="px-6 py-4 border-b border-(--brand-border)/60 flex justify-between items-center bg-white z-10 relative">
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
              
              <div className="px-6 py-4 bg-white border-t border-(--brand-border)/60 flex justify-between items-center z-10 relative">
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

      {/* ── CONFIRM UPDATE MODAL ── */}
      <ConfirmModal
        isOpen={showConfirmUpdate}
        title="Update Station Premise"
        message="Are you sure you want to save these modifications to the station specifications and map location?"
        confirmText="Save Updates"
        isDanger={false}
        isLoading={loading}
        onClose={() => setShowConfirmUpdate(false)}
        onConfirm={executeUpdate}
      />
    </>
  );
}
