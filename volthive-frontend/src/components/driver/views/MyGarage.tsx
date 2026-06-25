'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import ConfirmModal from '../../common/ConfirmModal';
import Toast from '../../common/Toast';

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: string;
  batteryKWh: number;
  connector: string;
  maxKW: number;
  isPrimary: boolean;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  vehicles?: Vehicle[];
}

export default function MyGarage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' } | null>(null);

  // Form State
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2024');
  const [batteryKWh, setBatteryKWh] = useState('60');
  const [connector, setConnector] = useState('CCS2');
  const [maxKW, setMaxKW] = useState('150');
  const [isPrimary, setIsPrimary] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl('/api/users/profile'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to load garage:', err);
      setError('Could not load vehicle profiles.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl('/api/users/vehicles'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          make,
          model,
          year,
          batteryKWh: Number(batteryKWh),
          connector,
          maxKW: Number(maxKW),
          isPrimary
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setShowModal(false);
        setMake(''); setModel(''); setYear('2024'); setBatteryKWh('60'); setMaxKW('150'); setIsPrimary(false);
        setToastMessage({ msg: 'EV profile saved to garage!', type: 'success' });
      } else {
        setError('Failed to add vehicle');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const executeDeleteVehicle = async (vehicleId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/users/vehicles/${vehicleId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletingVehicleId(null);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setToastMessage({ msg: 'Vehicle removed from garage.', type: 'success' });
      } else {
        setToastMessage({ msg: 'Failed to remove vehicle.', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      setDeletingVehicleId(null);
      setToastMessage({ msg: 'Network error deleting vehicle.', type: 'error' });
    }
  };

  const handleSetDefault = async (vehicleId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/users/vehicles/${vehicleId}/primary`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to set primary:', err);
    }
  };

  const vehicles = profile?.vehicles || [];

  return (
    <section className="space-y-6 relative overflow-hidden">
      <div className="absolute -top-24 right-0 w-72 h-72 rounded-full bg-(--accent-blue)/16 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 left-0 w-72 h-72 rounded-full bg-(--accent-green)/14 blur-[120px] pointer-events-none" />

      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-4xl border border-(--brand-card)/70 bg-(--brand-card)/80 backdrop-blur-2xl p-6 md:p-7 shadow-[0_26px_70px_-46px_rgba(9,32,52,0.55)] flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-(--brand-muted)">Vehicle Profiles</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-(--brand-ink) mt-1">My Garage</h1>
          <p className="text-(--brand-muted) text-sm mt-1 font-medium">Keep your EV details updated for accurate compatibility, route confidence, and cleaner charging recommendations.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition-all self-start md:self-auto shrink-0"
        >
          ＋ Add EV
        </button>
      </motion.header>

      {error && (
        <div className="p-4 rounded-2xl bg-(--ui-error)/10 border border-(--ui-error)/20 text-(--ui-error) text-sm font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 animate-pulse">
          <div className="rounded-4xl bg-(--surface-soft) h-72 w-full" />
          <div className="rounded-4xl bg-(--surface-soft) h-72 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {vehicles.map((v, i) => (
            <motion.article
              key={v._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-4xl border ${v.isPrimary ? 'border-(--brand-blue) bg-(--brand-card)/90 shadow-[0_20px_45px_-30px_rgba(74,144,164,0.45)]' : 'border-(--brand-card)/70 bg-(--brand-card)/70'} backdrop-blur-2xl p-6 relative`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] ${v.isPrimary ? 'bg-(--accent-blue)/18 text-(--brand-blue)' : 'bg-(--surface-soft) text-(--brand-muted)'}`}>
                  {v.isPrimary ? '★ Primary Vehicle' : 'Secondary EV'}
                </span>
                <button
                  onClick={() => setDeletingVehicleId(v._id)}
                  className="text-(--brand-muted) hover:text-(--ui-error) p-1 text-sm transition-colors cursor-pointer"
                  title="Remove vehicle"
                >
                  ✕ Remove
                </button>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className="w-20 h-20 rounded-3xl border border-(--brand-border) bg-(--background) flex items-center justify-center shrink-0">
                  <Image src="/icons/car.png" alt={v.model} width={48} height={48} className="w-12 h-12 object-contain opacity-90" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-(--brand-ink)">{v.make} {v.model}</h2>
                  <p className="text-sm text-(--brand-muted)">{v.year} · {v.batteryKWh}kWh Battery</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-(--brand-border) bg-(--background)/75 p-3.5">
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-(--brand-muted)">Connector</p>
                  <p className="text-sm font-semibold text-(--brand-ink) mt-1">{v.connector}</p>
                </div>
                <div className="rounded-2xl border border-(--brand-border) bg-(--background)/75 p-3.5">
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-(--brand-muted)">Max Power</p>
                  <p className="text-sm font-semibold text-(--brand-ink) mt-1">Up to {v.maxKW}kW</p>
                </div>
              </div>

              {!v.isPrimary && (
                <div className="mt-5 pt-4 border-t border-(--brand-border)/50 flex justify-end">
                  <button
                    onClick={() => handleSetDefault(v._id)}
                    className="px-4 py-2 rounded-lg bg-(--background) border border-(--brand-border) text-(--brand-ink) text-xs font-bold hover:border-(--brand-blue) transition-colors cursor-pointer"
                  >
                    Set as Primary
                  </button>
                </div>
              )}
            </motion.article>
          ))}

          {/* Add Another Card */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-4xl border border-dashed border-(--brand-border) bg-(--brand-card)/40 backdrop-blur-xl p-7 flex flex-col justify-center items-center text-center min-h-[280px] hover:border-(--brand-blue) transition-colors cursor-pointer group"
            onClick={() => setShowModal(true)}
          >
            <div className="w-14 h-14 rounded-2xl border border-(--brand-border) bg-(--background) flex items-center justify-center text-(--brand-muted) group-hover:scale-110 group-hover:text-(--brand-blue) transition-all">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-(--brand-ink) group-hover:text-(--brand-blue) transition-colors">Add Another Vehicle</h3>
            <p className="text-xs text-(--brand-muted) mt-1 max-w-xs">Include more vehicles to auto-filter map stations by connector compatibility.</p>
          </motion.article>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-(--brand-card) border border-(--brand-border) rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-(--brand-ink)">Add EV to Garage</h3>
                <button onClick={() => setShowModal(false)} className="text-(--brand-muted) hover:text-(--brand-ink) cursor-pointer">✕</button>
              </div>

              {error && <div className="mb-4 p-3 bg-(--ui-error)/10 text-(--ui-error) text-xs rounded-xl font-semibold">{error}</div>}

              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-(--brand-muted) mb-1">Make / Brand</label>
                    <input type="text" required placeholder="e.g. Tesla" value={make} onChange={e => setMake(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card)" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-(--brand-muted) mb-1">Model</label>
                    <input type="text" required placeholder="e.g. Model 3" value={model} onChange={e => setModel(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card)" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-(--brand-muted) mb-1">Year</label>
                    <input type="number" required placeholder="2024" value={year} onChange={e => setYear(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card)" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-(--brand-muted) mb-1">Battery (kWh)</label>
                    <input type="number" required placeholder="60" value={batteryKWh} onChange={e => setBatteryKWh(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card)" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-(--brand-muted) mb-1">Max DC (kW)</label>
                    <input type="number" required placeholder="150" value={maxKW} onChange={e => setMaxKW(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card)" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-(--brand-muted) mb-1">Plug Type</label>
                  <select value={connector} onChange={e => setConnector(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-(--brand-border) text-sm font-semibold bg-(--brand-card)">
                    <option value="CCS2 Fast">CCS2 Fast</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                    <option value="Type 2 AC">Type 2 AC</option>
                    <option value="Tesla NACS">Tesla NACS</option>
                    <option value="GB/T">GB/T</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="rounded border-(--brand-border) w-4 h-4 text-(--brand-blue)" />
                  <span className="text-xs font-bold text-(--brand-ink)">Set as Primary Charging Vehicle</span>
                </label>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-(--brand-border)">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl bg-(--surface-soft) text-(--brand-ink) text-sm font-bold cursor-pointer hover:bg-(--surface-tint)">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-sm font-bold shadow-md hover:brightness-105 cursor-pointer">
                    {submitting ? 'Adding...' : 'Save EV'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={Boolean(deletingVehicleId)}
        title="Remove Vehicle"
        message="Are you sure you want to remove this vehicle from your garage profile? All historical charging preferences for this EV will be purged."
        confirmText="Remove Vehicle"
        isDanger={true}
        onClose={() => setDeletingVehicleId(null)}
        onConfirm={() => deletingVehicleId && executeDeleteVehicle(deletingVehicleId)}
      />

      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </section>
  );
}