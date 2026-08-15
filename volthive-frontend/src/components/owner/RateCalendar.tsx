'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../../lib/api';
import { auth } from '../../lib/firebase';
import Toast from '../common/Toast';
import ConfirmModal from '../common/ConfirmModal';

interface RateEntry {
  dayOfWeek: number; // 0 = Sunday
  startTime: string;
  endTime: string;
  rate: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = Array.from({ length: 24 }).map((_, i) => `${String(i).padStart(2, '0')}:00`);

interface RateCalendarProps {
  onBack?: () => void;
}

export default function RateCalendar({ onBack }: RateCalendarProps) {
  const [selectedCharger, setSelectedCharger] = useState('');
  const [baseRate, setBaseRate] = useState<number>(0);
  const [weeklyRates, setWeeklyRates] = useState<RateEntry[]>([]);
  const [editingRate, setEditingRate] = useState<RateEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chargers, setChargers] = useState<Array<{ id: string; name: string; stationName?: string; plugType?: string; powerKW?: number; basePrice?: number; raw?: any }>>([]);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' } | null>(null);

  // Custom Dropdown Open State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadChargers = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch(apiUrl('/api/chargers/owner'), { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;

        const payload = await res.json();
        const list = (payload?.data || []).map((c: any) => ({
          id: c._id,
          name: `${c.stationName || 'Station'} • ${c.plugType || 'Charger'}`,
          stationName: c.stationName,
          plugType: c.plugType,
          powerKW: c.powerKW,
          basePrice: c.basePricePerKwh,
          raw: c
        }));
        setChargers(list);
      } catch (error) {
        console.error('Failed to load chargers for rate calendar:', error);
      }
    };

    loadChargers();
  }, []);

  const handleSelectCharger = async (id: string) => {
    setSelectedCharger(id);
    setIsDropdownOpen(false);
    setWeeklyRates([]);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(apiUrl(`/api/chargers/${id}/rates`), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const payload = await res.json();
      const data = payload.data;
      if (data?.rateConfig) {
        setBaseRate(Number(data.rateConfig.baseRate) || Number(data.charger?.basePricePerKwh) || 0);
        setWeeklyRates(data.rateConfig.customRates || []);
      } else {
        setBaseRate(Number(data.charger?.basePricePerKwh) || 0);
        setWeeklyRates([]);
      }
    } catch (err) {
      console.error('Failed to load charger rates', err);
    }
  };

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

  const executeDeleteRate = (dayOfWeek: number, startTime: string) => {
    setWeeklyRates(weeklyRates.filter(
      r => !(r.dayOfWeek === dayOfWeek && r.startTime === startTime)
    ));
    setToastMessage({ msg: `Removed rate override for ${DAYS[dayOfWeek]} @ ${startTime}.`, type: 'success' });
  };

  const requestDeleteRate = (dayOfWeek: number, startTime: string, rateValue: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Hourly Rate Override?',
      message: `Are you sure you want to remove the custom rate of LKR ${rateValue}/kWh on ${DAYS[dayOfWeek]} at ${startTime}? This slot will return to the base rate of LKR ${baseRate}/kWh.`,
      confirmText: 'Remove Override',
      cancelText: 'Keep Rule',
      isDanger: true,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        executeDeleteRate(dayOfWeek, startTime);
      },
    });
  };

  const requestClearOverrides = () => {
    if (weeklyRates.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Scheduled Overrides?',
      message: `Are you sure you want to clear all ${weeklyRates.length} custom hourly rate rules? All slots will revert to the global base rate of LKR ${baseRate}/kWh.`,
      confirmText: 'Clear All Rules',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: () => {
        setWeeklyRates([]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setToastMessage({ msg: 'All custom hourly overrides cleared.', type: 'success' });
      },
    });
  };

  const executeSaveRates = async () => {
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
        setToastMessage({ msg: 'Rate schedule successfully synchronized with hardware unit.', type: 'success' });
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

  const requestSaveRates = () => {
    if (!selectedCharger) {
      setToastMessage({ msg: 'Select a hardware unit before saving rates.', type: 'error' });
      return;
    }
    const targetChargerName = chargers.find(c => c.id === selectedCharger)?.name || 'Selected Unit';
    setConfirmModal({
      isOpen: true,
      title: 'Synchronize Rate Schedule?',
      message: `Apply base tariff of LKR ${baseRate.toFixed(2)}/kWh and ${weeklyRates.length} custom hourly rules to ${targetChargerName}? All future driver bookings and rate calculators will reflect these rates.`,
      confirmText: 'Sync Schedule',
      cancelText: 'Cancel',
      isDanger: false,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        executeSaveRates();
      },
    });
  };

  const getCustomRate = (day: number, time: string): RateEntry | null => {
    return weeklyRates.find(r => r.dayOfWeek === day && r.startTime === time) || null;
  };

  const getDisplayedRate = (day: number, time: string): number => {
    const custom = getCustomRate(day, time);
    return custom ? custom.rate : baseRate;
  };

  const selectedChargerObj = chargers.find(c => c.id === selectedCharger);

  return (
    <div className="w-full relative font-sans space-y-6 pb-24">
      
      {/* ── 1. HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-2xl bg-white border border-[#e0e5e3] hover:bg-(--surface-soft) flex items-center justify-center transition-colors shadow-2xs cursor-pointer text-(--brand-ink)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white font-black flex items-center justify-center shadow-xs shrink-0">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--brand-ink)">Rate Calculator & Tariff Scheduler</h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-blue)/20 shrink-0">
                Tariff Rules Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-(--brand-muted) font-medium">
              Configure baseline rates, off-peak discounts, and time-based hourly price overrides across network chargers.
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN CONFIGURATION GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 4 COLUMNS: Hardware Selector & Base Rate Card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Target Hardware Selector Card (Custom Rich Dropdown) */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-3 relative z-30" ref={dropdownRef}>
            <label className="block text-[11px] font-black text-(--brand-muted) uppercase tracking-wider">
              Select Hardware Charging Port
            </label>

            {/* Custom Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-(--surface-soft)/40 border border-[#e0e5e3] rounded-2xl transition-all shadow-2xs cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-(--brand-blue)/10 text-(--brand-blue-deep) font-black text-xs flex items-center justify-center shrink-0">
                  ⚡
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-(--brand-ink) truncate">
                    {selectedChargerObj ? selectedChargerObj.stationName : 'Choose a hardware port...'}
                  </p>
                  <p className="text-[10px] text-(--brand-muted) font-semibold truncate">
                    {selectedChargerObj ? `${selectedChargerObj.plugType} (${selectedChargerObj.powerKW} kW)` : 'Select from your stations'}
                  </p>
                </div>
              </div>
              
              <div className={`w-8 h-8 rounded-xl bg-(--surface-soft) flex items-center justify-center text-(--brand-muted) transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180 text-(--brand-blue)' : ''}`}>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>

            {/* Dropdown Menu Options Panel */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-6 right-6 top-[82px] bg-white/95 backdrop-blur-2xl border border-[#e0e5e3] rounded-2xl shadow-xl p-2 z-50 max-h-64 overflow-y-auto space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#e0e5e3] [&::-webkit-scrollbar-thumb]:rounded-full"
                >
                  {chargers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-(--brand-muted) font-semibold">
                      No hardware chargers found on your stations.
                    </div>
                  ) : (
                    chargers.map((ch) => {
                      const isSelected = ch.id === selectedCharger;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => handleSelectCharger(ch.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-linear-to-r from-(--brand-blue)/10 to-(--brand-green)/10 border border-(--brand-blue)/20' 
                              : 'hover:bg-(--surface-soft) text-(--brand-ink)'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className={`text-xs font-black truncate ${isSelected ? 'text-(--brand-blue-deep)' : 'text-(--brand-ink)'}`}>
                              {ch.stationName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-(--surface-soft) text-(--brand-muted) border border-[#e0e5e3]">
                                {ch.plugType}
                              </span>
                              <span className="text-[10px] text-(--brand-muted) font-bold">
                                {ch.powerKW} kW · LKR {ch.basePrice}/kWh
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-(--brand-blue) font-black text-sm shrink-0">✓</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {selectedChargerObj && (
              <p className="text-[11px] text-(--brand-green-deep) font-bold pt-0.5">
                ✓ Hardware port linked: {selectedChargerObj.name}
              </p>
            )}
          </div>

          {/* Global Base Rate Card (Sleek Steppers & Badge) */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden space-y-4">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />
            
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-(--brand-muted) mb-1">Standard Base Rate</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-(--brand-ink) tracking-tight">
                  {baseRate > 0 ? `LKR ${baseRate.toFixed(2)}` : '—'}
                </h3>
                <span className="text-xs font-bold text-(--brand-muted)">/ kWh</span>
              </div>
              <p className="text-xs text-(--brand-muted) font-medium mt-1">
                Default fallback rate applied during standard operating hours.
              </p>
            </div>

            {/* Price Adjuster with Stepper Buttons (Zero Overlap) */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">
                Adjust Base Tariff
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBaseRate(prev => Math.max(0, (prev || 0) - 5))}
                  className="w-11 h-11 rounded-2xl bg-(--surface-soft) border border-[#e0e5e3] hover:bg-white text-(--brand-ink) font-black text-lg flex items-center justify-center shrink-0 shadow-2xs cursor-pointer active:scale-95 transition-all"
                  title="Decrease 5 LKR"
                >
                  −
                </button>
                
                <div className="relative flex-1">
                  <input 
                    type="number"
                    value={baseRate || ''}
                    onChange={(e) => setBaseRate(Math.max(0, Number(e.target.value)))}
                    step="1"
                    placeholder="0"
                    className="w-full pl-4 pr-24 py-3 bg-(--surface-soft)/50 border border-[#e0e5e3] rounded-2xl text-sm font-black text-(--brand-ink) focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) focus:bg-white transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-(--brand-muted) uppercase tracking-wider pointer-events-none bg-white px-2 py-1 rounded-xl border border-[#e0e5e3] shadow-2xs">
                    LKR / kWh
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setBaseRate(prev => (prev || 0) + 5)}
                  className="w-11 h-11 rounded-2xl bg-(--surface-soft) border border-[#e0e5e3] hover:bg-white text-(--brand-ink) font-black text-lg flex items-center justify-center shrink-0 shadow-2xs cursor-pointer active:scale-95 transition-all"
                  title="Increase 5 LKR"
                >
                  +
                </button>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full py-3 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-black text-xs rounded-2xl shadow-xs hover:shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d={showAddForm ? "M6 18L18 6M6 6l12 12" : "M12 4.5v15m7.5-7.5h-15"} />
              </svg>
              <span>{showAddForm ? 'Close Override Form' : 'Add Time-Based Override'}</span>
            </button>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-5 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-(--brand-ink) flex items-center gap-1.5">
              <span>💡</span>
              <span>Tariff Scheduling Guide</span>
            </h4>
            <p className="text-[11px] text-(--brand-muted) font-medium leading-relaxed">
              Click any hour cell in the 24/7 rate matrix on the right to apply peak surge pricing or off-peak discount tariffs.
            </p>
          </div>
        </div>

        {/* RIGHT 8 COLUMNS: Interactive 24/7 Rate Matrix */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedCharger && (
            <div className="py-20 bg-white/80 backdrop-blur-2xl border-2 border-dashed border-[#e0e5e3] rounded-3xl text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-(--surface-soft) border border-[#e0e5e3] flex items-center justify-center mx-auto mb-4 text-(--brand-muted) shadow-2xs">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h3 className="text-base font-black text-(--brand-ink)">Select a Hardware Port</h3>
              <p className="text-xs text-(--brand-muted) mt-1 font-medium max-w-sm mx-auto">
                Choose a charger from the custom dropdown on the left to configure its base price and weekly hourly rate matrix.
              </p>
            </div>
          )}

          {selectedCharger && (
            <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
              
              {/* Form Override Drawer */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-6 border-b border-[#e0e5e3] bg-(--surface-soft)/40 overflow-hidden"
                  >
                    <h3 className="text-sm font-black text-(--brand-ink) tracking-tight mb-3">
                      {editingRate ? 'Edit Custom Hourly Rule' : 'New Time-Based Tariff Rule'}
                    </h3>
                    <AddRateForm 
                      onSubmit={addOrUpdateRate}
                      onCancel={() => { setShowAddForm(false); setEditingRate(null); }}
                      initialRate={editingRate}
                      defaultBaseRate={baseRate}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table Matrix Header */}
              <div className="p-5 border-b border-[#e0e5e3] flex flex-wrap items-center justify-between gap-3 bg-white/60">
                <div>
                  <h3 className="text-sm font-black text-(--brand-ink) tracking-tight">24/7 Weekly Tariff Matrix</h3>
                  <p className="text-[11px] text-(--brand-muted) font-medium">Click any slot to customize the hourly rate.</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--surface-soft) text-(--brand-muted) border border-[#e0e5e3]">
                    <span className="w-2 h-2 rounded-full bg-(--brand-muted)/40" /> Base Rate
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--brand-green)/10 text-(--brand-green-deep) border border-(--brand-green)/20">
                    <span className="w-2 h-2 rounded-full bg-(--brand-green)" /> Custom Override
                  </span>
                </div>
              </div>

              {/* Interactive Matrix Table */}
              <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-[#e0e5e3] [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-(--surface-soft)/40 border-b border-[#e0e5e3]">
                      <th className="px-5 py-3 text-[10px] font-black text-(--brand-muted) uppercase tracking-wider sticky left-0 bg-white/95 backdrop-blur-md z-10 w-20 border-r border-[#e0e5e3]">
                        Day
                      </th>
                      {TIME_SLOTS.map(time => {
                        const h = parseInt(time.split(':')[0]);
                        return (
                          <th key={time} className="px-2.5 py-3 text-[10px] font-black text-(--brand-muted) uppercase tracking-wider text-center min-w-[58px]">
                            {h}h
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e5e3]/60">
                    {DAYS.map((day, dayIdx) => (
                      <tr key={day} className="hover:bg-(--surface-soft)/20 transition-colors">
                        <td className="px-5 py-3 text-xs font-black text-(--brand-ink) sticky left-0 bg-white/95 backdrop-blur-md z-10 border-r border-[#e0e5e3] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.03)]">
                          {day}
                        </td>
                        {TIME_SLOTS.map(time => {
                          const custom = getCustomRate(dayIdx, time);
                          const display = getDisplayedRate(dayIdx, time);
                          const nextHour = TIME_SLOTS[(TIME_SLOTS.indexOf(time) + 1) % TIME_SLOTS.length];
                          return (
                            <td key={`${dayIdx}-${time}`} className="px-1.5 py-2 text-center">
                              <button 
                                onClick={() => {
                                  setEditingRate({ dayOfWeek: dayIdx, startTime: time, endTime: nextHour, rate: custom ? custom.rate : baseRate });
                                  setShowAddForm(true);
                                }}
                                className={`w-full py-1.5 px-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border ${
                                  custom
                                    ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/30 hover:bg-(--brand-green)/20 shadow-2xs font-extrabold'
                                    : 'bg-(--surface-soft)/50 text-(--brand-muted) border-transparent hover:border-[#e0e5e3] hover:text-(--brand-ink)'
                                }`}
                                title={custom ? `Custom Override: ${display} LKR` : `Base Rate: ${display} LKR`}
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
                <div className="p-6 border-t border-[#e0e5e3] bg-(--surface-soft)/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-(--brand-ink) uppercase tracking-wider">
                      Active Time-Based Overrides ({weeklyRates.length})
                    </h4>
                    <button
                      type="button"
                      onClick={requestClearOverrides}
                      className="text-[10px] font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {weeklyRates.map((rate, idx) => (
                      <div key={idx} className="flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 bg-white border border-[#e0e5e3] rounded-2xl shadow-2xs">
                        <span className="text-xs font-black text-(--brand-ink)">{DAYS[rate.dayOfWeek]} @ {rate.startTime}</span>
                        <span className="text-xs font-black text-(--brand-green-deep)">{rate.rate} LKR/kWh</span>
                        <button 
                          onClick={() => requestDeleteRate(rate.dayOfWeek, rate.startTime, rate.rate)}
                          className="w-6 h-6 rounded-xl text-(--brand-muted) hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete Override"
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

      {/* ── 3. STICKY BOTTOM SYNC ACTION BAR ── */}
      {selectedCharger && (
        <div className="fixed bottom-0 left-0 right-0 sm:left-[272px] p-4 bg-white/90 backdrop-blur-2xl border-t border-[#e0e5e3] flex items-center justify-between gap-3 z-30 shadow-lg">
          <div className="text-xs font-semibold text-(--brand-muted) hidden sm:block">
            <span className="font-bold text-(--brand-ink)">{weeklyRates.length} custom rule{weeklyRates.length !== 1 ? 's' : ''}</span> scheduled for this hardware unit.
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {weeklyRates.length > 0 && (
              <button 
                type="button"
                onClick={requestClearOverrides}
                className="px-5 py-2.5 bg-white border border-[#e0e5e3] text-(--brand-ink) font-bold text-xs rounded-xl hover:bg-(--surface-soft) transition-colors cursor-pointer shadow-2xs"
              >
                Clear Overrides
              </button>
            )}
            <button 
              type="button"
              onClick={requestSaveRates}
              disabled={isSaving}
              className="px-6 py-2.5 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-black text-xs rounded-xl hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {isSaving ? 'Syncing Rules...' : 'Sync Rate Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Reusable Toast */}
      <Toast message={toastMessage?.msg || null} type={toastMessage?.type || 'error'} onClose={() => setToastMessage(null)} />

      {/* Reusable Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isLoading={isSaving}
      />
    </div>
  );
}

/* ─────────────────── ADD / EDIT RATE FORM ─────────────────── */

function AddRateForm({ 
  onSubmit, 
  onCancel, 
  initialRate, 
  defaultBaseRate 
}: { 
  onSubmit: (rate: RateEntry) => void; 
  onCancel: () => void; 
  initialRate?: RateEntry | null;
  defaultBaseRate: number;
}) {
  const [rate, setRate] = useState<RateEntry>(initialRate || {
    dayOfWeek: new Date().getDay(),
    startTime: '09:00',
    endTime: '10:00',
    rate: defaultBaseRate || 150,
  });

  const selectCls = "w-full px-4 py-3 bg-white border border-[#e0e5e3] rounded-2xl text-xs font-black text-(--brand-ink) focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) transition-all shadow-2xs cursor-pointer";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider block mb-1.5">Target Day</label>
          <div className="relative">
            <select 
              value={rate.dayOfWeek}
              onChange={(e) => setRate({ ...rate, dayOfWeek: Number(e.target.value) })}
              className={`${selectCls} appearance-none pr-8`}
            >
              {DAYS.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-(--brand-muted)">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider block mb-1.5">Start Time Hour</label>
          <div className="relative">
            <select
              value={rate.startTime}
              onChange={(e) => {
                const start = e.target.value;
                const nextHour = TIME_SLOTS[(TIME_SLOTS.indexOf(start) + 1) % TIME_SLOTS.length];
                setRate({ ...rate, startTime: start, endTime: nextHour });
              }}
              className={`${selectCls} appearance-none pr-8`}
            >
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-(--brand-muted)">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider block mb-1.5">Override Tariff (LKR/kWh)</label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRate(prev => ({ ...prev, rate: Math.max(0, prev.rate - 5) }))}
              className="w-10 h-10 rounded-xl bg-(--surface-soft) border border-[#e0e5e3] hover:bg-white text-(--brand-ink) font-black text-sm flex items-center justify-center shrink-0 shadow-2xs cursor-pointer active:scale-95 transition-all"
            >
              −
            </button>
            <div className="relative flex-1">
              <input 
                type="number"
                value={rate.rate}
                onChange={(e) => setRate({ ...rate, rate: Math.max(0, Number(e.target.value)) })}
                step="1"
                className="w-full px-3 py-2.5 bg-white border border-[#e0e5e3] rounded-xl text-xs font-black text-(--brand-ink) text-center focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) transition-all shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setRate(prev => ({ ...prev, rate: prev.rate + 5 }))}
              className="w-10 h-10 rounded-xl bg-(--surface-soft) border border-[#e0e5e3] hover:bg-white text-(--brand-ink) font-black text-sm flex items-center justify-center shrink-0 shadow-2xs cursor-pointer active:scale-95 transition-all"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2.5 pt-1">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-4 py-2.5 bg-white border border-[#e0e5e3] text-(--brand-muted) hover:text-(--brand-ink) font-bold text-xs rounded-xl hover:bg-(--surface-soft) transition-colors cursor-pointer"
        >
          Discard
        </button>
        <button 
          type="button" 
          onClick={() => onSubmit(rate)} 
          className="px-5 py-2.5 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-black text-xs rounded-xl hover:brightness-105 shadow-xs transition-all cursor-pointer"
        >
          Apply Rule
        </button>
      </div>
    </div>
  );
}
