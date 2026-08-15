'use client';
import { useState } from 'react';
import DatePicker from './DatePicker';
import TimeSlotPicker from './TimeSlotPicker';
import { todayYMD } from '../../lib/api';

interface ChargerOption {
  _id: string;
  plugType: string;
  powerKW: number;
  status: string;
  currentRate?: number;
  pricePerKWh?: number;
  rate?: number;
}

interface BookingConfirmModalProps {
  stationName: string;
  address: string;
  chargers: ChargerOption[];
  onConfirmBooking: (bookingData: {
    date: string;
    startTime: string;
    endTime: string;
    chargerId: string;
  }) => void;
  onCancel: () => void;
  existingBookings: Array<{ startTime: string; endTime: string; status: string; date: string; chargerId?: string }>;
  isLoading?: boolean;
}

export default function BookingConfirmModal({
  stationName,
  address,
  chargers,
  onConfirmBooking,
  onCancel,
  existingBookings,
  isLoading = false
}: BookingConfirmModalProps) {
  const [selectedDate, setSelectedDate] = useState(todayYMD());
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedStartTime(null);
    setSelectedEndTime(null);
    setSelectedChargerId(null);
  };

  const todaysBookings = existingBookings.filter(b => b.date === selectedDate);

  const timeToMins = (t?: string | null) => {
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return NaN;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const startMins = timeToMins(selectedStartTime);
  const endMins = timeToMins(selectedEndTime);

  const estimatedDuration = Number.isFinite(startMins) && Number.isFinite(endMins)
    ? (endMins - startMins) / 60
    : 0;

  // Chargers free for the chosen date + slot (no overlapping active booking).
  const ACTIVE_SLOT = ['Pending', 'Confirmed', 'Active_Charging'];
  const busyChargerIds = new Set(
    todaysBookings
      .filter(b => b.chargerId && ACTIVE_SLOT.includes(b.status) && Number.isFinite(startMins) && Number.isFinite(endMins))
      .filter(b => {
        const bs = timeToMins(b.startTime);
        const be = timeToMins(b.endTime);
        return Number.isFinite(bs) && Number.isFinite(be) && bs < endMins && be > startMins;
      })
      .map(b => b.chargerId)
  );
  const availableChargers = chargers.filter(c => !busyChargerIds.has(c._id));

  const chargerRateOf = (c: ChargerOption) => {
    const currentRate = Number(c.currentRate);
    const pricePerKWh = Number(c.pricePerKWh);
    const rate = Number(c.rate);
    if (currentRate > 0) return currentRate;
    if (pricePerKWh > 0) return pricePerKWh;
    if (rate > 0) return rate;
    return 0;
  };
  const selectedCharger = chargers.find(c => c._id === selectedChargerId) || null;
  const agreedRate = selectedCharger ? chargerRateOf(selectedCharger) : 0;

  const canConfirm = !!selectedStartTime && !!selectedEndTime && selectedStartTime < selectedEndTime
    && !!selectedChargerId && availableChargers.some(c => c._id === selectedChargerId);

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirmBooking({
        date: selectedDate,
        startTime: selectedStartTime!,
        endTime: selectedEndTime!,
        chargerId: selectedChargerId!
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 font-sans pointer-events-auto">
      {/* Frosted Backdrop */}
      <div
        className="absolute inset-0 bg-(--brand-ink)/40 backdrop-blur-md transition-opacity duration-300 pointer-events-auto cursor-pointer"
        onClick={onCancel}
      />

      {/* Modal Shell */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 pointer-events-auto w-full max-w-lg bg-(--brand-card)/95 backdrop-blur-3xl rounded-3xl shadow-[0_24px_60px_-15px_rgba(9,32,52,0.5)] border border-(--brand-border) overflow-hidden max-h-[88vh] flex flex-col vh-rise-in text-(--brand-ink)"
      >
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-(--brand-card)/95 backdrop-blur-md px-5 py-4 border-b border-(--brand-border)/40 flex justify-between items-center shrink-0">
          <div className="flex-1 pr-3">
            <h2 className="text-lg sm:text-xl font-bold text-(--brand-ink) tracking-tight leading-snug">{stationName}</h2>
            <p className="text-xs text-(--brand-muted) flex items-center gap-1.5 font-medium mt-0.5">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0 text-(--brand-blue) opacity-80">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {address}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-(--surface-soft) hover:bg-(--surface-tint) text-(--brand-muted) hover:text-(--ui-error) flex items-center justify-center transition-all border border-(--brand-border) cursor-pointer shrink-0"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {/* Date Picker */}
          <div>
            <DatePicker selectedDate={selectedDate} onDateChange={handleDateChange} />
          </div>

          {/* Time Slot Picker */}
          <div>
            <TimeSlotPicker
              selectedStartTime={selectedStartTime}
              selectedEndTime={selectedEndTime}
              onStartTimeChange={(t) => { setSelectedStartTime(t); setSelectedChargerId(null); }}
              onEndTimeChange={(t) => { setSelectedEndTime(t); setSelectedChargerId(null); }}
              bookedSlots={todaysBookings}
              isToday={selectedDate === todayYMD()}
            />
          </div>

          {/* Select an Available Charger for the chosen slot */}
          {selectedStartTime && selectedEndTime && (
            <div>
              <h3 className="font-bold text-(--brand-ink) text-xs uppercase tracking-widest text-(--brand-muted) mb-2">
                Available Chargers ({availableChargers.length})
              </h3>
              {availableChargers.length === 0 ? (
                <div className="bg-(--surface-soft) p-4 rounded-xl text-center border border-(--brand-border)">
                  <p className="text-xs text-(--brand-muted) font-medium">No chargers are free for this time slot. Pick another time.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {availableChargers.map((charger, idx) => {
                    const isSelected = selectedChargerId === charger._id;
                    return (
                      <button
                        key={charger._id}
                        onClick={() => setSelectedChargerId(charger._id)}
                        className={`p-3 rounded-xl border transition-all text-left relative cursor-pointer ${
                          isSelected
                            ? 'bg-(--brand-blue)/14 border-2 border-(--brand-blue)'
                            : 'bg-(--brand-card) border-(--brand-border) hover:border-(--brand-blue)/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${isSelected ? 'bg-(--brand-blue) text-white' : 'bg-(--accent-blue)/16 text-(--brand-blue)'}`}>
                              0{idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-(--brand-ink)">
                                {charger.plugType || 'Charger'} • <span className="font-extrabold text-(--brand-green-deep)">{charger.powerKW} kW</span>
                                {chargerRateOf(charger) > 0 && (
                                  <span className="font-bold text-(--brand-blue)"> • LKR {chargerRateOf(charger)}/kWh</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-(--ui-success)/15 text-(--ui-success) border-(--ui-success)/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-(--ui-success)" />
                            {isSelected ? 'Selected' : 'Free'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Summary Card */}
          {selectedStartTime && selectedEndTime && selectedCharger && (
            <div className="bg-(--surface-soft) border border-(--brand-border) rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-(--brand-ink) text-xs uppercase tracking-widest text-(--brand-muted)">Booking Summary</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1 bg-(--brand-card) p-3 rounded-xl border border-(--brand-border)">
                  <p className="text-[10px] text-(--brand-muted) font-bold uppercase tracking-wider mb-0.5">Time Slot</p>
                  <p className="font-extrabold text-(--brand-ink) text-xs">{selectedStartTime} → {selectedEndTime}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-(--brand-card) p-3 rounded-xl border border-(--brand-border)">
                  <p className="text-[10px] text-(--brand-muted) font-bold uppercase tracking-wider mb-0.5">Charger</p>
                  <p className="font-extrabold text-(--brand-ink) text-xs">{selectedCharger.plugType} • {selectedCharger.powerKW} kW</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-(--brand-card) p-3 rounded-xl border border-(--brand-border)">
                  <p className="text-[10px] text-(--brand-muted) font-bold uppercase tracking-wider mb-0.5">Locked Rate</p>
                  <p className="font-extrabold text-sm text-(--brand-blue)">
                    {agreedRate > 0 ? `Rs. ${agreedRate} / kWh` : '—'}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-(--brand-blue)/10 border border-(--brand-blue)/25 rounded-xl p-3">
                  <p className="text-[10px] text-(--brand-muted) font-bold uppercase tracking-wider mb-0.5">Duration</p>
                  <p className="font-black text-xl text-(--brand-green-deep)">{estimatedDuration.toFixed(1)} hrs</p>
                  <p className="text-[10px] text-(--brand-muted) font-semibold mt-0.5">Agreed price is locked at booking time</p>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-(--ui-warning)/10 border border-(--ui-warning)/25 rounded-xl p-3 space-y-1">
                <p className="text-[11px] text-(--brand-muted) leading-relaxed">
                  <span className="font-bold text-(--ui-warning)">⚠️ Note:</span> Your slot requires owner confirmation within <span className="font-bold">15 minutes</span>. If not confirmed, the request expires, the slot is released, and the booking is removed shortly after.
                </p>
                <p className="text-[11px] text-(--brand-muted) leading-relaxed">
                  <span className="font-bold text-(--brand-blue)">ℹ️ Price:</span> The rate shown is locked at booking time. The station owner settles the final amount manually when your session is complete.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 z-20 bg-(--brand-card)/95 backdrop-blur-md px-5 py-3.5 border-t border-(--brand-border)/40 flex gap-2.5 shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-(--surface-soft) hover:bg-(--surface-tint) text-(--brand-ink) font-bold text-xs transition-all border border-(--brand-border) cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
              canConfirm && !isLoading
                ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white hover:brightness-105 border-transparent shadow-sm active:scale-[0.98]'
                : 'bg-(--surface-soft) text-(--brand-muted) cursor-not-allowed border-(--brand-border)'
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Request Booking
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
