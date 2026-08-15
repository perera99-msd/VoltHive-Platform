'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import ConfirmModal from '../common/ConfirmModal';

type Station = {
  _id: string;
  stationName: string;
  address?: string;
  locationType?: string;
  contactPhone?: string;
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
      setPhone(station.contactPhone || station.phone || '');
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
    if (!sLat && !sLng && typeof window !== 'undefined' && navigator.geolocation) {
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
      
      const payload: {
        stationName: string;
        address: string;
        locationType: string;
        phone: string;
        description: string;
        location?: { type: string; coordinates: [number, number] };
      } = {
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
        setShowConfirmUpdate(false);
        alert(`Error: ${err.message || 'Failed to update station'}`);
      }
    } catch (error) {
      console.error(error);
      setShowConfirmUpdate(false);
      alert('Network error updating station');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-(--surface-soft)/50 border border-[#e0e5e3] rounded-2xl text-xs text-(--brand-ink) font-semibold focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) focus:bg-white transition-all placeholder:text-(--brand-muted)/60";

  return (
    <>
      <AnimatePresence>
        {isOpen && station && !showMapPicker && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-2xl bg-white/95 backdrop-blur-3xl rounded-3xl border border-[#e0e5e3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-[#e0e5e3] flex justify-between items-center bg-white/80 backdrop-blur-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-(--brand-blue)/10 to-(--brand-green)/10 border border-[#e0e5e3] flex items-center justify-center text-(--brand-blue-deep) shadow-2xs">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-(--brand-ink) tracking-tight">Edit Station Premise</h3>
                    <p className="text-xs text-(--brand-muted) font-medium">Update location details, physical address, and contact hotline.</p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-(--surface-soft) text-(--brand-muted) hover:text-(--brand-ink) border border-[#e0e5e3] transition-colors cursor-pointer"
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 sm:px-8 overflow-y-auto space-y-4 [&::-webkit-scrollbar]:hidden">
                <form id="edit-station-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Station Name */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-(--brand-muted) mb-1.5">
                      Station / Location Name *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className={inputCls} 
                    />
                  </div>

                  {/* Physical Address */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-(--brand-muted) mb-1.5">
                      Physical Street Address *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      className={inputCls} 
                    />
                  </div>

                  {/* Location Type */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-(--brand-muted) mb-1.5">
                      Premise Type
                    </label>
                    <select 
                      value={locType} 
                      onChange={(e) => setLocType(e.target.value)} 
                      className={inputCls}
                    >
                      <option value="Urban Center">Urban Center / Mall</option>
                      <option value="Highway Hub">Highway / Rest Stop Hub</option>
                      <option value="Commercial Complex">Commercial / Office Park</option>
                      <option value="Hotel & Resort">Hotel & Hospitality</option>
                      <option value="Residential">Residential Community</option>
                    </select>
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-(--brand-muted) mb-1.5">
                      Site Hotline / Support Phone
                    </label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className={inputCls} 
                    />
                  </div>

                  {/* Map Coordinates Picker */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-(--brand-muted) mb-1.5">
                      Map Positioning (GPS Coordinates)
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="text" 
                        readOnly 
                        value={sLat && sLng ? `${sLat}, ${sLng}` : ''} 
                        className={`${inputCls} cursor-not-allowed bg-white`} 
                      />
                      <button 
                        type="button" 
                        onClick={handleLocationRequest} 
                        className="px-4 py-3 bg-(--surface-soft) hover:bg-white text-(--brand-ink) font-extrabold text-xs rounded-2xl border border-[#e0e5e3] transition-all shrink-0 cursor-pointer shadow-2xs"
                      >
                        📍 Pick on Map
                      </button>
                    </div>
                  </div>

                  {/* Premise Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-(--brand-muted) mb-1.5">
                      Premise Directions & Driver Notes
                    </label>
                    <textarea 
                      rows={3} 
                      value={desc} 
                      onChange={(e) => setDesc(e.target.value)} 
                      className={inputCls} 
                    />
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="px-6 sm:px-8 py-4 bg-white border-t border-[#e0e5e3] flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-5 py-2.5 rounded-xl border border-[#e0e5e3] text-xs font-bold text-(--brand-muted) hover:bg-(--surface-soft) transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="edit-station-form" 
                  disabled={loading} 
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Saving...' : 'Save Premise Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Map Picker Modal */}
      <AnimatePresence>
        {showMapPicker && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMapPicker(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-3xl border border-[#e0e5e3] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-[#e0e5e3] flex justify-between items-center bg-white/80 backdrop-blur-xl">
                <div>
                  <h3 className="text-sm font-extrabold text-(--brand-ink)">Pinpoint Station Coordinates</h3>
                  <p className="text-xs text-(--brand-muted) font-medium">Click on the map to adjust exact GPS coordinates.</p>
                </div>
                <button 
                  onClick={() => setShowMapPicker(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--surface-soft) text-(--brand-muted) hover:text-(--brand-ink) border border-[#e0e5e3] transition-colors cursor-pointer"
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="w-full h-80 bg-slate-100 relative">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={sLat && sLng ? { lat: Number(sLat), lng: Number(sLng) } : mapCenter}
                    zoom={14}
                    onClick={handleMapClick}
                    options={{ disableDefaultUI: true, zoomControl: true }}
                  >
                    {sLat && sLng && (
                      <MarkerF position={{ lat: Number(sLat), lng: Number(sLng) }} />
                    )}
                  </GoogleMap>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-bold text-(--brand-muted)">Loading Maps...</div>
                )}
              </div>

              <div className="px-6 py-3.5 bg-white border-t border-[#e0e5e3] flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-(--brand-blue-deep)">
                  {sLat && sLng ? `Selected: ${sLat}, ${sLng}` : 'Click map to place pin'}
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowMapPicker(false)} 
                  className="px-5 py-2 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm Coordinates
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal Before Updating */}
      <ConfirmModal
        isOpen={showConfirmUpdate}
        title="Save Station Premise Changes?"
        message={`Apply updates to "${name}"? Driver apps and network maps will reflect the updated details.`}
        confirmText="Save Changes"
        cancelText="Cancel"
        isLoading={loading}
        onClose={() => setShowConfirmUpdate(false)}
        onConfirm={executeUpdate}
      />
    </>
  );
}
