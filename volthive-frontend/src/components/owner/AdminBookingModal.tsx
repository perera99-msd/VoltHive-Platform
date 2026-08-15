'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl, todayYMD } from '../../lib/api';
import DatePicker from '../driver/DatePicker';
import TimeSlotPicker from '../driver/TimeSlotPicker';
import ConfirmModal from '../common/ConfirmModal';

type Charger = {
  _id: string;
  plugType: string;
  powerKW: number;
  basePricePerKwh: number;
  pricePerKWh?: number;
  currentRate?: number;
};

type Station = {
  _id: string;
  stationName: string;
  address?: string;
  pricePerKWh?: number;
  chargers?: Charger[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (msg?: string) => void;
  existingBookings?: any[];
};

export default function AdminBookingModal({ isOpen, onClose, onCreated, existingBookings = [] }: Props) {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedChargerId, setSelectedChargerId] = useState('');
  
  // Mandatory Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [date, setDate] = useState(() => todayYMD());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  // Real effective rate
  const lockedRate = Number(currentCharger?.currentRate)
    || Number(currentCharger?.pricePerKWh)
    || Number(currentStation?.pricePerKWh)
    || Number(currentCharger?.basePricePerKwh)
    || 0;

  // Active bookings on the chosen date (block occupied time slots + compute
  // which chargers are actually free for the chosen slot).
  const ACTIVE_SLOT = ['Pending', 'Confirmed', 'Active_Charging'];
  const todaysActiveBookings = existingBookings.filter(b => b.date === date && ACTIVE_SLOT.includes(b.status));

  const timeToMins = (t?: string | null) => {
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return NaN;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const startMins = timeToMins(startTime);
  const endMins = timeToMins(endTime);

  // A charger is "busy" for the chosen slot if an active booking on that date
  // overlaps the requested time window.
  const isChargerBusy = (chargerId: string) => {
    if (!Number.isFinite(startMins) || !Number.isFinite(endMins)) return false;
    return todaysActiveBookings.some(b => {
      const cid = b.chargerId || (b.charger && b.charger._id);
      if (cid !== chargerId) return false;
      const bs = timeToMins(b.startTime);
      const be = timeToMins(b.endTime);
      return Number.isFinite(bs) && Number.isFinite(be) && bs < endMins && be > startMins;
    });
  };
  const availableChargers = (currentStation?.chargers || []).filter(c => !isChargerBusy(c._id));

  const estimatedDuration = Number.isFinite(startMins) && Number.isFinite(endMins)
    ? (endMins - startMins) / 60
    : 0;

  // Keep the selected charger valid when the date/time/station changes.
  useEffect(() => {
    const ids = (currentStation?.chargers || []).filter(c => !isChargerBusy(c._id)).map(c => c._id);
    if (ids.length === 0) {
      if (selectedChargerId) setSelectedChargerId('');
    } else if (!ids.includes(selectedChargerId)) {
      setSelectedChargerId(ids[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, startTime, endTime, selectedStationId]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Customer Name and Contact Phone Hotline are mandatory.');
      return;
    }
    if (!selectedStationId || !selectedChargerId || !startTime || !endTime) {
      setErrorMessage('Please select station premise, hardware port, and time slot.');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeCreateBooking = async () => {
    if (!user) return;
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
          lockedPricePerKwh: lockedRate,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim()
        })
      });

      const payload = await res.json();
      if (res.ok) {
        setShowConfirmModal(false);
        setCustomerName('');
        setCustomerPhone('');
        setStartTime(null);
        setEndTime(null);
        onCreated('Walk-in / Phone reservation created successfully!');
        onClose();
      } else {
        setShowConfirmModal(false);
        setErrorMessage(`Reservation failed: ${payload.message || 'Error creating booking'}`);
      }
    } catch (err) {
      console.error(err);
      setShowConfirmModal(false);
      setErrorMessage('Network error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-(--surface-soft)/50 border border-[#e0e5e3] rounded-2xl text-xs text-(--brand-ink) font-semibold focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) focus:bg-white transition-all placeholder:text-(--brand-muted)/60";

  return (
    <>
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
              className="relative z-10 w-full max-w-2xl bg-white/95 backdrop-blur-3xl rounded-3xl border border-[#e0e5e3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-[#e0e5e3] flex justify-between items-center bg-white/80 backdrop-blur-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-(--brand-blue)/10 to-(--brand-green)/10 border border-[#e0e5e3] flex items-center justify-center text-(--brand-blue-deep) shadow-2xs">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-(--brand-ink) tracking-tight">Create Manual POS Reservation</h3>
                    <p className="text-xs text-(--brand-muted) font-medium">Reserve a hardware plug for walk-in or phone-in drivers.</p>
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

              {/* Form Content */}
              <div className="p-6 sm:px-8 overflow-y-auto space-y-5 [&::-webkit-scrollbar]:hidden">
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                    <span>⚠️</span> {errorMessage}
                  </div>
                )}

                <form id="admin-booking-form" onSubmit={handleFormSubmit} className="space-y-5">
                  {/* Mandatory Customer Contact Details */}
                  <div className="p-4 bg-(--surface-soft)/40 rounded-2xl border border-[#e0e5e3] space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-(--brand-blue-deep)">
                      1. Mandatory Driver Contact Info
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">
                          Customer Name <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          required 
                          type="text" 
                          placeholder="e.g. Ruwan Perera" 
                          value={customerName} 
                          onChange={e => setCustomerName(e.target.value)} 
                          className={inputCls} 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">
                          Contact Hotline <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          required 
                          type="tel" 
                          placeholder="e.g. +94 77 123 4567" 
                          value={customerPhone} 
                          onChange={e => setCustomerPhone(e.target.value)} 
                          className={inputCls} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date & Time Selection */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-(--brand-blue-deep)">
                      2. Date & Duration
                    </h4>

                    <DatePicker selectedDate={date} onDateChange={handleDateChange} />

                    <TimeSlotPicker
                      selectedStartTime={startTime}
                      selectedEndTime={endTime}
                      onStartTimeChange={(time) => setStartTime(time)}
                      onEndTimeChange={(time) => setEndTime(time)}
                      bookedSlots={todaysActiveBookings}
                      isToday={date === todayYMD()}
                    />
                  </div>

                  {/* Select an Available Charger for the chosen slot */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-(--brand-blue-deep)">
                      3. Select Hardware Plug
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Target Station Premise</label>
                        <select 
                          required 
                          value={selectedStationId} 
                          onChange={e => { setSelectedStationId(e.target.value); setSelectedChargerId(''); }} 
                          className={`${inputCls} cursor-pointer`}
                        >
                          {stations.map(s => <option key={s._id} value={s._id}>{s.stationName}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Hardware Plug Port</label>
                        <select 
                          required 
                          value={selectedChargerId} 
                          onChange={e => setSelectedChargerId(e.target.value)} 
                          className={`${inputCls} cursor-pointer`}
                          disabled={!startTime || !endTime}
                        >
                          {availableChargers.length === 0 ? (
                            <option value="">No chargers free for this slot</option>
                          ) : (
                            availableChargers.map(c => (
                              <option key={c._id} value={c._id}>
                                {c.plugType} ({c.powerKW} kW) — LKR {c.currentRate || c.basePricePerKwh}/kWh
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                    {startTime && endTime && (
                      <p className="text-[10px] text-(--brand-muted) font-semibold">
                        {availableChargers.length} charger(s) available for {startTime} - {endTime} on {date}.
                      </p>
                    )}
                  </div>

                  {/* Summary Bar */}
                  {startTime && endTime && (
                    <div className="p-4 bg-white rounded-2xl border border-[#e0e5e3] shadow-2xs flex justify-between items-center text-xs">
                      <div>
                        <span className="font-black text-(--brand-ink)">Reserved Duration: {estimatedDuration.toFixed(1)} Hours</span>
                        <p className="text-[11px] text-(--brand-muted) font-semibold mt-0.5">{startTime} - {endTime} on {date}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-(--brand-muted) font-black uppercase tracking-wider block">Locked Rate</span>
                        <span className="font-black text-(--brand-blue-deep) text-sm">{lockedRate > 0 ? `LKR ${lockedRate}/kWh` : '—'}</span>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer */}
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
                  form="admin-booking-form" 
                  disabled={loading} 
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Creating...' : 'Create Reservation'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Manual POS Reservation?"
        message={`Confirm reservation for ${customerName} (${customerPhone}) on ${date} from ${startTime} to ${endTime}?`}
        confirmText="Confirm Reservation"
        cancelText="Cancel"
        isDanger={false}
        isLoading={loading}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeCreateBooking}
      />
    </>
  );
}
