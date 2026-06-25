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
        if (b.status === 'Cancelled') return false;
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
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider">
          Select Charging Time Slot
        </label>
        {selectedStartTime && selectedEndTime && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-(--brand-blue)/10 text-(--brand-blue)">
            Selected: {selectedStartTime} → {selectedEndTime === '23:59' ? '24:00' : selectedEndTime}
          </span>
        )}
      </div>

      <p className="text-xs text-(--brand-muted)">
        💡 Tap a slot to select 1 hour. Tap the next adjacent slot to extend your charging duration.
      </p>

      {slots.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-(--surface-soft) border border-(--brand-border) p-6">
          <p className="text-sm font-bold text-(--brand-ink) mb-1">⏳ All charging time slots for today have passed</p>
          <p className="text-xs text-(--brand-muted)">Please select tomorrow's date above to reserve an upcoming charging slot.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 max-h-72 overflow-y-auto pr-1">
          {slots.map((slot) => {
            // Check if this slot is inside [selectedStartTime, selectedEndTime]
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
                className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border ${
                  slot.isBooked
                    ? 'bg-(--ui-error)/8 text-(--ui-error) border-(--ui-error)/20 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white shadow-md shadow-(--brand-blue)/25 border-transparent scale-[1.02]'
                    : 'bg-(--brand-card) text-(--brand-ink) border-(--brand-border) hover:border-(--brand-blue) hover:bg-(--surface-tint) cursor-pointer shadow-xs'
                }`}
              >
                {isSelected ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 text-white"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                ) : slot.isBooked ? (
                  <span className="w-2 h-2 rounded-full bg-(--ui-error) shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-(--brand-green)/80 shrink-0" />
                )}
                <span>{slot.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
