'use client';
import { useState } from 'react';
import DatePicker from './DatePicker';
import TimeSlotPicker from './TimeSlotPicker';
import { todayYMD } from '../../lib/api';

interface BookingConfirmModalProps {
  stationName: string;
  address: string;
  pricePerKwh: number;
  powerKW?: number;
  onConfirmBooking: (bookingData: {
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
  onCancel: () => void;
  existingBookings: Array<{ startTime: string; endTime: string; status: string; date: string }>;
  isLoading?: boolean;
}

export default function BookingConfirmModal({
  stationName,
  address,
  pricePerKwh,
  powerKW,
  onConfirmBooking,
  onCancel,
  existingBookings,
  isLoading = false
}: BookingConfirmModalProps) {
  const [selectedDate, setSelectedDate] = useState(todayYMD());
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedStartTime(null);
    setSelectedEndTime(null);
  };

  const todaysBookings = existingBookings.filter(b => b.date === selectedDate);

  const estimatedDuration = selectedStartTime && selectedEndTime
    ? Math.abs(parseInt(selectedEndTime.split(':')[0]) - parseInt(selectedStartTime.split(':')[0]))
      + Math.abs(parseInt(selectedEndTime.split(':')[1]) - parseInt(selectedStartTime.split(':')[1])) / 60
    : 0;

  // Realistic estimate: energy = duration × charger power, cost = energy × rate
  const estimatedEnergyKWh = estimatedDuration * (powerKW || 0);
  const estimatedCost = estimatedEnergyKWh * pricePerKwh;

  const canConfirm = selectedStartTime && selectedEndTime && selectedStartTime < selectedEndTime;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirmBooking({
        date: selectedDate,
        startTime: selectedStartTime!,
        endTime: selectedEndTime!
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
              onStartTimeChange={setSelectedStartTime}
              onEndTimeChange={setSelectedEndTime}
              bookedSlots={todaysBookings}
              isToday={selectedDate === todayYMD()}
            />
          </div>

          {/* Summary Card */}
          {selectedStartTime && selectedEndTime && (
            <div className="bg-(--surface-soft) border border-(--brand-border) rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-(--brand-ink) text-xs uppercase tracking-widest text-(--brand-muted)">Booking Summary</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1 bg-(--brand-card) p-3 rounded-xl border border-(--brand-border)">
                  <p className="text-[10px] text-(--brand-muted) font-bold uppercase tracking-wider mb-0.5">Time Slot</p>
                  <p className="font-extrabold text-(--brand-ink) text-xs">{selectedStartTime} → {selectedEndTime}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-(--brand-card) p-3 rounded-xl border border-(--brand-border)">
                  <p className="text-[10px] text-(--brand-muted) font-bold uppercase tracking-wider mb-0.5">Duration</p>
                  <p className="font-extrabold text-(--brand-ink) text-xs">{estimatedDuration.toFixed(1)} hrs</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-(--brand-card) p-3 rounded-xl border border-(--brand-border)">
                  <p className="text-[10px] text-(--brand-muted) font-bold uppercase tracking-wider mb-0.5">Locked Rate</p>
                  <p className="font-extrabold text-sm text-(--brand-blue)">
                    Rs. {pricePerKwh} / kWh
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-(--brand-blue)/10 border border-(--brand-blue)/25 rounded-xl p-3">
                  <p className="text-[10px] text-(--brand-muted) font-bold uppercase tracking-wider mb-0.5">Est. Total Cost</p>
                  <p className="font-black text-xl text-(--brand-green-deep)">Rs. {estimatedCost.toFixed(2)}</p>
                  <p className="text-[10px] text-(--brand-muted) font-semibold mt-0.5">
                    ≈ {estimatedEnergyKWh.toFixed(1)} kWh {powerKW ? `at ${powerKW} kW` : ''}
                  </p>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-(--ui-warning)/10 border border-(--ui-warning)/25 rounded-xl p-3 space-y-1">
                <p className="text-[11px] text-(--brand-muted) leading-relaxed">
                  <span className="font-bold text-(--ui-warning)">⚠️ Note:</span> Your slot requires owner confirmation within <span className="font-bold">15 minutes</span>. If not confirmed, the request expires and slot is released.
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
