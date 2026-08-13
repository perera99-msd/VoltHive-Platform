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

  // Real effective rate a driver would pay (AI override if active, else base)
  const lockedRate = Number(currentStation?.pricePerKWh) || Number(currentCharger?.basePricePerKwh) || 0;

  const relevantBookings = existingBookings.filter(b => {
    return b.date === date && (b.chargerId === selectedChargerId || (b.charger && b.charger._id === selectedChargerId));
  });

  const estimatedDuration = startTime && endTime
    ? Math.abs(parseInt(endTime.split(':')[0]) - parseInt(startTime.split(':')[0]))
      + Math.abs(parseInt(endTime.split(':')[1]) - parseInt(startTime.split(':')[1])) / 60
    : 0;

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

  const inputCls = "w-full px-4 py-3 bg-(--surface-soft)/40 border border-(--brand-border)/80 rounded-xl text-[13px] text-(--brand-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) transition-all placeholder:text-(--brand-muted)/50";

  return (
    <>
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
              className="bg-white rounded-[24px] max-w-2xl w-full border border-(--brand-border)/80 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-(--brand-border)/60 flex justify-between items-center bg-(--surface-soft)/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue)">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </div>
                  <div>
                    <h3 className="text-[18px] font-extrabold text-(--brand-ink) tracking-tight">Create Manual POS Reservation</h3>
                    <p className="text-[11px] text-(--brand-muted) font-medium mt-0.5">Reserve a hardware plug for walk-in or phone-in drivers.</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 sm:px-8 overflow-y-auto space-y-5">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-(--ui-error)/10 border border-(--ui-error)/30 text-(--ui-error) text-[12px] font-bold flex items-center gap-2">
                    <span>⚠️</span> {errorMessage}
                  </div>
                )}

                <form id="admin-booking-form" onSubmit={handleFormSubmit} className="space-y-5">
                  {/* Mandatory Customer Contact Details */}
                  <div className="p-4 bg-(--surface-soft)/30 rounded-2xl border border-(--brand-border)/60 space-y-4">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-(--brand-blue-deep)">
                      1. Mandatory Driver Contact Info
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Customer Name <span className="text-(--ui-error)">*</span></label>
                        <input required type="text" placeholder="e.g. Ruwan Perera" value={customerName} onChange={e => setCustomerName(e.target.value)} className={inputCls} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Contact Hotline <span className="text-(--ui-error)">*</span></label>
                        <input required type="tel" placeholder="e.g. +94 77 123 4567" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  </div>

                  {/* Target Hardware Location */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-(--brand-blue-deep)">
                      2. Select Hardware Plug
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Target Station Premise</label>
                        <select required value={selectedStationId} onChange={e => setSelectedStationId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                          {stations.map(s => <option key={s._id} value={s._id}>{s.stationName}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.14em]">Hardware Plug Port</label>
                        <select required value={selectedChargerId} onChange={e => setSelectedChargerId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                          {currentStation?.chargers?.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.plugType} ({c.powerKW} kW) — LKR {c.basePricePerKwh}/kWh
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time Selection */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-(--brand-blue-deep)">
                      3. Date & Duration
                    </h4>

                    <DatePicker selectedDate={date} onDateChange={handleDateChange} />

                    <TimeSlotPicker
                      selectedStartTime={startTime}
                      selectedEndTime={endTime}
                      onStartTimeChange={(time) => setStartTime(time)}
                      onEndTimeChange={(time) => setEndTime(time)}
                      bookedSlots={relevantBookings}
                      isToday={date === todayYMD()}
                    />
                  </div>

                  {/* Summary Bar */}
                  {startTime && endTime && (
                    <div className="p-4 bg-(--surface-soft)/60 rounded-2xl border border-(--brand-border)/80 flex justify-between items-center text-[12px]">
                      <div>
                        <span className="font-extrabold text-(--brand-ink)">Reserved Duration: {estimatedDuration.toFixed(1)} Hours</span>
                        <p className="text-[10px] text-(--brand-muted) font-medium">{startTime} - {endTime} on {date}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-(--brand-muted) font-extrabold uppercase block">Locked Rate</span>
                        <span className="font-black text-(--brand-blue-deep) text-[14px]">{lockedRate > 0 ? `LKR ${lockedRate}/kWh` : '—'}</span>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer */}
              <div className="px-6 sm:px-8 py-4 border-t border-(--brand-border)/60 bg-(--surface-soft)/30 flex flex-col sm:flex-row gap-3 justify-end">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-(--brand-border)/80 text-(--brand-ink) font-bold rounded-xl hover:bg-(--surface-soft)/50 transition-colors text-[13px] cursor-pointer w-full sm:w-auto">
                  Cancel
                </button>
                <button type="submit" form="admin-booking-form" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-(--brand-blue) to-(--brand-green) text-white font-bold rounded-xl shadow-sm hover:brightness-105 transition-all text-[13px] cursor-pointer w-full sm:w-auto">
                  {loading ? 'Creating...' : 'Create Reservation'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Manual POS Reservation"
        message={`Are you sure you want to reserve this charger slot for ${customerName} (${customerPhone})?`}
        confirmText="Confirm Reservation"
        isDanger={false}
        isLoading={loading}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeCreateBooking}
      />
    </>
  );
}
