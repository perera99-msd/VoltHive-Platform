'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

type Charger = {
  _id?: string;
  plugType?: string;
  powerKW?: number;
  basePricePerKwh?: number;
  status?: string;
};

type Props = {
  charger: Charger | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditChargerModal({ charger, isOpen, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [plugType, setPlugType] = useState('CCS2');
  const [powerKW, setPowerKW] = useState(50);
  const [basePrice, setBasePrice] = useState(85);
  const [status, setStatus] = useState('AVAILABLE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (charger) {
      setPlugType(charger.plugType || 'CCS2');
      setPowerKW(charger.powerKW || 50);
      setBasePrice(charger.basePricePerKwh || 85);
      setStatus(charger.status || 'AVAILABLE');
    }
  }, [charger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charger?._id || !user) return;
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/chargers/${charger._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plugType,
          powerKW: Number(powerKW),
          basePricePerKwh: Number(basePrice),
          status
        })
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const err = await res.json();
        alert(`Failed to update charger: ${err.message || 'Error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network failure');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-background border border-(--brand-border) rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/20 focus:border-(--brand-blue) text-(--brand-ink)";

  return (
    <AnimatePresence>
      {isOpen && charger && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-(--brand-ink)/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="bg-(--brand-card) rounded-3xl p-6 md:p-8 max-w-lg w-full border border-(--brand-border) shadow-2xl relative text-(--brand-ink)"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-(--brand-muted) hover:text-(--brand-ink)">
              ✕
            </button>
            <h3 className="text-xl font-bold mb-1">Configure Hardware Port</h3>
            <p className="text-xs text-(--brand-muted) mb-6">Modify connector type, maximum kilowatt delivery, tariff, and operational state.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1">Connector Plug Standard</label>
                <select value={plugType} onChange={e => setPlugType(e.target.value)} className={inputCls}>
                  <option value="CCS2">CCS2 (European DC Fast)</option>
                  <option value="Type 2">Type 2 (AC Mennekes)</option>
                  <option value="CHAdeMO">CHAdeMO (Japanese DC)</option>
                  <option value="GB/T">GB/T (Chinese Standard)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1">Max Power (kW)</label>
                  <input required type="number" value={powerKW} onChange={e => setPowerKW(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1">Base Tariff (Rs/kWh)</label>
                  <input required type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1">Hardware Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                  <option value="AVAILABLE">AVAILABLE (Online & Ready)</option>
                  <option value="CHARGING">CHARGING (Active Session)</option>
                  <option value="OFFLINE">OFFLINE (Disconnected)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Servicing Required)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-(--brand-border)">
                <button type="button" onClick={onClose} className="flex-1 py-3 bg-(--surface-soft) text-(--brand-ink) font-bold rounded-xl hover:bg-(--surface-tint) transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-(--brand-blue) text-white font-bold rounded-xl shadow-md hover:bg-(--brand-blue-deep) transition-all text-sm cursor-pointer">
                  {loading ? 'Updating...' : 'Save Port Config'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
