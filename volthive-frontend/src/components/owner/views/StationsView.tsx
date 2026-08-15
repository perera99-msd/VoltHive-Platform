'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useLiveEvents } from '../../../context/LiveEventsContext';
import { apiUrl } from '../../../lib/api';
import AddStationModal from '../AddStationModal';
import EditStationModal from '../EditStationModal';
import ViewStationModal from '../ViewStationModal';
import ConfirmModal from '../../common/ConfirmModal';
import Toast from '../../common/Toast';

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
  locationType?: string;
  contactPhone?: string;
  phone?: string;
  description?: string;
  location?: { coordinates?: [number, number] };
  chargers?: Charger[];
  basePricePerKwh?: number;
};

export default function StationsView() {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingStation, setViewingStation] = useState<Station | null>(null);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [deletingStation, setDeletingStation] = useState<Station | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' } | null>(null);

  const fetchStations = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    fetchStations();
    // Slow self-healing fallback poll (SSE pushes instant updates when live).
    const interval = setInterval(fetchStations, 60000);
    return () => clearInterval(interval);
  }, [fetchStations]);

  // Realtime: refresh the grid instantly when charger availability changes.
  const { subscribe } = useLiveEvents();
  useEffect(() => {
    const unsub = subscribe('availability.updated', () => {
      fetchStations();
    });
    return unsub;
  }, [subscribe, fetchStations]);

  const executeDeleteStation = async (stationId: string) => {
    setIsDeleting(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(apiUrl(`/api/stations/${stationId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletingStation(null);
      if (res.ok) {
        setToastMessage({ msg: 'Station premise permanently removed.', type: 'success' });
        fetchStations();
      } else {
        setToastMessage({ msg: 'Failed to delete station premise.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setDeletingStation(null);
      setToastMessage({ msg: 'Network failure communicating with server.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStations = stations.filter(s => 
    s.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.locationType && s.locationType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalChargers = stations.reduce((acc, s) => acc + (Array.isArray(s.chargers) ? s.chargers.length : 0), 0);
  const onlineChargers = stations.reduce((acc, s) => acc + (Array.isArray(s.chargers) ? s.chargers.filter(c => c.status !== 'OFFLINE').length : 0), 0);
  const healthPct = totalChargers > 0 ? Math.round((onlineChargers / totalChargers) * 100) : 100;
  const totalKwCapacity = stations.reduce((acc, s) => {
    const chargers = Array.isArray(s.chargers) ? s.chargers : [];
    return acc + chargers.reduce((sum, c) => sum + (c.powerKW || 0), 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 font-sans">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-(--brand-blue)"></div>
      </div>
    );
  }

  return (
    <div className="w-full relative font-sans space-y-6 pb-16">
      
      {/* ── 1. HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white font-black flex items-center justify-center shadow-xs shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H21m-9 0H3.75A2.25 2.25 0 011.5 18.75V4.5A2.25 2.25 0 013.75 2.25h16.5A2.25 2.25 0 0122.5 4.5v14.25A2.25 2.25 0 0120.25 21H13.5z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--brand-ink)">My Stations</h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-blue)/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-blue) animate-pulse" />
              {stations.length} Registered Locations
            </span>
          </div>
          <p className="text-xs sm:text-sm text-(--brand-muted) font-medium">
            Inspect, manage, edit premises, and review installed charging hardware across your network.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white px-5 py-3 rounded-2xl text-xs font-black shadow-xs hover:shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Deploy New Premise</span>
        </button>
      </div>

      {/* ── 2. SUMMARY STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Stations */}
        <div className="bg-white/90 backdrop-blur-2xl border border-[#e0e5e3]/90 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />
          <div className="w-12 h-12 rounded-2xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue-deep) shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H21m-9 0H3.75A2.25 2.25 0 011.5 18.75V4.5A2.25 2.25 0 013.75 2.25h16.5A2.25 2.25 0 0122.5 4.5v14.25A2.25 2.25 0 0120.25 21H13.5z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Total Stations</p>
            <h3 className="text-xl font-black text-(--brand-ink)">{stations.length} Premises</h3>
            <p className="text-[11px] text-(--brand-muted) font-semibold">Active host locations</p>
          </div>
        </div>

        {/* Connected Hardware */}
        <div className="bg-white/90 backdrop-blur-2xl border border-[#e0e5e3]/90 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />
          <div className="w-12 h-12 rounded-2xl bg-(--brand-green)/10 border border-(--brand-green)/20 flex items-center justify-center text-(--brand-green-deep) shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Hardware Fleet</p>
            <h3 className="text-xl font-black text-(--brand-ink)">{totalChargers} Plugs Installed</h3>
            <p className="text-[11px] text-(--brand-muted) font-semibold">{totalKwCapacity} kW Total Grid Load</p>
          </div>
        </div>

        {/* Fleet Online Health */}
        <div className="bg-white/90 backdrop-blur-2xl border border-[#e0e5e3]/90 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300/40 flex items-center justify-center text-[#c58d1b] shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Network Health</p>
            <h3 className="text-xl font-black text-(--brand-ink)">
              {totalChargers > 0 ? `${healthPct}% Online` : 'No Hardware'}
            </h3>
            <p className="text-[11px] text-(--brand-muted) font-semibold">{onlineChargers} of {totalChargers} chargers operational</p>
          </div>
        </div>
      </div>

      {/* ── 3. SEARCH BAR ── */}
      <div className="relative">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) absolute left-4 top-1/2 -translate-y-1/2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search stations by name, address, or location type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-10 py-3.5 bg-white/90 backdrop-blur-xl border border-[#e0e5e3] rounded-2xl text-xs text-(--brand-ink) font-semibold focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) shadow-2xs transition-all placeholder:text-(--brand-muted)/60"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--brand-muted) hover:text-(--brand-ink) font-bold text-xs p-1 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── 4. STATIONS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStations.length === 0 ? (
          <div className="col-span-full py-16 bg-white/80 backdrop-blur-2xl border-2 border-dashed border-[#e0e5e3] rounded-3xl text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-(--brand-blue) to-(--brand-green) text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 className="text-base font-black text-(--brand-ink)">No Station Locations Found</h3>
            <p className="text-xs text-(--brand-muted) mt-1 max-w-sm mx-auto font-medium">
              {searchQuery ? `No registered stations match "${searchQuery}". Try a different search term.` : 'Establish a physical premise before installing hardware chargers.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-5 px-5 py-2.5 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs font-black rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>+ Deploy First Premise</span>
              </button>
            )}
          </div>
        ) : (
          filteredStations.map((station, i) => {
            const chargersList = Array.isArray(station.chargers) ? station.chargers : [];
            const stationKw = chargersList.reduce((sum, c) => sum + (c.powerKW || 0), 0);
            const activeChargers = chargersList.filter(c => c.status !== 'OFFLINE').length;
            const contact = station.contactPhone || station.phone || 'No hotline';

            return (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                key={station._id}
                className="bg-white/90 backdrop-blur-2xl border border-[#e0e5e3]/90 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden"
              >
                {/* Top Accent Stripe */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />
                
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-(--brand-blue)/10 to-(--brand-green)/10 border border-[#e0e5e3] flex items-center justify-center text-(--brand-blue-deep) group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H21m-9 0H3.75A2.25 2.25 0 011.5 18.75V4.5A2.25 2.25 0 013.75 2.25h16.5A2.25 2.25 0 0122.5 4.5v14.25A2.25 2.25 0 0120.25 21H13.5z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-(--brand-ink) tracking-tight truncate">{station.stationName}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-(--brand-green)/10 text-(--brand-green-deep) border border-(--brand-green)/20">
                          {station.locationType || 'Urban Center'}
                        </span>
                        <span className="text-[10px] font-bold text-(--brand-muted) truncate">
                          {station.ownerName || user?.displayName || 'Host'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION TOOLBAR: VIEW, EDIT, DELETE */}
                  <div className="flex items-center gap-1 bg-(--surface-soft)/60 p-1 rounded-2xl border border-[#e0e5e3] shrink-0">
                    <button 
                      onClick={() => setViewingStation(station)} 
                      className="p-2 rounded-xl text-(--brand-muted) hover:bg-white hover:text-(--brand-blue) hover:shadow-2xs transition-all cursor-pointer" 
                      title="View Station Details"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setEditingStation(station)} 
                      className="p-2 rounded-xl text-(--brand-muted) hover:bg-white hover:text-(--brand-blue) hover:shadow-2xs transition-all cursor-pointer" 
                      title="Edit Station"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setDeletingStation(station)} 
                      className="p-2 rounded-xl text-(--brand-muted) hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer" 
                      title="Delete Station"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Physical Address */}
                <div className="mb-3 px-3.5 py-2.5 bg-(--surface-soft)/50 rounded-2xl text-xs text-(--brand-ink) font-medium border border-[#e0e5e3] flex items-start gap-2.5">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-blue) shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="line-clamp-2 leading-relaxed">{station.address || 'No physical address configured'}</span>
                </div>

                {/* Contact Hotline & GPS Coordinates */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] font-semibold text-(--brand-muted)">
                  <div className="flex items-center gap-1.5 truncate px-2.5 py-1.5 rounded-xl bg-white border border-[#e0e5e3]">
                    <span>📞</span>
                    <span className="truncate">{contact}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate px-2.5 py-1.5 rounded-xl bg-white border border-[#e0e5e3]">
                    <span>📍</span>
                    <span className="truncate font-mono">
                      {station.location?.coordinates ? `${station.location.coordinates[1].toFixed(3)}, ${station.location.coordinates[0].toFixed(3)}` : 'No GPS'}
                    </span>
                  </div>
                </div>
                
                {/* Card Footer Info */}
                <div className="mt-auto pt-3 border-t border-[#e0e5e3]/80 flex items-center justify-between">
                  <span className="text-[10px] font-black px-3 py-1 rounded-full bg-(--brand-blue)/10 text-(--brand-blue-deep) border border-(--brand-blue)/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--brand-blue)" />
                    {chargersList.length} Plugs ({stationKw} kW · {activeChargers} operational)
                  </span>

                  <button 
                    onClick={() => setViewingStation(station)}
                    className="text-xs font-black text-(--brand-blue) hover:text-(--brand-blue-deep) flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>View Specs</span>
                    <span>→</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── 5. MODALS & TOASTS ── */}
      <AddStationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={(msg) => {
          fetchStations();
          if (msg) setToastMessage({ msg, type: 'success' });
        }}
      />

      <ViewStationModal
        station={viewingStation}
        isOpen={!!viewingStation}
        onClose={() => setViewingStation(null)}
        onEdit={(st) => setEditingStation(st)}
      />

      <EditStationModal
        station={editingStation}
        isOpen={!!editingStation}
        onClose={() => setEditingStation(null)}
        onSaved={(msg) => {
          fetchStations();
          if (msg) setToastMessage({ msg, type: 'success' });
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingStation)}
        title="Permanently Delete Station?"
        message={`Are you sure you want to delete "${deletingStation?.stationName}"? This will permanently remove this station premise and all associated charging hardware units from the network.`}
        confirmText="Delete Station"
        cancelText="Keep Station"
        isDanger={true}
        isLoading={isDeleting}
        onClose={() => setDeletingStation(null)}
        onConfirm={() => deletingStation && executeDeleteStation(deletingStation._id)}
      />

      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
