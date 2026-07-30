'use client';
import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { auth } from '../../lib/firebase';
import Toast from '../common/Toast';

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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = Array.from({ length: 24 }).map((_, i) => `${String(i).padStart(2, '0')}:00`);

interface RateCalendarProps {
  onBack?: () => void;
}

export default function RateCalendar({ onBack }: RateCalendarProps) {
  const [selectedCharger, setSelectedCharger] = useState('');
  const [baseRate, setBaseRate] = useState<number>(150);
  const [weeklyRates, setWeeklyRates] = useState<RateEntry[]>([]);
  const [editingRate, setEditingRate] = useState<RateEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chargers, setChargers] = useState<Array<{ id: string; name: string; raw?: any }>>([]);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' } | null>(null);

  useEffect(() => {
    const loadChargers = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch(apiUrl('/api/chargers/owner'), { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;

        const payload = await res.json();
        const list = (payload?.data || []).map((c: any) => ({ id: c._id, name: `${c.stationName} • ${c.plugType || 'Charger'}`, raw: c }));
        setChargers(list);
      } catch (error) {
        console.error('Failed to load chargers for rate calendar:', error);
      }
    };

    loadChargers();
  }, []);

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
      const exists = weeklyRates.some(
        r => r.dayOfWeek === rate.dayOfWeek && r.startTime === rate.startTime
      );
      if (exists) {
        setToastMessage({ msg: 'Rate for this time slot already exists.', type: 'error' });
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
    if (!selectedCharger) {
      setToastMessage({ msg: 'Select a hardware unit before saving rates.', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Please sign in again. Authentication token is missing.');

      const payload = {
        baseRate,
        customRates: weeklyRates,
      };

      const res = await fetch(apiUrl(`/api/chargers/${selectedCharger}/rates`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setToastMessage({ msg: 'Rate schedule successfully synchronized.', type: 'success' });
      } else {
        setToastMessage({ msg: 'Failed to sync rate schedule.', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to save rates:', error);
      setToastMessage({ msg: 'Network failure syncing rates.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const getCustomRate = (day: number, time: string): RateEntry | null => {
    return weeklyRates.find(r => r.dayOfWeek === day && r.startTime === time) || null;
  };

  const getDisplayedRate = (day: number, time: string): number => {
    const custom = getCustomRate(day, time);
    return custom ? custom.rate : baseRate;
  };

  return (
    <div className="w-full relative font-sans pb-16">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-white border border-(--brand-border)/80 hover:bg-(--surface-soft) flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-(--brand-ink)"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-[24px] font-extrabold tracking-tight text-(--brand-ink)">Rate Scheduler</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--brand-blue)/10 text-(--brand-blue) text-[9px] font-extrabold uppercase tracking-[0.12em] border border-(--brand-blue)/20">
                Tariff Rules
              </span>
            </div>
            <p className="text-[12px] text-(--brand-muted) font-medium">Configure dynamic pricing, peak hours, and base rates for hardware units.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        
        {/* ── LEFT CONFIG PANEL ── */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
            <label className="block text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider mb-2">Target Hardware</label>
            <select 
              value={selectedCharger}
              onChange={async (e) => {
                const id = e.target.value;
                setSelectedCharger(id);
                setWeeklyRates([]);
                try {
                  const token = await auth.currentUser?.getIdToken();
                  const res = await fetch(apiUrl(`/api/chargers/${id}/rates`), { headers: { Authorization: `Bearer ${token}` } });
                  if (!res.ok) return;
                  const payload = await res.json();
                  const data = payload.data;
                  if (data?.rateConfig) {
                    setBaseRate(data.rateConfig.baseRate || data.charger.basePricePerKwh || 150);
                    setWeeklyRates(data.rateConfig.customRates || []);
                  } else {
                    setBaseRate(data.charger.basePricePerKwh || 150);
                    setWeeklyRates([]);
                  }
                } catch (err) {
                  console.error('Failed to load charger rates', err);
                }
              }}
              className="w-full px-4 py-3 bg-white border border-(--brand-border)/80 rounded-xl text-[13px] font-bold text-(--brand-ink) cursor-pointer focus:outline-none focus:border-(--brand-blue) transition-colors"
            >
              <option value="" disabled>Select hardware unit...</option>
              {chargers.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4a90a4] to-[#6cb567] opacity-80" />
            
            <div className="mb-4 mt-1">
              <p className="text-(--brand-muted) text-[10px] font-extrabold uppercase tracking-wider mb-1">Global Base Rate</p>
              <h3 className="text-[28px] font-black text-(--brand-ink) tracking-tight">{baseRate} <span className="text-[12px] font-bold text-(--brand-muted)">LKR/kWh</span></h3>
            </div>

            <div className="relative mb-5">
              <input 
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(Number(e.target.value))}
                step="1"
                className="w-full px-4 py-3 bg-(--surface-soft)/40 border border-(--brand-border)/80 rounded-xl text-[14px] font-bold text-(--brand-ink) focus:outline-none focus:border-(--brand-blue) transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-(--brand-muted)">LKR</span>
            </div>

            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full px-4 py-3 bg-(--brand-blue)/10 text-(--brand-blue) font-bold text-[12px] rounded-xl hover:bg-(--brand-blue)/20 transition-colors cursor-pointer"
            >
              {showAddForm ? 'Cancel Form' : '+ Add Time-Based Override'}
            </button>
          </div>
        </div>

        {/* ── RIGHT CALENDAR AREA ── */}
        <div className="lg:col-span-8">
          {!selectedCharger && (
            <div className="py-16 bg-(--surface-soft)/30 border-2 border-dashed border-(--brand-border)/80 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-(--brand-border)/80 flex items-center justify-center mx-auto mb-4 text-(--brand-muted)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="text-[14px] font-extrabold text-(--brand-ink)">Hardware Unit Required</h3>
              <p className="text-[12px] text-(--brand-muted) mt-1 font-medium">Select a charging unit from the left panel to configure its rate schedule.</p>
            </div>
          )}

          {selectedCharger && (
            <div className="bg-white rounded-2xl border border-(--brand-border)/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
              
              {/* Form Override */}
              {showAddForm && (
                <div className="p-5 border-b border-(--brand-border)/60 bg-(--surface-soft)/40">
                  <h3 className="text-[14px] font-extrabold text-(--brand-ink) tracking-tight mb-4">
                    {editingRate ? 'Edit Rule' : 'New Pricing Rule'}
                  </h3>
                  <AddRateForm 
                    onSubmit={addOrUpdateRate}
                    onCancel={() => { setShowAddForm(false); setEditingRate(null); }}
                    initialRate={editingRate}
                  />
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-(--surface-soft)/40 border-b border-(--brand-border)/60">
                      <th className="px-5 py-3.5 text-[9px] font-extrabold text-(--brand-muted) uppercase tracking-wider sticky left-0 bg-(--surface-soft)/90 backdrop-blur z-10 w-16">Day</th>
                      {TIME_SLOTS.map(time => {
                        const h = parseInt(time.split(':')[0]);
                        return <th key={time} className="px-3 py-3.5 text-[9px] font-extrabold text-(--brand-muted) uppercase tracking-wider text-center min-w-[60px]">{h}h</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--brand-border)/50">
                    {DAYS.map((day, dayIdx) => (
                      <tr key={day} className="hover:bg-(--surface-soft)/20 transition-colors">
                        <td className="px-5 py-3 text-[11px] font-extrabold text-(--brand-ink) sticky left-0 bg-white/90 backdrop-blur z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] border-r border-(--brand-border)/50">
                          {day}
                        </td>
                        {TIME_SLOTS.map(time => {
                          const custom = getCustomRate(dayIdx, time);
                          const display = getDisplayedRate(dayIdx, time);
                          const nextHour = TIME_SLOTS[(TIME_SLOTS.indexOf(time) + 1) % TIME_SLOTS.length];
                          return (
                            <td key={`${dayIdx}-${time}`} className="px-2 py-2 text-center">
                              <button 
                                onClick={() => {
                                  setEditingRate({ dayOfWeek: dayIdx, startTime: time, endTime: nextHour, rate: custom ? custom.rate : baseRate });
                                  setShowAddForm(true);
                                }}
                                className={`w-full py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                                  custom
                                    ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20 hover:bg-(--brand-green)/20'
                                    : 'bg-(--surface-soft)/40 text-(--brand-muted) border-transparent hover:border-(--brand-border)'
                                }`}
                                title={custom ? `Custom Rate: ${display} LKR` : `Base Rate: ${display} LKR`}
                              >
                                {display}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Active Rules List */}
              {weeklyRates.length > 0 && (
                <div className="p-5 border-t border-(--brand-border)/60 bg-(--surface-soft)/20">
                  <h4 className="text-[12px] font-extrabold text-(--brand-ink) uppercase tracking-wider mb-3">Active Overrides</h4>
                  <div className="flex flex-wrap gap-2">
                    {weeklyRates.map((rate, idx) => (
                      <div key={idx} className="flex items-center gap-2 pl-3 pr-1 py-1 bg-white border border-(--brand-border)/80 rounded-lg shadow-sm">
                        <span className="text-[10px] font-extrabold text-(--brand-ink)">{DAYS[rate.dayOfWeek]} @ {rate.startTime}</span>
                        <span className="text-[10px] font-bold text-(--brand-green-deep)">{rate.rate} LKR</span>
                        <button 
                          onClick={() => deleteRate(rate.dayOfWeek, rate.startTime)}
                          className="w-6 h-6 rounded-md text-(--ui-error) hover:bg-(--ui-error)/10 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ACTIONS ── */}
      {selectedCharger && (
        <div className="fixed bottom-0 left-0 right-0 sm:left-[280px] p-4 bg-white/80 backdrop-blur-xl border-t border-(--brand-border)/60 flex justify-end gap-3 z-40">
          <button 
            onClick={() => setWeeklyRates([])}
            className="px-6 py-3 bg-white border border-(--brand-border)/80 text-(--brand-ink) font-bold text-[13px] rounded-xl hover:bg-(--surface-soft) transition-colors cursor-pointer shadow-sm"
          >
            Clear Overrides
          </button>
          <button 
            onClick={saveRates}
            disabled={isSaving}
            className="px-8 py-3 bg-(--brand-blue) text-white font-bold text-[13px] rounded-xl hover:bg-(--brand-blue-deep) disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
          >
            {isSaving ? 'Syncing Rules...' : 'Sync Rate Schedule'}
          </button>
        </div>
      )}

      <Toast message={toastMessage?.msg || null} type={toastMessage?.type || 'error'} onClose={() => setToastMessage(null)} />
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

  const inputCls = "w-full px-3 py-2.5 bg-white border border-(--brand-border)/80 rounded-lg text-[12px] font-bold text-(--brand-ink) focus:outline-none focus:border-(--brand-blue) transition-colors shadow-sm cursor-pointer";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-wider block mb-1.5">Target Day</label>
          <select 
            value={rate.dayOfWeek}
            onChange={(e) => setRate({ ...rate, dayOfWeek: Number(e.target.value) })}
            className={inputCls}
          >
            {DAYS.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-wider block mb-1.5">Override Rate (LKR/kWh)</label>
          <input 
            type="number"
            value={rate.rate}
            onChange={(e) => setRate({ ...rate, rate: Number(e.target.value) })}
            step="1"
            className={`${inputCls} cursor-text`}
          />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-white border border-(--brand-border)/80 text-(--brand-ink) font-bold text-[12px] rounded-lg hover:bg-(--surface-soft) transition-colors cursor-pointer">
          Discard
        </button>
        <button type="button" onClick={() => onSubmit(rate)} className="flex-1 px-5 py-2.5 bg-(--brand-ink) text-white font-bold text-[12px] rounded-lg hover:bg-black transition-colors cursor-pointer">
          Apply Rule
        </button>
      </div>
    </div>
  );
}
