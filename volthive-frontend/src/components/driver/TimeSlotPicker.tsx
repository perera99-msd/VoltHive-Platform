'use client';
import { useMemo } from 'react';

interface TimeSlotPickerProps {
  selectedStartTime: string | null;
  selectedEndTime: string | null;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  bookedSlots: Array<{ startTime: string; endTime: string; status: string }>;
  isToday?: boolean;
}

interface HourlySlot {
  label: string;
  start: string;
  end: string;
  isBooked: boolean;
}

export default function TimeSlotPicker({
  selectedStartTime,
  selectedEndTime,
  onStartTimeChange,
  onEndTimeChange,
  bookedSlots,
  isToday = false
}: TimeSlotPickerProps) {

  // Generate 24 hourly slots (00:00 - 01:00 up to 23:00 - 24:00), excluding past hours if booking for today
  const slots = useMemo(() => {
    const list: HourlySlot[] = [];
    const currentHour = new Date().getHours();

    for (let h = 0; h < 24; h++) {
      // If booking for today, exclude hours that have already started or passed
      if (isToday && h <= currentHour) {
        continue;
      }

      const startStr = `${String(h).padStart(2, '0')}:00`;
      const endH = h === 23 ? 23 : h + 1;
      const endMin = h === 23 ? '59' : '00';
      const endStr = `${String(endH).padStart(2, '0')}:${endMin}`;
      const labelEnd = `${String(h === 23 ? 0 : h + 1).padStart(2, '0')}:00`;

      // Check overlap with booked slots
      const isBooked = bookedSlots.some(b => {
        if (b.status === 'Cancelled' || b.status === 'Expired' || b.status === 'No_Show') return false;
        // Overlap condition: (start < b.endTime) && (end > b.startTime)
        return startStr < b.endTime && endStr > b.startTime;
      });

      list.push({
        label: `${startStr} - ${labelEnd}`,
        start: startStr,
        end: endStr,
        isBooked
      });
    }
    return list;
  }, [bookedSlots, isToday]);

  const handleSlotClick = (slotStart: string, slotEnd: string) => {
    if (!selectedStartTime || !selectedEndTime) {
      onStartTimeChange(slotStart);
      onEndTimeChange(slotEnd);
      return;
    }

    // If tapping the slot right after current selection (extend duration)
    if (selectedEndTime === slotStart) {
      onEndTimeChange(slotEnd);
      return;
    }

    // Otherwise select single new slot
    onStartTimeChange(slotStart);
    onEndTimeChange(slotEnd);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-widest ml-0.5">
          Select Charging Time Slot
        </label>
        {selectedStartTime && selectedEndTime && (
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-(--brand-blue)/12 text-(--brand-blue) border border-(--brand-blue)/25">
            {selectedStartTime} → {selectedEndTime === '23:59' ? '24:00' : selectedEndTime}
          </span>
        )}
      </div>

      <p className="text-[11px] text-(--brand-muted) font-medium leading-relaxed">
        💡 Tap a slot to select 1 hour. Tap an adjacent slot to extend your charging duration.
      </p>

      {slots.length === 0 ? (
        <div className="py-8 text-center rounded-2xl bg-(--surface-soft) border border-(--brand-border) p-5">
          <p className="text-xs font-bold text-(--brand-ink) mb-1">⏳ All charging slots for today have passed</p>
          <p className="text-[11px] text-(--brand-muted)">Please select tomorrow&apos;s date above to reserve an upcoming slot.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5 max-h-64 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-(--brand-border) [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {slots.map((slot) => {
            const isSelected = Boolean(
              selectedStartTime && 
              selectedEndTime && 
              slot.start >= selectedStartTime && 
              slot.end <= selectedEndTime
            );

            return (
              <button
                key={slot.start}
                type="button"
                disabled={slot.isBooked}
                onClick={() => handleSlotClick(slot.start, slot.end)}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                  slot.isBooked
                    ? 'bg-(--ui-error)/10 text-(--ui-error) border-(--ui-error)/20 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white shadow-md shadow-(--brand-blue)/20 border-transparent scale-[1.02]'
                    : 'bg-(--brand-card) text-(--brand-ink) border-(--brand-border) hover:border-(--brand-blue)/40 hover:bg-(--surface-tint) cursor-pointer'
                }`}
              >
                {isSelected ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0 text-white"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                ) : slot.isBooked ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-(--ui-error) shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-(--ui-success) shrink-0" />
                )}
                <span className="font-semibold">{slot.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
