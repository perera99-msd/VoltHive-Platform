'use client';

import { motion, AnimatePresence } from 'framer-motion';

type Booking = {
  _id: string;
  customerName?: string;
  customerPhone?: string;
  driver?: { name?: string; email?: string; telephone?: string; phone?: string };
  station?: { _id?: string; stationName?: string; address?: string };
  chargerId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  lockedPricePerKwh: number;
  totalCostLKR?: number;
  paymentStatus?: string;
  energyConsumedKWh?: number;
  createdAt?: string;
};

type Props = {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ViewBookingModal({ booking, isOpen, onClose }: Props) {
  if (!booking) return null;

  const cName = (booking.customerName && booking.customerName.trim() !== '' && booking.customerName !== 'Walk-in Customer')
    ? booking.customerName
    : (booking.driver?.name || booking.customerName || 'Walk-in Customer');

  const cPhone = (booking.customerPhone && booking.customerPhone.trim() !== '' && booking.customerPhone !== 'No Phone')
    ? booking.customerPhone
    : (booking.driver?.telephone || booking.driver?.phone || booking.customerPhone || 'No Phone');
  const cEmail = booking.driver?.email || 'N/A';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-xl bg-white/95 backdrop-blur-3xl rounded-3xl border border-[#e0e5e3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-[#e0e5e3] flex justify-between items-center bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-(--brand-blue)/15 to-(--brand-green)/15 border border-[#e0e5e3] flex items-center justify-center text-(--brand-blue-deep) shadow-2xs">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12h5.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H7.5a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 017.5 4.5h5.25m-6 3.75h4.5m-4.5 3.75h4.5m-4.5 3.75h4.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-(--brand-ink) tracking-tight">POS Reservation Specs</h3>
                  <p className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-wider">Ref: {booking._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border flex items-center gap-1.5 ${
                  booking.status === 'Pending' ? 'bg-amber-500/10 text-amber-700 border-amber-300' : 
                  booking.status === 'Confirmed' ? 'bg-(--brand-blue)/10 text-(--brand-blue-deep) border-(--brand-blue)/20' : 
                  booking.status === 'Active_Charging' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                  booking.status === 'Completed' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                  'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    booking.status === 'Pending' ? 'bg-amber-500' : 
                    booking.status === 'Confirmed' ? 'bg-(--brand-blue)' : 
                    booking.status === 'Active_Charging' ? 'bg-(--brand-green) animate-pulse' :
                    booking.status === 'Completed' ? 'bg-(--brand-green)' :
                    'bg-rose-500'
                  }`} />
                  <span>{booking.status.replace('_', ' ')}</span>
                </span>

                <button 
                  onClick={onClose} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--surface-soft) text-(--brand-muted) hover:text-(--brand-ink) border border-[#e0e5e3] transition-colors cursor-pointer"
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:px-8 overflow-y-auto space-y-4 [&::-webkit-scrollbar]:hidden">
              
              {/* Customer Contact Box */}
              <div className="p-4 bg-(--surface-soft)/40 rounded-2xl border border-[#e0e5e3] space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted)">Driver Contact Information</h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-(--brand-ink)">{cName}</h3>
                    <p className="text-[11px] text-(--brand-muted) font-medium">✉️ {cEmail}</p>
                  </div>
                  {cPhone !== 'No phone provided' && (
                    <a
                      href={`tel:${cPhone}`}
                      className="px-3.5 py-1.5 bg-white border border-[#e0e5e3] text-(--brand-blue) hover:text-(--brand-blue-deep) font-black text-xs rounded-xl shadow-2xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      📞 {cPhone}
                    </a>
                  )}
                </div>
              </div>

              {/* Station & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white rounded-2xl border border-[#e0e5e3] shadow-2xs flex flex-col justify-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-(--brand-muted) mb-1">Target Station Premise</span>
                  <span className="text-xs font-black text-(--brand-ink) truncate">{booking.station?.stationName || 'VoltHive Station'}</span>
                  <span className="text-[10px] text-(--brand-muted) truncate">{booking.station?.address}</span>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-[#e0e5e3] shadow-2xs flex flex-col justify-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-(--brand-muted) mb-1">Reserved Time Slot</span>
                  <span className="text-xs font-black text-(--brand-ink)">{booking.startTime} - {booking.endTime}</span>
                  <span className="text-[10px] text-(--brand-muted) font-semibold">{booking.date}</span>
                </div>
              </div>

              {/* Agreed Price (locked at booking) */}
              <div className="p-4 bg-white rounded-2xl border border-[#e0e5e3] shadow-2xs space-y-2.5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-(--brand-ink) border-b border-[#e0e5e3] pb-2">
                  Agreed Price
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-(--brand-muted) font-medium">
                    <span>Rate Locked at Booking</span>
                    <span className="font-black text-(--brand-ink)">LKR {booking.lockedPricePerKwh} / kWh</span>
                  </div>
                  <div className="pt-2 border-t border-[#e0e5e3] text-(--brand-muted) font-medium">
                    The final amount is settled manually with the driver using this agreed rate.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 py-4 bg-white border-t border-[#e0e5e3] flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 rounded-xl border border-[#e0e5e3] text-xs font-bold text-(--brand-muted) hover:bg-(--surface-soft) transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
