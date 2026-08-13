'use client';
import { useState, useMemo } from 'react';
import { toLocalYMD } from '../../lib/api';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const dates = useMemo(() => {
    const result = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      result.push({
        date: toLocalYMD(date),
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: i === 0
      });
    }
    
    return result;
  }, []);

  return (
    <div>
      <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-widest block mb-2.5 ml-0.5">
        Select Date
      </label>
      <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {dates.map((d) => {
          const isSelected = selectedDate === d.date;
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => onDateChange(d.date)}
              className={`flex flex-col items-center min-w-[72px] px-3 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap border cursor-pointer ${
                isSelected
                  ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white border-transparent shadow-md shadow-(--brand-blue)/20 scale-[1.02]'
                  : 'bg-(--surface-soft) hover:bg-(--surface-tint) text-(--brand-ink) border-(--brand-border) hover:border-(--brand-blue)/40'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-(--brand-muted)'}`}>
                {d.dayName}
              </span>
              <span className="font-bold text-sm mt-0.5">{d.displayDate}</span>
              {d.isToday && (
                <span className={`text-[9px] font-extrabold mt-1 uppercase tracking-widest ${isSelected ? 'text-white bg-white/20 px-1.5 py-0.2 rounded-full' : 'text-(--brand-green-deep)'}`}>
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
