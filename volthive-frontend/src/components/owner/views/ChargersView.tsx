'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import AddChargerModal from '../AddChargerModal';
import EditChargerModal from '../EditChargerModal';
import ViewChargerModal from '../ViewChargerModal';
import ConfirmModal from '../../common/ConfirmModal';
import Toast from '../../common/Toast';

type Charger = {
  _id: string;
  plugType?: string;
  powerKW?: number;
  basePricePerKwh?: number;
  status?: string;
  statusDisplay?: string;
  stationId?: string;
  stationName?: string;
};

type Station = {
  _id: string;
  stationName: string;
  address?: string;
  chargers?: Charger[];
};

export default function ChargersView() {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingCharger, setViewingCharger] = useState<Charger | null>(null);
  const [editingCharger, setEditingCharger] = useState<Charger | null>(null);
  const [deletingChargerId, setDeletingChargerId] = useState<string | null>(null);
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
  }, [fetchStations]);

  const executeDeleteCharger = async (chargerId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(apiUrl(`/api/chargers/${chargerId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletingChargerId(null);
      if (res.ok) {
        setToastMessage({ msg: 'Hardware unit permanently removed.', type: 'success' });
        fetchStations();
      } else {
        setToastMessage({ msg: 'Failed to delete charger hardware.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setDeletingChargerId(null);
      setToastMessage({ msg: 'Network failure communicating with server.', type: 'error' });
    }
  };

  // Flatten chargers from stations for unified grid
  const allChargers: Charger[] = stations.flatMap(s => 
    (s.chargers || []).map(c => ({
      ...c,
      stationId: s._id,
      stationName: s.stationName
    }))
  );

  const filteredChargers = allChargers.filter(c => {
    const matchesSearch = (c.plugType && c.plugType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.stationName && c.stationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.powerKW && c.powerKW.toString().includes(searchQuery));

    const st = c.status || c.statusDisplay || 'AVAILABLE';
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'AVAILABLE' && (st === 'AVAILABLE' || st === 'Online')) ||
      (statusFilter === 'CHARGING' && st === 'CHARGING') ||
      (statusFilter === 'OFFLINE' && (st === 'OFFLINE' || st === 'MAINTENANCE' || st === 'Offline'));

    return matchesSearch && matchesStatus;
  });

  const totalKwCapacity = allChargers.reduce((acc, c) => acc + (c.powerKW || 0), 0);
  const onlineCount = allChargers.filter(c => {
    const st = c.status || c.statusDisplay;
    return st === 'AVAILABLE' || st === 'Online';
  }).length;
  // Real average tariff (only chargers with an actual price configured)
  const pricedChargers = allChargers.filter(c => Number(c.basePricePerKwh) > 0);
  const avgTariff = pricedChargers.length > 0
    ? Math.round(pricedChargers.reduce((acc, c) => acc + Number(c.basePricePerKwh), 0) / pricedChargers.length)
    : 0;

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
            <h1 className="text-[24px] font-extrabold tracking-tight text-(--brand-ink)">Hardware Fleet</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-extrabold uppercase tracking-wider border border-(--brand-blue)/20">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) animate-pulse" />
              {allChargers.length} Active Ports
            </span>
          </div>
          <p className="text-[12px] text-(--brand-muted) font-medium">Manage charging hardware ports, power outputs, set base tariffs, and inspect live states.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-(--brand-blue) to-(--brand-green) text-white px-5 py-2.5 rounded-xl text-[12px] font-bold shadow-sm hover:brightness-105 hover:shadow-md transition-all cursor-pointer"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Hardware Port
        </button>
      </div>

      {/* ── SUMMARY STATS BAR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Installed Ports</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">{allChargers.length} Plugs</h3>
          </div>
        </div>

        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-(--brand-green)/10 border border-(--brand-green)/20 flex items-center justify-center text-(--brand-green-deep)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Online & Ready</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">{onlineCount} Available</h3>
          </div>
        </div>

        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue-deep)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Fleet Power Output</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">{totalKwCapacity} kW</h3>
          </div>
        </div>

        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--ui-warning)]/10 border border-[var(--ui-warning)]/20 flex items-center justify-center text-[#d09d2e]">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Avg Network Rate</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">
              {avgTariff > 0 ? `LKR ${avgTariff}` : '—'}
              <span className="text-[10px] font-bold opacity-75">{avgTariff > 0 ? '/kWh' : ''}</span>
            </h3>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) absolute left-4 top-1/2 -translate-y-1/2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input
            type="text"
            placeholder="Search by plug standard, kW rating, or premise name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-(--brand-border)/80 rounded-xl text-[13px] text-(--brand-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) shadow-xs transition-all placeholder:text-(--brand-muted)/50"
          />
        </div>

        <div className="inline-flex p-1 bg-white border border-(--brand-border)/80 rounded-xl shadow-xs shrink-0 overflow-x-auto">
          {(['All', 'AVAILABLE', 'CHARGING', 'OFFLINE'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === filter 
                  ? 'bg-(--surface-soft) text-(--brand-ink) border border-(--brand-border)/60' 
                  : 'text-(--brand-muted) hover:text-(--brand-ink)'
              }`}
            >
              {filter === 'All' ? 'All Hardware' : filter === 'AVAILABLE' ? 'Online' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHARGERS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChargers.length === 0 ? (
          <div className="col-span-full py-16 bg-(--surface-soft)/30 border-2 border-dashed border-(--brand-border)/80 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4a90a4] to-[#6cb567] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
            </div>
            <h3 className="text-[14px] font-extrabold text-(--brand-ink)">No Chargers Found</h3>
            <p className="text-[12px] text-(--brand-muted) mt-1 max-w-sm mx-auto font-medium">
              {searchQuery || statusFilter !== 'All' ? 'No hardware ports match the selected filter criteria.' : 'Add charging units to your stations to begin accepting drivers.'}
            </p>
            {!searchQuery && statusFilter === 'All' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-(--brand-blue) text-white text-[12px] font-bold rounded-xl shadow-xs hover:bg-(--brand-blue-deep) transition-all cursor-pointer inline-flex items-center gap-2"
              >
                + Provision First Hardware Port
              </button>
            )}
          </div>
        ) : (
          filteredChargers.map((charger, i) => {
            const st = charger.status || charger.statusDisplay || 'AVAILABLE';

            return (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                key={charger._id}
                className="bg-white border border-(--brand-border)/80 rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden"
              >
                {/* Top Status Gradient Bar */}
                <div className={`absolute top-0 left-0 right-0 h-[3px] opacity-80 ${
                  st === 'AVAILABLE' || st === 'Online' ? 'bg-gradient-to-r from-(--brand-blue) to-(--brand-green)' :
                  st === 'CHARGING' ? 'bg-gradient-to-r from-(--brand-blue) to-(--brand-blue-deep)' :
                  'bg-gradient-to-r from-[var(--ui-warning)] to-[var(--ui-warning)]/80'
                }`} />
                
                <div className="flex items-start justify-between mb-4 mt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-(--brand-blue)/10 to-(--brand-green)/10 border border-(--brand-border)/60 flex items-center justify-center text-(--brand-blue) group-hover:scale-105 transition-transform">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-[16px] font-extrabold text-(--brand-ink) tracking-tight truncate max-w-[140px] sm:max-w-[160px]">{charger.plugType || 'Standard'}</h3>
                      <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider truncate max-w-[140px]">{charger.stationName}</p>
                    </div>
                  </div>

                  {/* ACTION TOOLBAR: VIEW, EDIT, DELETE */}
                  <div className="flex items-center gap-1 bg-(--surface-soft)/60 p-1 rounded-xl border border-(--brand-border)/40">
                    <button 
                      onClick={() => setViewingCharger(charger)} 
                      className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-white hover:text-(--brand-blue) hover:shadow-xs transition-all cursor-pointer" 
                      title="View Hardware Specs"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <button 
                      onClick={() => setEditingCharger(charger)} 
                      className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-white hover:text-(--brand-blue) hover:shadow-xs transition-all cursor-pointer" 
                      title="Configure Hardware"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                    </button>
                    <button 
                      onClick={() => setDeletingChargerId(charger._id)} 
                      className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-(--ui-error)/10 hover:text-(--ui-error) transition-all cursor-pointer" 
                      title="Delete Hardware"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                </div>

                {/* Specs Box */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-(--surface-soft)/40 border border-(--brand-border)/50 flex flex-col items-center text-center">
                    <span className="text-[9px] font-extrabold text-(--brand-muted) uppercase tracking-wider mb-0.5">Capacity</span>
                    <span className="text-[14px] font-black text-(--brand-ink)">{charger.powerKW ?? '—'}<span className="text-[10px] opacity-80">{charger.powerKW ? ' kW' : ''}</span></span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-(--surface-soft)/40 border border-(--brand-border)/50 flex flex-col items-center text-center">
                    <span className="text-[9px] font-extrabold text-(--brand-muted) uppercase tracking-wider mb-0.5">Base Tariff</span>
                    <span className="text-[14px] font-black text-(--brand-ink)">{Number.isFinite(Number(charger.basePricePerKwh)) ? `LKR ${charger.basePricePerKwh}` : '—'}</span>
                  </div>
                </div>
                
                {/* Card Footer Info */}
                <div className="mt-auto pt-3 border-t border-(--brand-border)/50 flex items-center justify-between">
                  <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-md border flex items-center gap-1.5 ${
                    st === 'AVAILABLE' || st === 'Online' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                    st === 'CHARGING' ? 'bg-(--brand-blue)/10 text-(--brand-blue-deep) border-(--brand-blue)/20' :
                    'bg-[var(--ui-warning)]/10 text-[#d09d2e] border-[var(--ui-warning)]/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      st === 'AVAILABLE' || st === 'Online' ? 'bg-(--brand-green)' :
                      st === 'CHARGING' ? 'bg-(--brand-blue) animate-pulse' :
                      'bg-[var(--ui-warning)]'
                    }`} />
                    {st}
                  </span>

                  <button 
                    onClick={() => setViewingCharger(charger)}
                    className="text-[11px] font-bold text-(--brand-blue) hover:text-(--brand-blue-deep) flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    View Specs →
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── MODALS & TOASTS ── */}
      <AddChargerModal
        stations={stations}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={(msg) => {
          fetchStations();
          if (msg) setToastMessage({ msg, type: 'success' });
        }}
      />

      <ViewChargerModal
        charger={viewingCharger}
        isOpen={!!viewingCharger}
        onClose={() => setViewingCharger(null)}
        onEdit={(ch) => setEditingCharger(ch)}
      />

      <EditChargerModal
        charger={editingCharger}
        isOpen={!!editingCharger}
        onClose={() => setEditingCharger(null)}
        onSaved={(msg) => {
          fetchStations();
          if (msg) setToastMessage({ msg, type: 'success' });
        }}
      />

      <ConfirmModal
        isOpen={Boolean(deletingChargerId)}
        title="Permanently Delete Hardware"
        message="Are you sure you want to delete this hardware unit? This action cannot be undone."
        confirmText="Delete Hardware"
        isDanger={true}
        onClose={() => setDeletingChargerId(null)}
        onConfirm={() => deletingChargerId && executeDeleteCharger(deletingChargerId)}
      />

      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
