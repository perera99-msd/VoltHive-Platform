'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import EditChargerModal from '../EditChargerModal';
import ConfirmModal from '../../common/ConfirmModal';
import Toast from '../../common/Toast';

type Charger = {
  _id: string;
  plugType?: string;
  powerKW?: number;
  basePricePerKwh?: number;
  status?: string;
  statusDisplay?: string;
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
  const [viewState, setViewState] = useState<'list' | 'add'>('list');
  const [editingCharger, setEditingCharger] = useState<unknown>(null);
  const [deletingChargerId, setDeletingChargerId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' } | null>(null);

  // New Charger Form State
  const [selectedStationId, setSelectedStationId] = useState('');
  const [connectorType, setConnectorType] = useState('CCS2');
  const [customConnector, setCustomConnector] = useState('');
  const [powerKW, setPowerKW] = useState('50');
  const [connectorCount, setConnectorCount] = useState('single'); // single or double
  const [baseRate, setBaseRate] = useState('85');

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

  const handleAddCharger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId) {
      setToastMessage({ msg: 'Please select a station premise first.', type: 'error' });
      return;
    }

    try {
      const token = await user?.getIdToken();
      const station = stations.find(s => s._id === selectedStationId);
      if (!station) return;

      const plug = connectorType === 'Other' ? customConnector : connectorType;
      const payload = {
        stationId: selectedStationId,
        stationName: station.stationName,
        plugType: plug,
        powerKW: Number(powerKW),
        basePricePerKwh: Number(baseRate),
        features: connectorCount === 'double' ? ['Dual Connectors', 'LCD Display'] : ['LCD Display'],
        statusDisplay: 'Online'
      };

      const res = await fetch(apiUrl('/api/chargers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchStations();
        setViewState('list');
        setConnectorType('CCS2'); setCustomConnector(''); setPowerKW('50'); setConnectorCount('single'); setBaseRate('85');
        setToastMessage({ msg: 'Hardware unit added successfully.', type: 'success' });
      } else {
        setToastMessage({ msg: 'Failed to provision hardware.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToastMessage({ msg: 'Network failure provisioning hardware.', type: 'error' });
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

  // Flatten chargers for list view
  const allChargers = stations.flatMap(s => (s.chargers || []).map(c => ({ ...c, stationName: s.stationName })));

  return (
    <div className="w-full relative font-sans pb-16">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[24px] font-extrabold tracking-tight text-(--brand-ink)">Hardware Fleet</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--brand-blue)/10 text-(--brand-blue) text-[9px] font-extrabold uppercase tracking-[0.12em] border border-(--brand-blue)/20">
              {allChargers.length} Active Ports
            </span>
          </div>
          <p className="text-[12px] text-(--brand-muted) font-medium">Manage charging hardware, set base rates, and monitor statuses.</p>
        </div>

        {viewState === 'list' && (
          <button
            onClick={() => {
              if (stations.length > 0) setSelectedStationId(stations[0]._id);
              setViewState('add');
            }}
            className="flex items-center gap-2 bg-(--brand-blue) text-white px-5 py-2.5 rounded-xl text-[12px] font-bold shadow-sm hover:bg-(--brand-blue-deep) hover:shadow-md transition-all cursor-pointer"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Hardware
          </button>
        )}
      </div>

      {/* ── VIEWS ── */}
      <AnimatePresence mode="wait">
        {viewState === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {allChargers.length === 0 ? (
              <div className="py-16 bg-(--surface-soft)/30 border-2 border-dashed border-(--brand-border)/80 rounded-2xl text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4a90a4] to-[#6cb567] flex items-center justify-center mx-auto mb-4">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                </div>
                <h3 className="text-[14px] font-extrabold text-(--brand-ink)">No Hardware Configured</h3>
                <p className="text-[12px] text-(--brand-muted) mt-1 max-w-sm mx-auto font-medium">Add charging units to your stations to begin accepting drivers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allChargers.map((charger, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    key={charger._id}
                    className="bg-white border border-(--brand-border)/80 rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex flex-col group relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-[3px] opacity-80 ${charger.statusDisplay === 'Online' ? 'bg-gradient-to-r from-(--brand-blue) to-(--brand-green)' : 'bg-gradient-to-r from-[#f4b740] to-[#f4b740]/80'}`} />
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-(--surface-soft)/60 border border-(--brand-border)/60 flex items-center justify-center text-(--brand-blue) group-hover:scale-105 transition-transform">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${charger.statusDisplay === 'Online' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' : 'bg-[#f4b740]/10 text-[#d09d2e] border-[#f4b740]/20'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${charger.statusDisplay === 'Online' ? 'bg-(--brand-green)' : 'bg-[#f4b740]'}`} />
                          {charger.statusDisplay || 'Offline'}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditingCharger(charger)} className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-(--surface-soft) hover:text-(--brand-blue) transition-colors cursor-pointer" title="Edit Configuration">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                        </button>
                        <button onClick={() => setDeletingChargerId(charger._id)} className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-(--ui-error)/10 hover:text-(--ui-error) transition-colors cursor-pointer" title="Delete Hardware">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </div>

                    <h3 className="text-[16px] font-bold text-(--brand-ink) mb-1 truncate">{charger.plugType} Port</h3>
                    <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-[0.14em] mb-4 truncate">{charger.stationName}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-(--surface-soft)/40 border border-(--brand-border)/50 flex flex-col items-center text-center">
                        <span className="text-[9px] font-bold text-(--brand-muted) uppercase tracking-wider mb-0.5">Capacity</span>
                        <span className="text-[14px] font-black text-(--brand-ink)">{charger.powerKW}<span className="text-[10px] opacity-80">kW</span></span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-(--surface-soft)/40 border border-(--brand-border)/50 flex flex-col items-center text-center">
                        <span className="text-[9px] font-bold text-(--brand-muted) uppercase tracking-wider mb-0.5">Base Rate</span>
                        <span className="text-[14px] font-black text-(--brand-ink)">Rs.{charger.basePricePerKwh}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {viewState === 'add' && (
          <motion.div key="add" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-(--brand-border)/80 shadow-xl relative">
            <button onClick={() => setViewState('list')} className="absolute top-6 right-6 p-2 rounded-lg text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </div>
              <div>
                <h2 className="text-[18px] font-extrabold text-(--brand-ink) tracking-tight">Provision Hardware Unit</h2>
                <p className="text-[11px] text-(--brand-muted) font-medium">Add a new charging port to an existing premise.</p>
              </div>
            </div>

            <form onSubmit={handleAddCharger} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Select Target Premise</label>
                  <select required value={selectedStationId} onChange={e => setSelectedStationId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="" disabled>Select Premise...</option>
                    {stations.map(s => <option key={s._id} value={s._id}>{s.stationName}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Plug / Connector Type</label>
                  <select required value={connectorType} onChange={e => setConnectorType(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="CCS2">CCS2 (DC Fast)</option>
                    <option value="CHAdeMO">CHAdeMO (DC Fast)</option>
                    <option value="Type2">Type 2 (AC)</option>
                    <option value="GB/T">GB/T</option>
                    <option value="Other">Other...</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Custom Identifier</label>
                  <input type="text" placeholder="e.g. NACS" disabled={connectorType !== 'Other'} value={customConnector} onChange={e => setCustomConnector(e.target.value)} className={`${inputCls} ${connectorType !== 'Other' ? 'bg-(--surface-soft)/40 opacity-50 cursor-not-allowed' : ''}`} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Power Output (kW)</label>
                  <div className="relative">
                    <input required type="number" min="1" step="0.1" value={powerKW} onChange={e => setPowerKW(e.target.value)} className={inputCls} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-(--brand-muted)">kW</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Base Energy Rate (LKR)</label>
                  <div className="relative">
                    <input required type="number" min="0" step="0.5" value={baseRate} onChange={e => setBaseRate(e.target.value)} className={inputCls} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-(--brand-muted)">/kWh</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3.5 bg-(--brand-blue) text-white rounded-xl text-[13px] font-bold shadow-sm hover:bg-(--brand-blue-deep) hover:shadow-md transition-all cursor-pointer">
                  Provision Hardware
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <EditChargerModal
        charger={editingCharger as any}
        isOpen={!!editingCharger}
        onClose={() => setEditingCharger(null)}
        onSaved={fetchStations}
      />

      <ConfirmModal
        isOpen={Boolean(deletingChargerId)}
        title="Permanently Delete Hardware"
        message="Are you sure you want to delete this hardware unit? This cannot be undone."
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
