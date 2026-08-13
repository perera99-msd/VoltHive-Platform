'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import ConfirmModal from '../common/ConfirmModal';

type Station = {
  _id: string;
  stationName: string;
};

type Props = {
  stations: Station[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: (msg?: string) => void;
};

export default function AddChargerModal({ stations, isOpen, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [selectedStationId, setSelectedStationId] = useState('');
  const [connectorType, setConnectorType] = useState('CCS2');
  const [customConnector, setCustomConnector] = useState('');
  const [powerKW, setPowerKW] = useState('50');
  const [baseRate, setBaseRate] = useState('85');
  const [loading, setLoading] = useState(false);
  const [showConfirmAdd, setShowConfirmAdd] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId && stations.length > 0) {
      setSelectedStationId(stations[0]._id);
    }
    setShowConfirmAdd(true);
  };

  const executeAddCharger = async () => {
    if (!user) return;
    const targetStationId = selectedStationId || (stations.length > 0 ? stations[0]._id : '');
    if (!targetStationId) {
      alert('Please select a station premise');
      return;
    }

    setLoading(true);

    try {
      const token = await user.getIdToken();

      const plug = connectorType === 'Other' ? customConnector : connectorType;
      const payload = {
        stationId: targetStationId,
        plugType: plug,
        powerKW: Number(powerKW),
        basePricePerKwh: Number(baseRate)
      };

      const res = await fetch(apiUrl('/api/chargers'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowConfirmAdd(false);
        setConnectorType('CCS2');
        setCustomConnector('');
        setPowerKW('50');
        setBaseRate('85');
        onSaved('Hardware unit provisioned successfully!');
        onClose();
      } else {
        const err = await res.json();
        setShowConfirmAdd(false);
        alert(`Error: ${err.message || 'Failed to provision hardware'}`);
      }
    } catch (error) {
      console.error(error);
      setShowConfirmAdd(false);
      alert('Network failure provisioning hardware');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-(--surface-soft)/40 border border-(--brand-border)/80 rounded-xl text-[13px] text-(--brand-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) transition-all placeholder:text-(--brand-muted)/50";

  return (
    <>
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
              className="bg-white rounded-[24px] max-w-xl w-full border border-(--brand-border)/80 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-(--brand-border)/60 flex justify-between items-center bg-(--surface-soft)/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue)">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </div>
                  <div>
                    <h3 className="text-[18px] font-extrabold text-(--brand-ink) tracking-tight">Provision Hardware Unit</h3>
                    <p className="text-[12px] text-(--brand-muted) font-medium mt-0.5">Add a new charging port to an existing premise.</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 sm:px-8 overflow-y-auto">
                <form id="add-charger-form" onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Select Target Premise</label>
                    <select required value={selectedStationId || (stations[0]?._id || '')} onChange={e => setSelectedStationId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                      {stations.map(s => <option key={s._id} value={s._id}>{s.stationName}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Plug Standard</label>
                      <select required value={connectorType} onChange={e => setConnectorType(e.target.value)} className={`${inputCls} cursor-pointer`}>
                        <option value="CCS2">CCS2 (DC Fast)</option>
                        <option value="CHAdeMO">CHAdeMO (DC Fast)</option>
                        <option value="Type 2">Type 2 (AC)</option>
                        <option value="GB/T">GB/T (Chinese Standard)</option>
                        <option value="Other">Other Custom Plug</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Custom Identifier</label>
                      <input type="text" placeholder="e.g. NACS" disabled={connectorType !== 'Other'} value={customConnector} onChange={e => setCustomConnector(e.target.value)} className={`${inputCls} ${connectorType !== 'Other' ? 'bg-(--surface-soft)/40 opacity-50 cursor-not-allowed' : ''}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </form>
              </div>

              {/* Footer Actions */}
              <div className="px-6 sm:px-8 py-4 border-t border-(--brand-border)/60 bg-(--surface-soft)/30 flex flex-col sm:flex-row gap-3 justify-end">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-(--brand-border)/80 text-(--brand-ink) font-bold rounded-xl hover:bg-(--surface-soft)/50 transition-colors text-[13px] cursor-pointer w-full sm:w-auto">
                  Cancel
                </button>
                <button type="submit" form="add-charger-form" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-(--brand-blue) to-(--brand-green) text-white font-bold rounded-xl shadow-sm hover:brightness-105 transition-all text-[13px] cursor-pointer w-full sm:w-auto">
                  {loading ? 'Provisioning...' : 'Provision Hardware'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM ADD MODAL ── */}
      <ConfirmModal
        isOpen={showConfirmAdd}
        title="Provision Hardware Unit"
        message="Are you sure you want to add this new charging port to the selected premise?"
        confirmText="Provision Hardware"
        isDanger={false}
        isLoading={loading}
        onClose={() => setShowConfirmAdd(false)}
        onConfirm={executeAddCharger}
      />
    </>
  );
}
