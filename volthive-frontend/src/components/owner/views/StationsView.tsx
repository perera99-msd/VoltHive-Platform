'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
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
  const [deletingStationId, setDeletingStationId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' } | null>(null);

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
        setToastMessage({ msg: 'Station premise permanently removed.', type: 'success' });
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

  const filteredStations = stations.filter(s => 
    s.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalChargers = stations.reduce((acc, s) => acc + (Array.isArray(s.chargers) ? s.chargers.length : 0), 0);
  const onlineChargers = stations.reduce((acc, s) => acc + (Array.isArray(s.chargers) ? s.chargers.filter(c => c.status !== 'OFFLINE').length : 0), 0);
  const healthPct = totalChargers > 0 ? Math.round((onlineChargers / totalChargers) * 100) : 100;

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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-extrabold uppercase tracking-wider border border-(--brand-blue)/20">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-blue) animate-pulse" />
              {stations.length} Registered Locations
            </span>
          </div>
          <p className="text-[12px] text-(--brand-muted) font-medium">Establish, inspect, edit, and manage your physical site locations across the charging network.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-(--brand-blue) to-(--brand-green) text-white px-5 py-2.5 rounded-xl text-[12px] font-bold shadow-sm hover:brightness-105 hover:shadow-md transition-all cursor-pointer"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add New Station
        </button>
      </div>

      {/* ── SUMMARY STATS BAR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H21m-9 0H3.75A2.25 2.25 0 011.5 18.75V4.5A2.25 2.25 0 013.75 2.25h16.5A2.25 2.25 0 0122.5 4.5v14.25A2.25 2.25 0 0120.25 21H13.5z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Total Stations</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">{stations.length} Premises</h3>
          </div>
        </div>

        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-(--brand-green)/10 border border-(--brand-green)/20 flex items-center justify-center text-(--brand-green-deep)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Connected Hardware</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">{totalChargers} Plugs Installed</h3>
          </div>
        </div>

        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--ui-warning)]/10 border border-[var(--ui-warning)]/20 flex items-center justify-center text-[#d09d2e]">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Network Operations</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">
              {totalChargers > 0 ? `${healthPct}% Online` : 'No hardware'}
            </h3>
            <p className="text-[10px] text-(--brand-muted) font-medium">{onlineChargers} of {totalChargers} chargers active</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="mb-6">
        <div className="relative">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) absolute left-4 top-1/2 -translate-y-1/2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input
            type="text"
            placeholder="Search stations by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-(--brand-border)/80 rounded-xl text-[13px] text-(--brand-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) shadow-xs transition-all placeholder:text-(--brand-muted)/50"
          />
        </div>
      </div>

      {/* ── STATIONS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStations.length === 0 ? (
          <div className="col-span-full py-16 bg-(--surface-soft)/30 border-2 border-dashed border-(--brand-border)/80 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4a90a4] to-[#6cb567] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h3 className="text-[14px] font-extrabold text-(--brand-ink)">No Locations Found</h3>
            <p className="text-[12px] text-(--brand-muted) mt-1 max-w-sm mx-auto font-medium">
              {searchQuery ? `No stations match "${searchQuery}".` : 'Establish a physical premise before installing hardware chargers.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-(--brand-blue) text-white text-[12px] font-bold rounded-xl shadow-xs hover:bg-(--brand-blue-deep) transition-all cursor-pointer inline-flex items-center gap-2"
              >
                + Deploy First Premise
              </button>
            )}
          </div>
        ) : (
          filteredStations.map((station, i) => (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              key={station._id}
              className="bg-white border border-(--brand-border)/80 rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden"
            >
              {/* Top Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-(--brand-blue) to-(--brand-green) opacity-80" />
              
              <div className="flex items-start justify-between mb-4 mt-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-(--brand-blue)/10 to-(--brand-green)/10 border border-(--brand-border)/60 flex items-center justify-center text-(--brand-blue) group-hover:scale-105 transition-transform">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H21m-9 0H3.75A2.25 2.25 0 011.5 18.75V4.5A2.25 2.25 0 013.75 2.25h16.5A2.25 2.25 0 0122.5 4.5v14.25A2.25 2.25 0 0120.25 21H13.5z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-extrabold text-(--brand-ink) tracking-tight truncate max-w-[150px] sm:max-w-[170px]">{station.stationName}</h3>
                    <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Owner: {station.ownerName || user?.displayName}</p>
                  </div>
                </div>

                {/* ACTION TOOLBAR: VIEW, EDIT, DELETE */}
                <div className="flex items-center gap-1 bg-(--surface-soft)/60 p-1 rounded-xl border border-(--brand-border)/40">
                  <button 
                    onClick={() => setViewingStation(station)} 
                    className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-white hover:text-(--brand-blue) hover:shadow-xs transition-all cursor-pointer" 
                    title="View Station Details"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                  <button 
                    onClick={() => setEditingStation(station)} 
                    className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-white hover:text-(--brand-blue) hover:shadow-xs transition-all cursor-pointer" 
                    title="Edit Station"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                  </button>
                  <button 
                    onClick={() => setDeletingStationId(station._id)} 
                    className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-(--ui-error)/10 hover:text-(--ui-error) transition-all cursor-pointer" 
                    title="Delete Station"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
              </div>

              {/* Physical Address */}
              <div className="mb-4 px-3 py-2 bg-(--surface-soft)/40 rounded-xl text-[11px] text-(--brand-ink) font-medium border border-(--brand-border)/50 flex items-start gap-2">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-blue) shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <span className="line-clamp-2">{station.address || 'No address provided'}</span>
              </div>
              
              {/* Card Footer Info */}
              <div className="mt-auto pt-3 border-t border-(--brand-border)/50 flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-(--brand-blue)/10 text-(--brand-blue-deep) border border-(--brand-blue)/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-(--brand-blue)" />
                  {Array.isArray(station.chargers) ? station.chargers.length : 0} Hardware Plugs
                </span>

                <button 
                  onClick={() => setViewingStation(station)}
                  className="text-[11px] font-bold text-(--brand-blue) hover:text-(--brand-blue-deep) flex items-center gap-1 cursor-pointer transition-colors"
                >
                  View Specs →
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── MODALS & TOASTS ── */}
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
        station={editingStation as unknown as null}
        isOpen={!!editingStation}
        onClose={() => setEditingStation(null)}
        onSaved={(msg) => {
          fetchStations();
          if (msg) setToastMessage({ msg, type: 'success' });
        }}
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
