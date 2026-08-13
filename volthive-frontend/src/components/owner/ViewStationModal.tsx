'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

type Charger = {
  _id: string;
  plugType: string;
  powerKW: number;
  basePricePerKwh: number;
  status: string;
};

type Station = {
  _id: string;
  stationName: string;
  ownerName?: string;
  address?: string;
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
            className="bg-white rounded-[24px] max-w-3xl w-full border border-(--brand-border)/80 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-(--brand-border)/60 flex justify-between items-center bg-(--surface-soft)/30">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-(--brand-blue)/15 to-(--brand-green)/15 border border-(--brand-border)/80 flex items-center justify-center text-(--brand-blue) shadow-xs">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H21m-9 0H3.75A2.25 2.25 0 011.5 18.75V4.5A2.25 2.25 0 013.75 2.25h16.5A2.25 2.25 0 0122.5 4.5v14.25A2.25 2.25 0 0120.25 21H13.5z" /></svg>
                </div>
                <div>
                  <h3 className="text-[20px] font-extrabold text-(--brand-ink) tracking-tight">{station.stationName}</h3>
                  <p className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider">Owner: {station.ownerName || 'VoltHive Partner'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              
              {/* Quick Spec Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-(--surface-soft)/40 rounded-xl border border-(--brand-border)/60 flex flex-col justify-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-1">Contact Hotline</span>
                  <span className="text-[13px] font-extrabold text-(--brand-ink) truncate">📞 {contact}</span>
                </div>
                <div className="p-3.5 bg-(--surface-soft)/40 rounded-xl border border-(--brand-border)/60 flex flex-col justify-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-1">Map Position</span>
                  <span className="text-[12px] font-mono font-bold text-(--brand-blue-deep) truncate">📍 {lat.toFixed(4)}, {lng.toFixed(4)}</span>
                </div>
                <div className="p-3.5 bg-(--surface-soft)/40 rounded-xl border border-(--brand-border)/60 flex flex-col justify-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-1">Hardware Units</span>
                  <span className="text-[13px] font-extrabold text-(--brand-green-deep)">⚡ {chargersList.length} Connected Plugs</span>
                </div>
              </div>

              {/* Physical Address */}
              <div className="p-4 bg-(--surface-soft)/30 rounded-2xl border border-(--brand-border)/60">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-1">Physical Location Address</h4>
                <p className="text-[13px] text-(--brand-ink) font-medium">{station.address || 'No physical address configured'}</p>
              </div>

              {/* Description / Directions */}
              {station.description && (
                <div className="p-4 bg-(--surface-soft)/30 rounded-2xl border border-(--brand-border)/60">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-1">Premise Notes & Directions</h4>
                  <p className="text-[12px] text-(--brand-ink) font-medium leading-relaxed">{station.description}</p>
                </div>
              )}

              {/* Interactive Map Preview */}
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-2">Location Map View</h4>
                <div className="w-full h-48 rounded-2xl overflow-hidden border border-(--brand-border)/80 bg-(--surface-soft)/40 relative">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={{ lat, lng }}
                      zoom={15}
                      options={{ disableDefaultUI: true, zoomControl: true }}
                    >
                      <Marker position={{ lat, lng }} />
                    </GoogleMap>
                  ) : (
                    <div className="flex h-full items-center justify-center text-[12px] font-bold text-(--brand-muted)">Loading Maps...</div>
                  )}
                </div>
              </div>

              {/* Hardware Units List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-(--brand-ink)">Installed Charger Hardware ({chargersList.length})</h4>
                </div>

                {chargersList.length === 0 ? (
                  <div className="p-6 bg-(--surface-soft)/20 border border-dashed border-(--brand-border)/80 rounded-2xl text-center">
                    <p className="text-[12px] font-medium text-(--brand-muted)">No chargers currently installed at this premise.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {chargersList.map((charger) => (
                      <div key={charger._id} className="p-3.5 bg-white border border-(--brand-border)/80 rounded-xl shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-[13px] text-(--brand-ink)">{charger.plugType}</span>
                            <span className="px-1.5 py-0.5 rounded bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[9px] font-extrabold uppercase">
                              {charger.powerKW} kW
                            </span>
                          </div>
                          <p className="text-[10px] text-(--brand-muted) font-medium">Rate: LKR {charger.basePricePerKwh}/kWh</p>
                        </div>
                        <span className={`px-2 py-1 text-[9px] font-extrabold uppercase rounded-md border ${
                          charger.status === 'AVAILABLE' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                          charger.status === 'CHARGING' ? 'bg-(--brand-blue)/10 text-(--brand-blue-deep) border-(--brand-blue)/20' :
                          'bg-(--surface-soft) text-(--brand-muted) border-(--brand-border)'
                        }`}>
                          {charger.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 py-4 border-t border-(--brand-border)/60 bg-(--surface-soft)/30 flex justify-between items-center">
              <button onClick={onClose} className="px-6 py-2.5 bg-white border border-(--brand-border)/80 text-(--brand-ink) font-bold rounded-xl hover:bg-(--surface-soft)/50 transition-colors text-[12px] cursor-pointer">
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onEdit(station);
                }}
                className="px-6 py-2.5 bg-(--brand-blue) text-white font-bold rounded-xl shadow-xs hover:bg-(--brand-blue-deep) transition-all text-[12px] cursor-pointer flex items-center gap-2"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                Edit Premise Specs
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
