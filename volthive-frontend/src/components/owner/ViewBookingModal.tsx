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
  onEdit: (booking: Booking) => void;
};

export default function ViewBookingModal({ booking, isOpen, onClose, onEdit }: Props) {
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-(--brand-ink)/70 backdrop-blur-sm font-sans"
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
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12h5.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H7.5a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 017.5 4.5h5.25m-6 3.75h4.5m-4.5 3.75h4.5m-4.5 3.75h4.5" /></svg>
                </div>
                <div>
                  <h3 className="text-[20px] font-extrabold text-(--brand-ink) tracking-tight">POS Reservation Details</h3>
                  <p className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider">ID: {booking._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md border flex items-center gap-1.5 ${
                  booking.status === 'Pending' ? 'bg-[var(--ui-warning)]/10 text-[#d09d2e] border-[var(--ui-warning)]/20' : 
                  booking.status === 'Confirmed' ? 'bg-(--brand-blue)/10 text-(--brand-blue-deep) border-(--brand-blue)/20' : 
                  booking.status === 'Active_Charging' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                  booking.status === 'Completed' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                  'bg-(--ui-error)/10 text-(--ui-error) border-(--ui-error)/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    booking.status === 'Pending' ? 'bg-[var(--ui-warning)]' : 
                    booking.status === 'Confirmed' ? 'bg-(--brand-blue)' : 
                    booking.status === 'Active_Charging' ? 'bg-(--brand-green) animate-pulse' :
                    booking.status === 'Completed' ? 'bg-(--brand-green)' :
                    'bg-(--ui-error)'
                  }`} />
                  {booking.status.replace('_', ' ')}
                </span>

                <button onClick={onClose} className="p-2 rounded-xl text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              
              {/* Customer Contact Box */}
              <div className="p-4 bg-(--surface-soft)/40 rounded-2xl border border-(--brand-border)/60 space-y-2">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-(--brand-muted)">Driver Contact Info</h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-[16px] font-black text-(--brand-ink)">{cName}</h3>
                    <p className="text-[11px] text-(--brand-muted) font-medium">✉️ {cEmail}</p>
                  </div>
                  {cPhone !== 'No phone provided' && (
                    <a
                      href={`tel:${cPhone}`}
                      className="px-4 py-2 bg-white border border-(--brand-border)/80 text-(--brand-blue) hover:text-(--brand-blue-deep) font-extrabold text-[12px] rounded-xl shadow-2xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      📞 {cPhone}
                    </a>
                  )}
                </div>
              </div>

              {/* Station & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-(--surface-soft)/30 rounded-xl border border-(--brand-border)/60 flex flex-col justify-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-1">Target Station Premise</span>
                  <span className="text-[13px] font-extrabold text-(--brand-ink) truncate">{booking.station?.stationName || 'VoltHive Station'}</span>
                  <span className="text-[10px] text-(--brand-muted) truncate">{booking.station?.address}</span>
                </div>

                <div className="p-3.5 bg-(--surface-soft)/30 rounded-xl border border-(--brand-border)/60 flex flex-col justify-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-(--brand-muted) mb-1">Reserved Time Slot</span>
                  <span className="text-[13px] font-black text-(--brand-ink)">{booking.startTime} - {booking.endTime}</span>
                  <span className="text-[10px] text-(--brand-muted) font-bold">{booking.date}</span>
                </div>
              </div>

              {/* POS Financial & Billing Breakdown */}
              <div className="p-4 bg-white rounded-2xl border border-(--brand-border)/80 shadow-xs space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-(--brand-ink) border-b border-(--brand-border)/50 pb-2">
                  POS Billing Breakdown
                </h4>

                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between items-center text-(--brand-muted) font-medium">
                    <span>AI Locked Tariff Rate</span>
                    <span className="font-bold text-(--brand-ink)">LKR {booking.lockedPricePerKwh} / kWh</span>
                  </div>

                  <div className="flex justify-between items-center text-(--brand-muted) font-medium">
                    <span>Delivered Energy Volume</span>
                    <span className="font-bold text-(--brand-ink)">{booking.energyConsumedKWh || 0} kWh</span>
                  </div>

                  <div className="flex justify-between items-center text-(--brand-muted) font-medium">
                    <span>Payment Settlement Status</span>
                    <span className={`font-bold ${booking.paymentStatus === 'Done' ? 'text-(--brand-green-deep)' : 'text-[#d09d2e]'}`}>
                      {booking.paymentStatus ? `Status: ${booking.paymentStatus}` : 'Pending Checkout'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-(--brand-border)/60 flex justify-between items-center text-[14px]">
                    <span className="font-extrabold text-(--brand-ink)">Calculated Total Bill</span>
                    <span className="font-black text-(--brand-blue-deep) text-[16px]">
                      LKR {booking.totalCostLKR !== undefined ? booking.totalCostLKR : booking.lockedPricePerKwh}
                    </span>
                  </div>
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
                  onEdit(booking);
                }}
                className="px-6 py-2.5 bg-(--brand-blue) text-white font-bold rounded-xl shadow-xs hover:bg-(--brand-blue-deep) transition-all text-[12px] cursor-pointer flex items-center gap-2"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Edit Reservation Specs
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
