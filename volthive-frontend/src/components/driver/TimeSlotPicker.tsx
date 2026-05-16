'use client';
import { useState, useMemo } from 'react';

interface TimeSlot {
  time: string;
  hour: number;
  isBooked: boolean;
  bookingId?: string;
}

interface TimeSlotPickerProps {
  selectedStartTime: string | null;
  selectedEndTime: string | null;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  bookedSlots: Array<{ startTime: string; endTime: string; status: string }>;
}

export default function TimeSlotPicker({
  selectedStartTime,
  selectedEndTime,
  onStartTimeChange,
  onEndTimeChange,
  bookedSlots
}: TimeSlotPickerProps) {
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');

  // Generate 24 hours in 30-minute intervals
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        
        // Check if this slot is booked
        const isBooked = bookedSlots.some(booking => {
          const [bStart, bEnd] = [booking.startTime, booking.endTime];
          return timeStr >= bStart && timeStr < bEnd && booking.status !== 'Cancelled';
        });

        slots.push({
          time: timeStr,
          hour: hour + (min / 60),
          isBooked,
          bookingId: undefined
        });
      }
    }
    return slots;
  }, [bookedSlots]);

  const currentSelection = selectionMode === 'start' ? selectedStartTime : selectedEndTime;
  const otherSelection = selectionMode === 'start' ? selectedEndTime : selectedStartTime;

  // Calculate angle for clock position (0-360 degrees)
  const getClockAngle = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return ((hours % 12) * 60 + minutes) / (12 * 60) * 360;
  };

  // Check if a time slot is selectable
  const isSelectableSlot = (time: string) => {
    if (timeSlots.find(s => s.time === time)?.isBooked) return false;
    
    if (selectionMode === 'end' && otherSelection) {
      // End time must be after start time
      return time > otherSelection;
    }
    
    if (selectionMode === 'start' && otherSelection) {
      // Start time must be before end time
      return time < otherSelection;
    }
    
    return true;
  };

  return (
    <div className="space-y-5">
      {/* Mode Selector */}
      <div>
        <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-3">
          Select Time
        </label>
        <div className="p-1 rounded-xl bg-white border border-(--brand-border) flex relative overflow-hidden">
          <button
            onClick={() => setSelectionMode('start')}
            className={`relative z-10 flex-1 py-2.5 text-xs font-bold transition-colors duration-300 rounded-lg ${
              selectionMode === 'start' 
                ? 'text-(--brand-blue)' 
                : 'text-(--brand-muted) hover:text-(--brand-ink)'
            }`}
          >
            Start {selectedStartTime && `(${selectedStartTime})`}
          </button>
          <button
            onClick={() => setSelectionMode('end')}
            className={`relative z-10 flex-1 py-2.5 text-xs font-bold transition-colors duration-300 rounded-lg ${
              selectionMode === 'end'
                ? 'text-(--brand-blue)' 
                : 'text-(--brand-muted) hover:text-(--brand-ink)'
            }`}
          >
            End {selectedEndTime && `(${selectedEndTime})`}
          </button>

          <div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-linear-to-br from-(--brand-blue)/10 to-(--brand-green)/5 rounded-lg border border-(--brand-blue)/20 transition-transform duration-300 ease-out z-0"
            style={{ transform: selectionMode === 'start' ? 'translateX(0)' : 'translateX(calc(100% + 4px))' }}
          />
        </div>
      </div>

      {/* Clock Visualization */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-60 h-60 rounded-full border-2 border-(--brand-border) bg-white shadow-[0_8px_32px_rgba(74,144,164,0.08)] flex items-center justify-center">
          
          {/* Center dot */}
          <div className="absolute w-2.5 h-2.5 rounded-full bg-(--brand-ink)" />
          
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 360) / 12;
            const x = 100 * Math.cos((angle - 90) * (Math.PI / 180));
            const y = 100 * Math.sin((angle - 90) * (Math.PI / 180));
            return (
              <div
                key={i}
                className="absolute text-xs font-bold text-(--brand-ink)"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-8px',
                  marginTop: '-8px'
                }}
              >
                {i === 0 ? 12 : i}
              </div>
            );
          })}

          {/* Time slot dots */}
          {timeSlots.map((slot) => {
            const angle = (slot.hour / 12) * 360 - 90;
            const radius = 85;
            const x = radius * Math.cos((angle) * (Math.PI / 180));
            const y = radius * Math.sin((angle) * (Math.PI / 180));

            const isCurrentSlot = currentSelection === slot.time;
            const isSelectable = isSelectableSlot(slot.time);

            return (
              <button
                key={slot.time}
                onClick={() => {
                  if (isSelectable) {
                    if (selectionMode === 'start') {
                      onStartTimeChange(slot.time);
                    } else {
                      onEndTimeChange(slot.time);
                    }
                  }
                }}
                disabled={!isSelectable}
                className={`absolute rounded-full transition-all ${
                  slot.isBooked
                    ? 'w-2 h-2 bg-(--ui-error)/40 cursor-not-allowed'
                    : isCurrentSlot
                    ? 'w-4 h-4 bg-linear-to-br from-(--brand-blue) to-(--brand-green) shadow-lg shadow-(--brand-blue)/40 z-10 cursor-pointer'
                    : isSelectable
                    ? 'w-2 h-2 bg-(--brand-border) hover:bg-(--brand-blue) hover:w-3 hover:h-3 cursor-pointer'
                    : 'w-2 h-2 bg-(--brand-border)/30 cursor-not-allowed'
                }`}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-6px',
                  marginTop: '-6px'
                }}
                title={`${slot.time}${slot.isBooked ? ' (Booked)' : ''}`}
              />
            );
          })}
        </div>
      </div>

      {/* Time Grid */}
      <div>
        <p className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider mb-3">Quick Select</p>
        <div className="grid grid-cols-6 gap-1.5">
          {timeSlots
            .filter((_, i) => i % 2 === 0)
            .map((slot) => {
              const isCurrentSlot = currentSelection === slot.time;
              const isSelectable = isSelectableSlot(slot.time);

              return (
                <button
                  key={slot.time}
                  onClick={() => {
                    if (isSelectable) {
                      if (selectionMode === 'start') {
                        onStartTimeChange(slot.time);
                      } else {
                        onEndTimeChange(slot.time);
                      }
                    }
                  }}
                  disabled={!isSelectable}
                  className={`py-2 px-2 rounded-lg font-bold text-xs transition-all border ${
                    slot.isBooked
                      ? 'bg-(--ui-error)/8 text-(--ui-error) cursor-not-allowed border-(--ui-error)/20'
                      : isCurrentSlot
                      ? 'bg-linear-to-br from-(--brand-blue) to-(--brand-green) text-white shadow-[0_4px_12px_rgba(74,144,164,0.25)] border-(--brand-blue)'
                      : isSelectable
                      ? 'bg-white text-(--brand-ink) border-(--brand-border) hover:border-(--brand-blue) hover:bg-(--background)/50 cursor-pointer'
                      : 'bg-background text-(--brand-muted) cursor-not-allowed border-(--brand-border)/50'
                  }`}
                >
                  {slot.time}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
