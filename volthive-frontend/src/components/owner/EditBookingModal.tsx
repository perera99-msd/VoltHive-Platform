'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import ConfirmModal from '../common/ConfirmModal';

type Charger = {
  _id: string;
  plugType: string;
  powerKW: number;
  basePricePerKwh: number;
  status: string;
};

type Booking = {
  _id: string;
  customerName?: string;
  customerPhone?: string;
  driver?: { name?: string; email?: string; telephone?: string };
  station?: { _id?: string; stationName?: string };
  chargerId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  lockedPricePerKwh: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (msg?: string) => void;
  booking: Booking | null;
};

export default function EditBookingModal({ isOpen, onClose, onUpdated, booking }: Props) {
  const { user } = useAuth();
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedChargerId, setSelectedChargerId] = useState('');
  const [stationChargers, setStationChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (booking && user) {
      setErrorMessage(null);
      const initialName = booking.customerName && booking.customerName.trim() !== '' 
        ? booking.customerName 
        : (booking.driver?.name || '');

      const initialPhone = booking.customerPhone && booking.customerPhone.trim() !== '' 
        ? booking.customerPhone 
        : (booking.driver?.telephone || (booking.driver as any)?.phone || '');

      setCName(initialName);
      setCPhone(initialPhone);
      setDate(booking.date || '');
      setStartTime(booking.startTime || '');
      setEndTime(booking.endTime || '');
      setSelectedChargerId(booking.chargerId || '');

      const stId = typeof booking.station === 'object' ? booking.station?._id : booking.station;
      if (stId) {
        user.getIdToken().then(token => {
          fetch(apiUrl('/api/stations/owner'), { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
              const myStations = data.data || [];
              const target = myStations.find((s: any) => s._id === stId);
              if (target && target.chargers) {
                setStationChargers(target.chargers);
              }
            });
        });
      }
    }
  }, [booking, user]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!booking || !user) return;
    setShowConfirmEdit(true);
  };

  const executeUpdateBooking = async () => {
    if (!booking || !user) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/bookings/${booking._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: cName.trim(),
          customerPhone: cPhone.trim(),
          date,
          startTime,
          endTime,
          chargerId: selectedChargerId
        })
      });

      if (res.ok) {
        setShowConfirmEdit(false);
        onUpdated('Reservation details updated successfully!');
        onClose();
      } else {
        const err = await res.json();
        setShowConfirmEdit(false);
        setErrorMessage(err.message || 'Failed to update reservation details');
      }
    } catch (error) {
      console.error(error);
      setShowConfirmEdit(false);
      setErrorMessage('Network failure updating reservation');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-(--surface-soft)/50 border border-[#e0e5e3] rounded-2xl text-xs text-(--brand-ink) font-semibold focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) focus:bg-white transition-all placeholder:text-(--brand-muted)/60";

  return (
    <>
      <AnimatePresence>
        {isOpen && booking && (
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
                  <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-(--brand-blue)/10 to-(--brand-green)/10 border border-[#e0e5e3] flex items-center justify-center text-(--brand-blue-deep) shadow-2xs">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-(--brand-ink) tracking-tight">Edit Reservation Specs</h3>
                    <p className="text-xs text-(--brand-muted) font-medium">Modify customer contact, time slot, or reassign hardware plug.</p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-(--surface-soft) text-(--brand-muted) hover:text-(--brand-ink) border border-[#e0e5e3] transition-colors cursor-pointer"
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 sm:px-8 overflow-y-auto space-y-4 [&::-webkit-scrollbar]:hidden">
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                    <span>⚠️</span> {errorMessage}
                  </div>
                )}

                <form id="edit-booking-form" onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Customer Name</label>
                      <input required type="text" value={cName} onChange={e => setCName(e.target.value)} className={inputCls} />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Contact Hotline</label>
                      <input required type="tel" value={cPhone} onChange={e => setCPhone(e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Reservation Date</label>
                    <input required type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Start Time</label>
                      <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">End Time</label>
                      <input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  {stationChargers.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Reassign Hardware Plug Port</label>
                      <select value={selectedChargerId} onChange={e => setSelectedChargerId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                        {stationChargers.map(c => (
                          <option key={c._id} value={c._id}>
                            {c.plugType} ({c.powerKW} kW) — Status: {c.status}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer Actions */}
              <div className="px-6 sm:px-8 py-4 bg-white border-t border-[#e0e5e3] flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-5 py-2.5 rounded-xl border border-[#e0e5e3] text-xs font-bold text-(--brand-muted) hover:bg-(--surface-soft) transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="edit-booking-form" 
                  disabled={loading} 
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showConfirmEdit}
        title="Save Reservation Changes?"
        message={`Are you sure you want to update the reservation details for ${cName}?`}
        confirmText="Save Updates"
        cancelText="Cancel"
        isDanger={false}
        isLoading={loading}
        onClose={() => setShowConfirmEdit(false)}
        onConfirm={executeUpdateBooking}
      />
    </>
  );
}
