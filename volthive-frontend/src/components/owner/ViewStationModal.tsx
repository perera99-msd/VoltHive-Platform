'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

type Charger = {
  _id: string;
  plugType: string;
  powerKW: number;
  basePricePerKwh: number;
  status: string;
  statusDisplay?: string;
  currentRate?: number;
};

type Station = {
  _id: string;
  stationName: string;
  ownerName?: string;
  address?: string;
  locationType?: string;
  contactPhone?: string;
  phone?: string;
  description?: string;
  location?: { coordinates?: [number, number] };
  chargers?: Charger[];
  basePricePerKwh?: number;
};

type Props = {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (station: Station) => void;
};

export default function ViewStationModal({ station, isOpen, onClose, onEdit }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  if (!station) return null;

  const lat = station.location?.coordinates ? station.location.coordinates[1] : 6.9271;
  const lng = station.location?.coordinates ? station.location.coordinates[0] : 79.8612;
  const chargersList = station.chargers || [];
  const contact = station.contactPhone || station.phone || 'No hotline provided';

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative z-10 w-full max-w-3xl bg-white/95 backdrop-blur-3xl rounded-3xl border border-[#e0e5e3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-[#e0e5e3] flex justify-between items-center bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-(--brand-blue)/15 to-(--brand-green)/15 border border-[#e0e5e3] flex items-center justify-center text-(--brand-blue-deep) shadow-2xs">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H21m-9 0H3.75A2.25 2.25 0 011.5 18.75V4.5A2.25 2.25 0 013.75 2.25h16.5A2.25 2.25 0 0122.5 4.5v14.25A2.25 2.25 0 0120.25 21H13.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-(--brand-ink) tracking-tight">{station.stationName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-(--brand-green)/10 text-(--brand-green-deep) border border-(--brand-green)/20">
                      {station.locationType || 'Urban Center'}
                    </span>
                    <span className="text-xs font-semibold text-(--brand-muted)">
                      Host: {station.ownerName || 'VoltHive Partner'}
                    </span>
                  </div>
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

            {/* Scrollable Content */}
            <div className="p-6 sm:px-8 overflow-y-auto space-y-5 [&::-webkit-scrollbar]:hidden">
              
              {/* Quick Spec Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-(--surface-soft)/50 rounded-2xl border border-[#e0e5e3] flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted) mb-1">Contact Hotline</span>
                  <span className="text-xs font-black text-(--brand-ink) truncate">📞 {contact}</span>
                </div>
                <div className="p-4 bg-(--surface-soft)/50 rounded-2xl border border-[#e0e5e3] flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted) mb-1">GPS Coordinates</span>
                  <span className="text-xs font-mono font-bold text-(--brand-blue-deep) truncate">📍 {lat.toFixed(4)}, {lng.toFixed(4)}</span>
                </div>
                <div className="p-4 bg-(--surface-soft)/50 rounded-2xl border border-[#e0e5e3] flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted) mb-1">Installed Units</span>
                  <span className="text-xs font-black text-(--brand-green-deep)">⚡ {chargersList.length} Connected Plugs</span>
                </div>
              </div>

              {/* Physical Address */}
              <div className="p-4 bg-white rounded-2xl border border-[#e0e5e3] shadow-2xs">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted) mb-1">Physical Location Address</h4>
                <p className="text-xs text-(--brand-ink) font-semibold leading-relaxed">{station.address || 'No physical address configured'}</p>
              </div>

              {/* Description / Directions */}
              {station.description && (
                <div className="p-4 bg-white rounded-2xl border border-[#e0e5e3] shadow-2xs">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted) mb-1">Premise Notes & Directions</h4>
                  <p className="text-xs text-(--brand-ink) font-medium leading-relaxed">{station.description}</p>
                </div>
              )}

              {/* Interactive Map Preview */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted) mb-2">Location Map View</h4>
                <div className="w-full h-52 rounded-2xl overflow-hidden border border-[#e0e5e3] bg-(--surface-soft)/40 relative shadow-2xs">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={{ lat, lng }}
                      zoom={15}
                      options={{ disableDefaultUI: true, zoomControl: true }}
                    >
                      <MarkerF position={{ lat, lng }} />
                    </GoogleMap>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-bold text-(--brand-muted)">Loading Maps...</div>
                  )}
                </div>
              </div>

              {/* Hardware Units List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-(--brand-ink)">
                    Installed Charger Hardware ({chargersList.length})
                  </h4>
                </div>

                {chargersList.length === 0 ? (
                  <div className="p-6 bg-(--surface-soft)/30 border border-dashed border-[#e0e5e3] rounded-2xl text-center">
                    <p className="text-xs font-medium text-(--brand-muted)">No chargers currently installed at this premise.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {chargersList.map((charger) => (
                      <div key={charger._id} className="p-4 bg-white border border-[#e0e5e3] rounded-2xl shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-xs text-(--brand-ink)">{charger.plugType}</span>
                            <span className="px-2 py-0.5 rounded-md bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase">
                              {charger.powerKW} kW
                            </span>
                          </div>
                          <p className="text-[11px] text-(--brand-muted) font-semibold">Rate: LKR {charger.currentRate ?? charger.basePricePerKwh}/kWh</p>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${
                          charger.status === 'AVAILABLE' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                          charger.status === 'CHARGING' ? 'bg-(--brand-blue)/10 text-(--brand-blue-deep) border-(--brand-blue)/20' :
                          charger.status === 'OFFLINE' ? 'bg-(--ui-error)/10 text-(--ui-error) border-(--ui-error)/20' :
                          'bg-(--surface-soft) text-(--brand-muted) border-[#e0e5e3]'
                        }`}>
                          {charger.statusDisplay || charger.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Toolbar */}
            <div className="px-6 sm:px-8 py-4 bg-white border-t border-[#e0e5e3] flex justify-end gap-3">
              <button 
                type="button"
                onClick={onClose} 
                className="px-5 py-2.5 rounded-xl border border-[#e0e5e3] text-xs font-bold text-(--brand-muted) hover:bg-(--surface-soft) transition-all cursor-pointer"
              >
                Close
              </button>
              <button 
                type="button"
                onClick={() => { onClose(); onEdit(station); }} 
                className="px-5 py-2.5 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
                <span>Edit Premise Details</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
