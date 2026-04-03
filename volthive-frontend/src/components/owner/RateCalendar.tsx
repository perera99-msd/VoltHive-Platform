'use client';
import { useState } from 'react';
import { apiUrl } from '../../lib/api';

interface RateEntry {
  dayOfWeek: number; // 0 = Sunday
  startTime: string;
  endTime: string;
  rate: number;
}

interface BaseRateConfig {
  stationId: string;
  baseRate: number;
  customRates: RateEntry[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['00:00', '06:00', '09:00', '12:00', '16:00', '18:00', '21:00'];

interface RateCalendarProps {
  onBack?: () => void;
}

export default function RateCalendar({ onBack }: RateCalendarProps) {
  const [selectedStation, setSelectedStation] = useState('station-1');
  const [baseRate, setBaseRate] = useState<number>(150);
  const [weeklyRates, setWeeklyRates] = useState<RateEntry[]>([]);
  const [editingRate, setEditingRate] = useState<RateEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Temporary mock stations - replace with API call
  const mockStations = [
    { id: 'station-1', name: 'Colombo Hub' },
    { id: 'station-2', name: 'Galle Port' },
  ];

  const addOrUpdateRate = (rate: RateEntry) => {
    if (editingRate) {
      setWeeklyRates(weeklyRates.map(r => 
        r.dayOfWeek === editingRate.dayOfWeek && 
        r.startTime === editingRate.startTime 
          ? rate 
          : r
      ));
      setEditingRate(null);
    } else {
      // Check for duplicate
      const exists = weeklyRates.some(
        r => r.dayOfWeek === rate.dayOfWeek && r.startTime === rate.startTime
      );
      if (exists) {
        alert('Rate for this time slot already exists');
        return;
      }
      setWeeklyRates([...weeklyRates, rate]);
    }
    setShowAddForm(false);
  };

  const deleteRate = (dayOfWeek: number, startTime: string) => {
    setWeeklyRates(weeklyRates.filter(
      r => !(r.dayOfWeek === dayOfWeek && r.startTime === startTime)
    ));
  };

  const saveRates = async () => {
    setIsSaving(true);
    try {
      const config: BaseRateConfig = {
        stationId: selectedStation,
        baseRate,
        customRates: weeklyRates,
      };

      const res = await fetch(apiUrl(`/api/stations/${selectedStation}/rates`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        alert('Rates saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save rates:', error);
      alert('Failed to save rates');
    } finally {
      setIsSaving(false);
    }
  };

  const getCustomRate = (day: number, time: string): number | null => {
    const rate = weeklyRates.find(r => r.dayOfWeek === day && r.startTime === time);
    return rate ? rate.rate : null;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        {onBack && (
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-lg bg-(--brand-border)/50 hover:bg-(--brand-border) flex items-center justify-center transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-(--brand-muted)"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
        )}
        <div>
          <h1 className="text-3xl font-semibold text-(--brand-ink)">Tariff & Rate Calendar</h1>
          <p className="text-(--brand-muted) text-sm">Manage charging rates for different times and days</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Sidebar - Station & Base Rate */}
        <div className="space-y-4">
          
          {/* Station Selector */}
          <div className="bg-white rounded-2xl border border-(--brand-border) p-6">
            <label className="block text-sm font-semibold text-(--brand-ink) mb-3">Select Station</label>
            <select 
              value={selectedStation}
              onChange={(e) => {
                setSelectedStation(e.target.value);
                setWeeklyRates([]);
              }}
              className="w-full px-4 py-3 border border-(--brand-border) rounded-lg focus:border-(--accent-blue) focus:ring-1 focus:ring-(--accent-blue) outline-none transition-all text-sm bg-white"
            >
              {mockStations.map(station => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </div>

          {/* Base Rate */}
          <div className="bg-white rounded-2xl border border-(--brand-border) p-6 sticky top-6">
            <div className="mb-4">
              <p className="text-(--brand-muted) text-xs font-bold uppercase tracking-wider mb-1">Base Rate (Applies Always)</p>
              <h3 className="text-3xl font-light text-(--brand-ink)">{baseRate} <span className="text-sm font-semibold text-(--brand-muted)">LKR/kWh</span></h3>
            </div>

            <div className="bg-(--background) rounded-lg p-3 mb-4">
              <input 
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(Number(e.target.value))}
                step="0.01"
                className="w-full px-3 py-2 bg-transparent outline-none text-sm font-semibold text-(--brand-ink) [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full px-4 py-2.5 bg-(--accent-blue)/10 text-(--brand-blue) font-semibold text-sm rounded-lg hover:bg-(--accent-blue)/20 transition-colors"
            >
              {showAddForm ? 'Cancel' : '+ Add Custom Rate'}
            </button>
          </div>
        </div>

        {/* Main Content - Rate Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-(--brand-border) p-6 overflow-hidden">
          
          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-(--background)/50 rounded-xl border border-(--brand-border)">
              <h3 className="font-semibold text-(--brand-ink) mb-4">
                {editingRate ? 'Edit Rate' : 'Add Custom Rate'}
              </h3>
              <AddRateForm 
                onSubmit={addOrUpdateRate}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingRate(null);
                }}
                initialRate={editingRate}
              />
            </div>
          )}

          {/* Rate Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-(--background) text-(--brand-muted) text-[11px] uppercase tracking-wider font-bold">
                  <th className="px-4 py-3 text-left">Day</th>
                  {TIME_SLOTS.map(time => (
                    <th key={time} className="px-3 py-3 text-center text-xs">{time}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--brand-border)">
                {DAYS.map((day, dayIdx) => (
                  <tr key={day} className="hover:bg-(--background)/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-(--brand-ink)">{day}</td>
                    {TIME_SLOTS.map(time => {
                      const customRate = getCustomRate(dayIdx, time);
                      return (
                        <td key={`${dayIdx}-${time}`} className="px-3 py-3 text-center">
                          <button 
                            onClick={() => {
                              if (customRate) {
                                setEditingRate({
                                  dayOfWeek: dayIdx,
                                  startTime: time,
                                  endTime: '',
                                  rate: customRate,
                                });
                              } else {
                                setEditingRate({
                                  dayOfWeek: dayIdx,
                                  startTime: time,
                                  endTime: '',
                                  rate: baseRate,
                                });
                              }
                              setShowAddForm(true);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              customRate
                                ? 'bg-(--ui-success)/20 text-(--ui-success) hover:bg-(--ui-success)/30'
                                : 'bg-(--brand-border)/50 text-(--brand-muted) hover:bg-(--brand-border)'
                            }`}
                          >
                            {customRate ? `${customRate}` : '–'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Custom Rates List */}
          {weeklyRates.length > 0 && (
            <div className="mt-6 pt-6 border-t border-(--brand-border)">
              <h4 className="text-sm font-bold text-(--brand-ink) mb-3">Custom Rates Applied</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {weeklyRates.map((rate, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-(--background) rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-(--brand-ink)">
                        {DAYS[rate.dayOfWeek]} • {rate.startTime}
                      </p>
                      <p className="text-(--brand-muted) text-xs">{rate.rate} LKR/kWh</p>
                    </div>
                    <button 
                      onClick={() => deleteRate(rate.dayOfWeek, rate.startTime)}
                      className="text-(--ui-error) hover:bg-(--ui-error)/10 px-2 py-1 rounded transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button 
          onClick={() => setWeeklyRates([])}
          className="px-6 py-3 bg-(--brand-border)/50 hover:bg-(--brand-border) text-(--brand-ink) font-semibold rounded-lg transition-colors"
        >
          Discard Changes
        </button>
        <button 
          onClick={saveRates}
          disabled={isSaving}
          className="flex-1 px-6 py-3 bg-(--brand-blue) text-white font-semibold rounded-lg hover:bg-(--brand-blue-deep) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Rate Schedule'}
        </button>
      </div>
    </div>
  );
}

// Subcomponent for adding/editing rates
function AddRateForm({ onSubmit, onCancel, initialRate }: { onSubmit: (rate: any) => void; onCancel: () => void; initialRate?: any }) {
  const [rate, setRate] = useState(initialRate || {
    dayOfWeek: new Date().getDay(),
    startTime: '09:00',
    endTime: '17:00',
    rate: 150,
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-(--brand-muted) block mb-1">Day</label>
          <select 
            value={rate.dayOfWeek}
            onChange={(e) => setRate({ ...rate, dayOfWeek: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-(--brand-border) rounded-lg bg-white outline-none focus:border-(--accent-blue)"
          >
            {DAYS.map((day, idx) => (
              <option key={idx} value={idx}>{day}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-(--brand-muted) block mb-1">Rate (LKR/kWh)</label>
          <input 
            type="number"
            value={rate.rate}
            onChange={(e) => setRate({ ...rate, rate: Number(e.target.value) })}
            step="0.01"
            className="w-full px-3 py-2 text-sm border border-(--brand-border) rounded-lg outline-none focus:border-(--accent-blue)"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          type="button"
          onClick={() => {
            onSubmit(rate);
          }}
          className="flex-1 px-4 py-2 bg-(--ui-success) text-white font-semibold text-sm rounded-lg hover:bg-(--brand-green-deep) transition-colors"
        >
          Save Rate
        </button>
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-(--brand-border)/50 text-(--brand-ink) font-semibold text-sm rounded-lg hover:bg-(--brand-border) transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
