'use client';
import { useState, useMemo } from 'react';

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
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: i === 0
      });
    }
    
    return result;
  }, []);

  return (
    <div>
      <label className="text-xs font-bold text-(--brand-muted) uppercase tracking-wider block mb-4">
        Select Date
      </label>
      <div className="flex gap-2.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-(--brand-border) [&::-webkit-scrollbar-track]:bg-transparent">
        {dates.map((d) => (
          <button
            key={d.date}
            onClick={() => onDateChange(d.date)}
            className={`flex flex-col items-center px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap border ${
              selectedDate === d.date
                ? 'bg-linear-to-br from-(--brand-blue)/15 to-(--brand-green)/10 text-(--brand-blue) border-(--brand-blue) shadow-[0_4px_20px_rgba(74,144,164,0.15)]'
                : 'bg-white border-(--brand-border) text-(--brand-ink) hover:border-(--brand-blue)/40 hover:bg-(--background)/50'
            }`}
          >
            <span className="text-xs opacity-70 font-semibold">{d.dayName}</span>
            <span className="font-bold mt-0.5">{d.displayDate}</span>
            {d.isToday && <span className="text-[10px] text-(--brand-green) font-bold mt-1">Today</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
