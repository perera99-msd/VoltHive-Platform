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

  const inputCls = "w-full px-4 py-3 bg-(--surface-soft)/40 border border-(--brand-border)/80 rounded-xl text-[13px] text-(--brand-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) transition-all placeholder:text-(--brand-muted)/50";

  return (
    <>
      <AnimatePresence>
        {isOpen && booking && (
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
                <div>
                  <h3 className="text-[18px] font-extrabold text-(--brand-ink) tracking-tight">Edit Reservation Specs</h3>
                  <p className="text-[12px] text-(--brand-muted) font-medium mt-0.5">Modify customer contact, time slot, or reassign hardware plug.</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 sm:px-8 overflow-y-auto space-y-4">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-(--ui-error)/10 border border-(--ui-error)/30 text-(--ui-error) text-[12px] font-bold flex items-center gap-2">
                    <span>⚠️</span> {errorMessage}
                  </div>
                )}

                <form id="edit-booking-form" onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Customer Name</label>
                      <input required type="text" value={cName} onChange={e => setCName(e.target.value)} className={inputCls} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Contact Hotline</label>
                      <input required type="tel" value={cPhone} onChange={e => setCPhone(e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Reservation Date</label>
                    <input required type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Start Time</label>
                      <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">End Time</label>
                      <input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  {stationChargers.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Reassign Hardware Plug Port</label>
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
              <div className="px-6 sm:px-8 py-4 border-t border-(--brand-border)/60 bg-(--surface-soft)/30 flex flex-col sm:flex-row gap-3 justify-end">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-(--brand-border)/80 text-(--brand-ink) font-bold rounded-xl hover:bg-(--surface-soft)/50 transition-colors text-[13px] cursor-pointer w-full sm:w-auto">
                  Cancel
                </button>
                <button type="submit" form="edit-booking-form" disabled={loading} className="px-8 py-3 bg-(--brand-blue) text-white font-bold rounded-xl shadow-sm hover:bg-(--brand-blue-deep) hover:shadow-md transition-all text-[13px] cursor-pointer w-full sm:w-auto">
                  {loading ? 'Saving Changes...' : 'Save Updates'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showConfirmEdit}
        title="Update Reservation Specs"
        message="Are you sure you want to save these modifications to the customer contact info, time slot, or hardware plug port?"
        confirmText="Save Updates"
        isDanger={false}
        isLoading={loading}
        onClose={() => setShowConfirmEdit(false)}
        onConfirm={executeUpdateBooking}
      />
    </>
  );
}
