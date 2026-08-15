'use client';

import { motion, AnimatePresence } from 'framer-motion';

type Charger = {
  _id: string;
  plugType?: string;
  powerKW?: number;
  basePricePerKwh?: number;
  status?: string;
  statusDisplay?: string;
  stationId?: string;
  stationName?: string;
  features?: string[];
};

type Props = {
  charger: Charger | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (charger: Charger) => void;
};

export default function ViewChargerModal({ charger, isOpen, onClose, onEdit }: Props) {
  if (!charger) return null;

  const currentStatus = charger.status || charger.statusDisplay || 'AVAILABLE';
  const statusLabel = charger.statusDisplay || currentStatus;

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
            className="bg-white rounded-[24px] max-w-xl w-full border border-(--brand-border)/80 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-(--brand-border)/60 flex justify-between items-center bg-(--surface-soft)/30">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-(--brand-blue)/15 to-(--brand-green)/15 border border-(--brand-border)/80 flex items-center justify-center text-(--brand-blue) shadow-xs">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                </div>
                <div>
                  <h3 className="text-[20px] font-extrabold text-(--brand-ink) tracking-tight">{charger.plugType || 'Standard'} Port</h3>
                  <p className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider">Premise: {charger.stationName || 'Assigned Station'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              
              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-(--surface-soft)/40 rounded-2xl border border-(--brand-border)/60 flex flex-col justify-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-1">Power Output Capacity</span>
                  <span className="text-[18px] font-black text-(--brand-ink)">{charger.powerKW || 50} <span className="text-[11px] font-bold opacity-75">kW</span></span>
                </div>

                <div className="p-4 bg-(--surface-soft)/40 rounded-2xl border border-(--brand-border)/60 flex flex-col justify-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-1">Current Rate</span>
                  <span className="text-[18px] font-black text-(--brand-ink)">LKR {(charger as { currentRate?: number }).currentRate || charger.basePricePerKwh || 85} <span className="text-[10px] font-bold opacity-75">/ kWh</span></span>
                </div>
              </div>

              {/* Status & Premise Info */}
              <div className="p-4 bg-(--surface-soft)/30 rounded-2xl border border-(--brand-border)/60 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-(--brand-muted)">Operational Status</span>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md border flex items-center gap-1.5 ${
                    currentStatus === 'AVAILABLE' || currentStatus === 'Online' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                    currentStatus === 'CHARGING' ? 'bg-(--brand-blue)/10 text-(--brand-blue-deep) border-(--brand-blue)/20' :
                    currentStatus === 'OFFLINE' ? 'bg-(--ui-error)/10 text-(--ui-error) border-(--ui-error)/20' :
                    'bg-[var(--ui-warning)]/10 text-[#d09d2e] border-[var(--ui-warning)]/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      currentStatus === 'AVAILABLE' || currentStatus === 'Online' ? 'bg-(--brand-green)' :
                      currentStatus === 'CHARGING' ? 'bg-(--brand-blue) animate-pulse' :
                      currentStatus === 'OFFLINE' ? 'bg-(--ui-error)' :
                      'bg-[var(--ui-warning)]'
                    }`} />
                    {statusLabel}
                  </span>
                </div>

                <div className="pt-2 border-t border-(--brand-border)/50 flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-(--brand-muted)">Target Premise</span>
                  <span className="text-[12px] font-extrabold text-(--brand-ink)">{charger.stationName || 'N/A'}</span>
                </div>
              </div>

              {/* Features List */}
              <div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-2">Hardware Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-white border border-(--brand-border)/80 text-(--brand-ink) text-[11px] font-bold shadow-2xs">
                    ⚡ Fast DC Charging Protocol
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white border border-(--brand-border)/80 text-(--brand-ink) text-[11px] font-bold shadow-2xs">
                    📱 Smart App Remote Lock
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white border border-(--brand-border)/80 text-(--brand-ink) text-[11px] font-bold shadow-2xs">
                    📊 Real-Time Energy Telemetry
                  </span>
                </div>
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
                  onEdit(charger);
                }}
                className="px-6 py-2.5 bg-(--brand-blue) text-white font-bold rounded-xl shadow-xs hover:bg-(--brand-blue-deep) transition-all text-[12px] cursor-pointer flex items-center gap-2"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                Edit Config Specs
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
