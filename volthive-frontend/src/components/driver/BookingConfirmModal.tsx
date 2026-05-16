'use client';
import { useState } from 'react';
import DatePicker from './DatePicker';
import TimeSlotPicker from './TimeSlotPicker';

interface BookingConfirmModalProps {
  stationName: string;
  address: string;
  pricePerKwh: number;
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
  onConfirmBooking,
  onCancel,
  existingBookings,
  isLoading = false
}: BookingConfirmModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);

  const todaysBookings = existingBookings.filter(b => b.date === selectedDate);

  const estimatedDuration = selectedStartTime && selectedEndTime
    ? Math.abs(parseInt(selectedEndTime.split(':')[0]) - parseInt(selectedStartTime.split(':')[0]))
      + Math.abs(parseInt(selectedEndTime.split(':')[1]) - parseInt(selectedStartTime.split(':')[1])) / 60
    : 0;

  const estimatedCost = estimatedDuration * pricePerKwh;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop with gradient */}
      <div
        className="absolute inset-0 bg-linear-to-br from-(--brand-ink)/20 to-(--brand-ink)/40 backdrop-blur-xl"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl bg-(--brand-card)/95 backdrop-blur-3xl rounded-4xl shadow-[0_34px_80px_-46px_rgba(9,32,52,0.6)] border border-(--brand-border) overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header with gradient background */}
        <div className="sticky top-0 z-20 bg-linear-to-b from-(--brand-card) to-(--brand-card)/80 px-6 sm:px-8 py-6 border-b border-(--brand-border)/50 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-semibold text-(--brand-ink) mb-2">{stationName}</h2>
            <p className="text-sm text-(--brand-muted) flex items-center gap-2">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {address}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-white hover:bg-(--ui-error)/10 text-(--brand-muted) hover:text-(--ui-error) flex items-center justify-center transition-all border border-(--brand-border) shadow-sm"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Date Picker */}
          <div>
            <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>

          {/* Time Slot Picker */}
          <div>
            <TimeSlotPicker
              selectedStartTime={selectedStartTime}
              selectedEndTime={selectedEndTime}
              onStartTimeChange={setSelectedStartTime}
              onEndTimeChange={setSelectedEndTime}
              bookedSlots={todaysBookings}
            />
          </div>

          {/* Summary Card */}
          {selectedStartTime && selectedEndTime && (
            <div className="bg-linear-to-br from-white/80 to-white/50 border border-(--brand-border) rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-(--brand-ink) text-lg">Booking Summary</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-(--brand-muted) font-bold uppercase tracking-wider mb-1">Time Slot</p>
                  <p className="font-bold text-(--brand-ink) text-sm">{selectedStartTime} → {selectedEndTime}</p>
                </div>
                <div>
                  <p className="text-xs text-(--brand-muted) font-bold uppercase tracking-wider mb-1">Duration</p>
                  <p className="font-bold text-(--brand-ink) text-sm">{estimatedDuration.toFixed(1)} hrs</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-(--brand-muted) font-bold uppercase tracking-wider mb-1">Locked Rate</p>
                  <p className="font-bold text-lg bg-linear-to-r from-(--brand-blue) to-(--brand-green) bg-clip-text text-transparent">
                    Rs. {pricePerKwh}/kWh
                  </p>
                </div>
                <div className="col-span-2 bg-linear-to-br from-(--brand-blue)/10 to-(--brand-green)/5 border border-(--brand-blue)/20 rounded-xl p-3">
                  <p className="text-xs text-(--brand-muted) font-bold uppercase tracking-wider mb-1">Est. Cost</p>
                  <p className="font-black text-2xl text-(--brand-green)">Rs. {estimatedCost.toFixed(2)}</p>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-(--ui-warning)/8 border border-(--ui-warning)/30 rounded-lg p-3.5 space-y-2">
                <p className="text-xs text-(--brand-muted) leading-relaxed">
                  <span className="font-bold text-(--ui-warning)">⚠️ Note:</span> Your booking is <span className="font-semibold">not guaranteed</span> until the owner confirms. You&apos;ll get a notification once approved.
                </p>
                <p className="text-xs text-(--brand-muted) leading-relaxed">
                  If not confirmed within <span className="font-bold">3 minutes</span>, the booking will auto-cancel.
                </p>
              </div>

              {/* Status Confirmation */}
              <div className="bg-(--brand-blue)/8 border border-(--brand-blue)/30 rounded-lg p-3.5">
                <p className="text-xs text-(--brand-muted) leading-relaxed">
                  <span className="font-bold">💡 Tip:</span> Charger status may not be 100% real-time. Use the <span className="font-semibold">Contact</span> button to confirm availability directly with the owner.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 z-20 bg-linear-to-t from-(--brand-card) via-(--brand-card)/95 to-transparent px-6 sm:px-8 py-5 border-t border-(--brand-border)/50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-white hover:bg-background text-(--brand-ink) font-bold transition-all border border-(--brand-border) shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className={`flex-1 py-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${
              canConfirm && !isLoading
                ? 'bg-linear-to-br from-(--brand-blue) to-(--brand-green) text-white hover:shadow-[0_8px_24px_rgba(74,144,164,0.35)] border-(--brand-blue)/20 shadow-[0_4px_20px_rgba(74,144,164,0.15)]'
                : 'bg-(--brand-border)/30 text-(--brand-muted) cursor-not-allowed border-(--brand-border)'
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
