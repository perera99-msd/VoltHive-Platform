'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import ConfirmModal from '../common/ConfirmModal';

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
  onSaved: (msg?: string) => void;
};

export default function EditChargerModal({ charger, isOpen, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [plugType, setPlugType] = useState('CCS2');
  const [powerKW, setPowerKW] = useState(50);
  const [basePrice, setBasePrice] = useState(85);
  const [status, setStatus] = useState('AVAILABLE');
  const [loading, setLoading] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);

  useEffect(() => {
    if (charger) {
      setPlugType(charger.plugType || 'CCS2');
      setPowerKW(charger.powerKW || 50);
      setBasePrice(charger.basePricePerKwh || 85);
      setStatus(charger.status || 'AVAILABLE');
    }
  }, [charger]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!charger?._id || !user) return;
    setShowConfirmEdit(true);
  };

  const executeUpdateCharger = async () => {
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
        setShowConfirmEdit(false);
        onSaved('Hardware port configuration updated!');
        onClose();
      } else {
        const err = await res.json();
        setShowConfirmEdit(false);
        alert(`Failed to update charger: ${err.message || 'Error'}`);
      }
    } catch (err) {
      console.error(err);
      setShowConfirmEdit(false);
      alert('Network failure updating charger');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-(--surface-soft)/40 border border-(--brand-border)/80 rounded-xl text-[13px] text-(--brand-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) transition-all placeholder:text-(--brand-muted)/50";

  return (
    <>
      <AnimatePresence>
        {isOpen && charger && (
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
              className="bg-white rounded-[24px] max-w-lg w-full border border-(--brand-border)/80 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-(--brand-border)/60 flex justify-between items-center bg-(--surface-soft)/30">
                <div>
                  <h3 className="text-[18px] font-extrabold text-(--brand-ink) tracking-tight">Configure Hardware Port</h3>
                  <p className="text-[12px] text-(--brand-muted) font-medium mt-0.5">Modify connector type, kilowatt delivery, tariff, and operational state.</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 sm:px-8 overflow-y-auto">
                <form id="edit-charger-form" onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Connector Plug Standard</label>
                    <select value={plugType} onChange={e => setPlugType(e.target.value)} className={`${inputCls} cursor-pointer`}>
                      <option value="CCS2">CCS2 (European DC Fast)</option>
                      <option value="Type 2">Type 2 (AC Mennekes)</option>
                      <option value="CHAdeMO">CHAdeMO (Japanese DC)</option>
                      <option value="GB/T">GB/T (Chinese Standard)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Max Power (kW)</label>
                      <div className="relative">
                        <input required type="number" min="1" step="0.1" value={powerKW} onChange={e => setPowerKW(Number(e.target.value))} className={inputCls} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-(--brand-muted)">kW</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Base Tariff (LKR/kWh)</label>
                      <div className="relative">
                        <input required type="number" min="0" step="0.5" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} className={inputCls} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-(--brand-muted)">/kWh</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Hardware Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className={`${inputCls} cursor-pointer`}>
                      <option value="AVAILABLE">AVAILABLE (Online & Ready)</option>
                      <option value="CHARGING">CHARGING (Active Session)</option>
                      <option value="OFFLINE">OFFLINE (Disconnected)</option>
                      <option value="MAINTENANCE">MAINTENANCE (Servicing Required)</option>
                    </select>
                  </div>
                </form>
              </div>

              {/* Footer Actions */}
              <div className="px-6 sm:px-8 py-4 border-t border-(--brand-border)/60 bg-(--surface-soft)/30 flex flex-col sm:flex-row gap-3 justify-end">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-(--brand-border)/80 text-(--brand-ink) font-bold rounded-xl hover:bg-(--surface-soft)/50 transition-colors text-[13px] cursor-pointer w-full sm:w-auto">
                  Cancel
                </button>
                <button type="submit" form="edit-charger-form" disabled={loading} className="px-8 py-3 bg-(--brand-blue) text-white font-bold rounded-xl shadow-sm hover:bg-(--brand-blue-deep) hover:shadow-md transition-all text-[13px] cursor-pointer w-full sm:w-auto">
                  {loading ? 'Saving Changes...' : 'Save Port Config'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM EDIT MODAL ── */}
      <ConfirmModal
        isOpen={showConfirmEdit}
        title="Update Hardware Configuration"
        message="Are you sure you want to save modifications to this charger's power capacity, tariff, and operational status?"
        confirmText="Save Port Config"
        isDanger={false}
        isLoading={loading}
        onClose={() => setShowConfirmEdit(false)}
        onConfirm={executeUpdateCharger}
      />
    </>
  );
}
