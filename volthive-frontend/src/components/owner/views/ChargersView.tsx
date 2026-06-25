'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import EditChargerModal from '../EditChargerModal';
import ConfirmModal from '../../common/ConfirmModal';
import Toast from '../../common/Toast';

type Charger = {
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

type ChargerWithStation = Charger & { stationName: string };

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
      
      // If "Double", we practically generate 2 hardware records for the booking engine.
      const newChargers = [];
      const numToCreate = connectorCount === 'double' ? 2 : 1;
      
      for (let i = 0; i < numToCreate; i++) {
        newChargers.push({
          plugType: plug,
          powerKW: Number(powerKW),
          basePricePerKwh: Number(baseRate),
          status: 'AVAILABLE'
        });
      }

      const updatedChargers = [...(station.chargers || []), ...newChargers];

      const res = await fetch(apiUrl(`/api/stations/${selectedStationId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chargers: updatedChargers })
      });

      if (res.ok) {
        await fetchStations();
        setViewState('list');
        setConnectorType('CCS2'); setPowerKW('50'); setBaseRate('85'); setConnectorCount('single');
        setToastMessage({ msg: 'Hardware installed successfully!', type: 'success' });
      } else {
        setToastMessage({ msg: 'Failed to install hardware.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToastMessage({ msg: 'Network failure installing hardware.', type: 'error' });
    }
  };

  const inputCls = "w-full px-4 py-3.5 bg-background border border-(--brand-border) rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/20 focus:border-(--brand-blue) text-(--brand-ink)";

  if (loading) return <div className="p-10 font-bold text-(--brand-blue)">Loading Hardware Data...</div>;

  // Flatten all chargers from all stations for the list view
  const allChargers = (stations as Station[]).flatMap((s) =>
    (s.chargers || []).map((c) => ({ ...c, stationName: s.stationName }))
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-(--brand-ink) mb-1">My Chargers</h1>
          <p className="text-(--brand-muted) text-[15px] font-medium">Install and manage hardware capabilities at your stations.</p>
        </div>
        {viewState === 'list' && stations.length > 0 && (
          <button onClick={() => setViewState('add')} className="flex items-center gap-2 bg-gradient-to-r from-(--brand-blue) to-(--brand-green) text-white px-6 py-3.5 rounded-xl text-[15px] font-bold shadow-lg shadow-(--brand-blue)/25 hover:brightness-105 active:scale-95 transition-all">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Install Charger
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewState === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {stations.length === 0 ? (
              <div className="py-20 bg-(--brand-card)/50 border border-dashed border-(--brand-border) rounded-3xl text-center">
                <h3 className="text-lg font-bold text-(--brand-ink)">No Stations Available</h3>
                <p className="text-sm text-(--brand-muted) mt-1 max-w-sm mx-auto">You must create a Station Premise before you can install chargers.</p>
              </div>
            ) : allChargers.length === 0 ? (
              <div className="py-20 bg-(--brand-card)/50 border border-dashed border-(--brand-border) rounded-3xl text-center">
                <div className="w-16 h-16 bg-(--surface-soft) rounded-full flex items-center justify-center mx-auto mb-4 text-(--brand-blue)">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-(--brand-ink)">No Hardware Installed</h3>
                <p className="text-sm text-(--brand-muted) mt-1 max-w-sm mx-auto">Your network is empty. Install your first charging unit to start operations.</p>
              </div>
            ) : (
              <div className="bg-(--brand-card) rounded-[2rem] border border-(--brand-border) shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-(--surface-soft) border-b border-(--brand-border)">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest">Hardware / Type</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest">Location</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest">Power & Rate</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--brand-border)/60">
                    {allChargers.map((c: ChargerWithStation, i: number) => (
                      <tr key={i} className="hover:bg-(--surface-soft)/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-(--background) border border-(--brand-border) flex items-center justify-center font-black text-(--brand-blue) text-sm">
                              {String(i + 1).padStart(2, '0')}
                            </div>
                            <span className="font-bold text-(--brand-ink) text-[15px]">{c.plugType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-(--brand-muted)">{c.stationName}</td>
                        <td className="px-6 py-5">
                          <div className="text-[15px] font-bold text-(--brand-green)">{c.powerKW} kW</div>
                          <div className="text-[12px] font-semibold text-(--brand-muted)">Rs. {c.basePricePerKwh || 85}/kWh</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-(--brand-green)/10 text-(--brand-green) text-[10px] font-bold uppercase tracking-widest rounded-md border border-(--brand-green)/20">
                            {c.statusDisplay || c.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingCharger(c)} className="px-3 py-1 rounded-lg bg-(--surface-soft) text-(--brand-blue) hover:bg-(--brand-blue) hover:text-white font-bold text-xs cursor-pointer">Edit</button>
                            <button onClick={() => setDeletingChargerId((c as unknown as { _id?: string })._id || null)} className="px-3 py-1 rounded-lg bg-(--ui-error)/10 text-(--ui-error) hover:bg-(--ui-error) hover:text-white font-bold text-xs cursor-pointer">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {viewState === 'add' && (
          <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl bg-(--brand-card) rounded-[2rem] p-8 border border-(--brand-border) shadow-[0_20px_60px_-15px_rgba(9,32,52,0.1)] relative">
            <button onClick={() => setViewState('list')} className="absolute top-8 right-8 text-(--brand-muted) hover:text-(--brand-ink) cursor-pointer"><svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <h2 className="text-2xl font-bold text-(--brand-ink) mb-6">Install Hardware Unit</h2>
            
            <form onSubmit={handleAddCharger} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-2">Assign to Station Premise</label>
                <select value={selectedStationId} onChange={(e) => setSelectedStationId(e.target.value)} className={inputCls}>
                  <option value="">-- Choose Station --</option>
                  {stations.map((s) => <option key={s._id} value={s._id}>{s.stationName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-2">Connector Standard</label>
                  <select value={connectorType} onChange={(e) => setConnectorType(e.target.value)} className={inputCls}>
                    <option value="CCS2">CCS2 (DC Fast)</option>
                    <option value="Type 2">Type 2 (AC Mennekes)</option>
                    <option value="CHAdeMO">CHAdeMO (DC)</option>
                    <option value="GB/T">GB/T Standard</option>
                    <option value="Other">Custom Standard</option>
                  </select>
                </div>

                {connectorType === 'Other' && (
                  <div>
                    <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-2">Custom Plug Name</label>
                    <input type="text" required value={customConnector} onChange={(e) => setCustomConnector(e.target.value)} placeholder="e.g. Tesla NACS" className={inputCls} />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-2">Max Power Output (kW)</label>
                  <input type="number" required min="3" max="400" value={powerKW} onChange={(e) => setPowerKW(e.target.value)} className={inputCls} />
                </div>

                <div>
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-2">Base Tariff (Rs/kWh)</label>
                  <input type="number" required min="0" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} className={inputCls} />
                </div>

                <div>
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-2">Port Configuration</label>
                  <select value={connectorCount} onChange={(e) => setConnectorCount(e.target.value)} className={inputCls}>
                    <option value="single">Single Gun (1 Booking Port)</option>
                    <option value="double">Dual Gun (2 Sim Booking Ports)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 p-4 bg-(--ui-info)/10 border border-(--ui-info)/20 rounded-xl">
                <p className="text-[13px] text-(--brand-blue-deep) font-medium">
                  <strong>Note:</strong> Installing a &quot;Double&quot; connector setup will automatically generate 2 separate hardware records in your inventory, enabling dual simultaneous bookings for this physical unit.
                </p>
              </div>

              <button type="submit" className="w-full py-4 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white rounded-xl font-bold shadow-lg shadow-(--brand-blue)/30 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer">
                Finalize Installation
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <EditChargerModal
        charger={editingCharger as unknown as null}
        isOpen={!!editingCharger}
        onClose={() => setEditingCharger(null)}
        onSaved={fetchStations}
      />

      <ConfirmModal
        isOpen={Boolean(deletingChargerId)}
        title="Permanently Remove Hardware"
        message="Are you sure you want to permanently remove this charging unit from your network? All linked rate tariffs and connector booking slots will be purged."
        confirmText="Remove Hardware"
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