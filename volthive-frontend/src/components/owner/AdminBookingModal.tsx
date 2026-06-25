'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import DatePicker from '../driver/DatePicker';
import TimeSlotPicker from '../driver/TimeSlotPicker';

type Charger = {
  _id: string;
  plugType: string;
  powerKW: number;
  basePricePerKwh: number;
};

type Station = {
  _id: string;
  stationName: string;
  address?: string;
  chargers?: Charger[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  existingBookings?: any[];
};

export default function AdminBookingModal({ isOpen, onClose, onCreated, existingBookings = [] }: Props) {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedChargerId, setSelectedChargerId] = useState('');
  const [driverName, setDriverName] = useState('Walk-in EV Driver');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setErrorMessage(null);
      user.getIdToken().then(token => {
        fetch(apiUrl('/api/stations/owner'), { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(data => {
            const st = data.data || [];
            setStations(st);
            if (st.length > 0) {
              setSelectedStationId(st[0]._id);
              if (st[0].chargers && st[0].chargers.length > 0) {
                setSelectedChargerId(st[0].chargers[0]._id);
              }
            }
          });
      });
    }
  }, [isOpen, user]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setStartTime(null);
    setEndTime(null);
    setErrorMessage(null);
  };

  const currentStation = stations.find(s => s._id === selectedStationId);
  const currentCharger = currentStation?.chargers?.find(c => c._id === selectedChargerId);

  const relevantBookings = existingBookings.filter(b => {
    return b.date === date && (b.chargerId === selectedChargerId || (b.charger && b.charger._id === selectedChargerId));
  });

  const estimatedDuration = startTime && endTime
    ? Math.abs(parseInt(endTime.split(':')[0]) - parseInt(startTime.split(':')[0]))
      + Math.abs(parseInt(endTime.split(':')[1]) - parseInt(startTime.split(':')[1])) / 60
    : 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    if (!selectedStationId || !selectedChargerId || !user || !startTime || !endTime) {
      setErrorMessage('Please select station premise, hardware port, and time slot.');
      return;
    }
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          stationId: selectedStationId,
          chargerId: selectedChargerId,
          date,
          startTime,
          endTime,
          lockedPricePerKwh: currentCharger?.basePricePerKwh || 85,
          driverName
        })
      });

      const payload = await res.json();
      if (res.ok) {
        onCreated();
        onClose();
        setStartTime(null);
        setEndTime(null);
      } else {
        setErrorMessage(`Reservation failed: ${payload.message || 'Error creating booking'}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-(--surface-soft) border border-(--brand-border) rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/20 focus:border-(--brand-blue) text-(--brand-ink)";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop with gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-linear-to-br from-(--brand-ink)/20 to-(--brand-ink)/40 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            className="relative z-10 w-full max-w-2xl bg-(--brand-card)/95 backdrop-blur-3xl rounded-4xl shadow-[0_34px_80px_-46px_rgba(9,32,52,0.6)] border border-(--brand-border) overflow-hidden max-h-[90vh] overflow-y-auto text-(--brand-ink)"
          >
            {/* Header with gradient background */}
            <div className="sticky top-0 z-20 bg-linear-to-b from-(--brand-card) to-(--brand-card)/80 px-6 sm:px-8 py-6 border-b border-(--brand-border)/50 flex justify-between items-start">
              <div className="flex-1 pr-4">
                <h2 className="text-2xl sm:text-3xl font-semibold text-(--brand-ink) mb-1">Create Admin POS Reservation</h2>
                <p className="text-xs sm:text-sm text-(--brand-muted)">
                  Book an immediate or future slot on behalf of walk-in drivers.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white hover:bg-(--ui-error)/10 text-(--brand-muted) hover:text-(--ui-error) flex items-center justify-center transition-all border border-(--brand-border) shadow-sm shrink-0 cursor-pointer"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-(--ui-error)/10 border border-(--ui-error)/30 rounded-2xl flex items-center justify-between text-(--ui-error) text-xs sm:text-sm font-bold shadow-xs"
                >
                  <span className="flex items-center gap-2">⚠️ {errorMessage}</span>
                  <button type="button" onClick={() => setErrorMessage(null)} className="opacity-70 hover:opacity-100 ml-2 cursor-pointer">✕</button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1.5">Select Premise</label>
                  <select
                    value={selectedStationId}
                    onChange={e => {
                      setSelectedStationId(e.target.value);
                      const st = stations.find(s => s._id === e.target.value);
                      if (st?.chargers && st.chargers.length > 0) setSelectedChargerId(st.chargers[0]._id);
                    }}
                    className={inputCls}
                  >
                    {stations.map(s => <option key={s._id} value={s._id}>{s.stationName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1.5">Hardware Port</label>
                  <select value={selectedChargerId} onChange={e => setSelectedChargerId(e.target.value)} className={inputCls}>
                    {(currentStation?.chargers || []).map((c, i) => (
                      <option key={c._id} value={c._id}>Port #{i+1}: {c.plugType} ({c.powerKW}kW - Rs.{c.basePricePerKwh || 85})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-1.5">Driver Reference Name</label>
                <input required type="text" value={driverName} onChange={e => setDriverName(e.target.value)} className={inputCls} />
              </div>

              {/* Date Picker */}
              <div>
                <DatePicker selectedDate={date} onDateChange={handleDateChange} />
              </div>

              {/* Time Slot Picker */}
              <div>
                <TimeSlotPicker
                  selectedStartTime={startTime}
                  selectedEndTime={endTime}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                  bookedSlots={relevantBookings}
                  isToday={date === new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Summary Card */}
              {startTime && endTime && (
                <div className="bg-linear-to-br from-white/80 to-white/50 border border-(--brand-border) rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-(--brand-ink) text-lg">POS Audit Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-(--brand-muted) font-bold uppercase tracking-wider mb-1">Time Slot</p>
                      <p className="font-bold text-(--brand-ink) text-sm">{startTime} → {endTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-(--brand-muted) font-bold uppercase tracking-wider mb-1">Duration</p>
                      <p className="font-bold text-(--brand-ink) text-sm">{estimatedDuration.toFixed(1)} hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-(--brand-muted) font-bold uppercase tracking-wider mb-1">POS Rate</p>
                      <p className="font-bold text-(--brand-ink) text-sm">Rs. {currentCharger?.basePricePerKwh || 85} / kWh</p>
                    </div>
                    <div>
                      <p className="text-xs text-(--brand-muted) font-bold uppercase tracking-wider mb-1">Walk-in Client</p>
                      <p className="font-bold text-(--brand-ink) text-sm truncate">{driverName || 'Walk-in Driver'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex gap-4 pt-2 border-t border-(--brand-border)/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-(--surface-soft) hover:bg-(--surface-tint) text-(--brand-ink) font-bold rounded-2xl transition-all border border-(--brand-border) text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !startTime || !endTime}
                  className="flex-2 py-3.5 bg-linear-to-r from-(--brand-blue) to-(--brand-green) hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-md shadow-(--brand-blue)/25 text-sm cursor-pointer"
                >
                  {loading ? 'Confirming...' : 'Confirm Admin Reservation'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
