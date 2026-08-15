'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import ConfirmModal from '../../common/ConfirmModal';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '1.25rem' };

/* ──────────────────────────── TYPES ──────────────────────────── */

type HourlyData = {
  time: string;
  hour: number;
  occupancy: number;
  multiplier: number;
  recommendation: string;
};

type PlanEntry = {
  hourSlot: string;
  effectiveRate: number;
  originalRate: number;
  multiplier: number;
  expiresAt: string;
  appliedAt?: string;
};

type DailyData = {
  day: string;
  date: string;
  fullDate?: string;
  occupancy: number;
  avgMultiplier: number;
  status: string;
};

type SpecialEvent = {
  _id: string;
  title: string;
  date: string;
  time?: string;
  locationName?: string;
  latitude?: number | null;
  longitude?: number | null;
  category: string;
};

type StationItem = {
  _id: string;
  stationName: string;
  address?: string;
  location?: { coordinates: [number, number] };
};

type ForecastPayload = {
  status: string;
  aiConnected?: boolean;
  weatherConnected?: boolean;
  station?: {
    id: string;
    name: string;
    city: string;
    coordinates: [number, number];
    basePricePerKwh?: number;
    pricingProfile?: string;
    pricePlan?: PlanEntry[];
    activePriceOverride?: PlanEntry | null;
  };
  weather: { condition: string; temp: number; source: string };
  specialEvents: SpecialEvent[];
  activeEvent?: SpecialEvent | null;
  hourly: HourlyData[];
  daily: DailyData[];
  lastUpdated: string;
};

/* ─────────────────── COMBO CHART TOOLTIP ─────────────────── */

type TooltipEntry = {
  dataKey?: string | number;
  value?: number | string;
};

const ComboTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string | number }) => {
  if (!active || !payload?.length) return null;
  const occ = payload.find(p => p.dataKey === 'occupancy')?.value;
  const mult = payload.find(p => p.dataKey === 'multiplier')?.value;
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-[#e0e5e3] rounded-2xl px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)] font-sans">
      <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider mb-1.5">{label}</p>
      <div className="space-y-1.5">
        <p className="text-xs font-black text-(--brand-ink) flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-(--brand-blue)" />
          Grid Occupancy: <span className="text-(--brand-blue-deep) font-black">{Math.round(Number(occ))}%</span>
        </p>
        <p className="text-xs font-black text-(--brand-ink) flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f4b740]" />
          Surge Multiplier: <span className="text-[#c58d1b] font-black">{Number(mult).toFixed(2)}x</span>
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────── KPI CARD COMPONENT ─────────────────────── */

type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  sub: string;
  iconPath: string;
  spark: { v: number }[];
  sparkColor: string;
  delay?: number;
};

function KpiCard({ title, value, change, sub, iconPath, spark, sparkColor, delay = 0 }: KpiCardProps) {
  const gradId = `spark-${title.replace(/\s+/g, '')}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />

      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-black text-(--brand-muted) uppercase tracking-[0.14em]">{title}</p>
        <div className="w-9 h-9 rounded-2xl bg-(--surface-soft)/60 border border-[#e0e5e3] flex items-center justify-center text-(--brand-blue-deep) shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-black text-(--brand-ink) tracking-tight">{value}</span>
        <span className="text-[11px] font-black text-(--brand-blue-deep) uppercase tracking-wide">{change}</span>
      </div>

      <p className="text-xs text-(--brand-muted) font-medium mb-3">{sub}</p>

      {/* Mini Sparkline Chart */}
      <div className="h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={sparkColor}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ────────────────────────── MAIN COMPONENT ────────────────────────── */

export default function AiPredictionView() {
  const { user } = useAuth();
  const [data, setData] = useState<ForecastPayload | null>(null);
  const [stations, setStations] = useState<StationItem[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [planBusySlot, setPlanBusySlot] = useState<string | null>(null);

  // Special Events modal / form
  const [showEventForm, setShowEventForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLat, setNewLat] = useState<string>('');
  const [newLng, setNewLng] = useState<string>('');
  const [addingEvent, setAddingEvent] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Universal Confirmation Modal State
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

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // 1. Fetch Owner Stations List
  useEffect(() => {
    const fetchStations = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(apiUrl('/api/stations/owner'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const body = await res.json();
          const items: StationItem[] = body.data || [];
          setStations(items);
          if (items.length > 0) {
            setSelectedStationId(items[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load owner stations', err);
      }
    };
    fetchStations();
  }, [user]);

  // 2. Fetch AI Forecast for the currently selected station
  const fetchStationForecast = useCallback(async (stationId: string) => {
    if (!user || !stationId) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/ai/forecast/${stationId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json: ForecastPayload = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch AI forecast', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Trigger forecast load when selected station changes
  useEffect(() => {
    if (selectedStationId) {
      setLoading(true);
      fetchStationForecast(selectedStationId);
    }
  }, [selectedStationId, fetchStationForecast]);

  // Polling: Auto-refresh data every 60s (checking visibility)
  useEffect(() => {
    if (!selectedStationId) return;
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchStationForecast(selectedStationId);
    }, 60000);
    return () => clearInterval(intervalId);
  }, [selectedStationId, fetchStationForecast]);

  // 3. Handle station change from dropdown
  const handleStationChange = (id: string) => {
    setSelectedStationId(id);
    setNewLat('');
    setNewLng('');
  };

  // 4. Force calculate/refresh button handler
  const handleForceRefresh = async () => {
    if (!selectedStationId || refreshing) return;
    setRefreshing(true);
    await fetchStationForecast(selectedStationId);
  };

  // 5. Add Special Event (Proximity trigger)
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStationId || !newTitle || !newDate) return;
    setAddingEvent(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/ai/station-events/${selectedStationId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          date: newDate,
          time: newTime,
          locationName: newLocationName,
          latitude: newLat ? parseFloat(newLat) : undefined,
          longitude: newLng ? parseFloat(newLng) : undefined,
          category: 'other',
        })
      });
      if (res.ok) {
        setNewTitle('');
        setNewDate('');
        setNewTime('12:00');
        setNewLocationName('');
        setNewLat('');
        setNewLng('');
        setShowEventForm(false);
        setOverrideSuccessMsg('Special event registered within proximity radius.');
        setTimeout(() => setOverrideSuccessMsg(null), 6000);
        fetchStationForecast(selectedStationId);
      }
    } catch (err) {
      console.error('Failed to add special event', err);
    } finally {
      setAddingEvent(false);
    }
  };

  // 6. Delete Special Event (with confirmation)
  const executeDeleteEvent = async (eventId: string) => {
    if (!user || !selectedStationId) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/ai/station-events/${selectedStationId}/${eventId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setOverrideSuccessMsg('Special event removed.');
        setTimeout(() => setOverrideSuccessMsg(null), 5000);
        fetchStationForecast(selectedStationId);
      }
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  const requestDeleteEvent = (eventId: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Special Event?',
      message: `Are you sure you want to remove "${title}"? This event will no longer contribute to proximity surge multipliers.`,
      confirmText: 'Remove Event',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        executeDeleteEvent(eventId);
      },
    });
  };

  // 7. Toggle a specific hour slot in the station's AI Price Plan (with confirmation)
  const executeApplyPlanSlot = async (slotData: HourlyData) => {
    if (!user || !selectedStationId || planBusySlot) return;
    setPlanBusySlot(slotData.time);
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/ai/price-plan/${selectedStationId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          hourSlot: slotData.time,
          multiplier: slotData.multiplier,
          hour: slotData.hour
        })
      });
      if (res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.pricePlan) {
          setData(prev => prev ? {
            ...prev,
            station: prev.station ? {
              ...prev.station,
              pricePlan: body.pricePlan,
              activePriceOverride: body.activePriceOverride || null
            } : prev.station
          } : prev);
        }
        setOverrideSuccessMsg(`AI rate scheduled for ${slotData.time} slot.`);
        setTimeout(() => setOverrideSuccessMsg(null), 6000);
      }
    } catch (err) {
      console.error('Failed to apply plan slot', err);
    } finally {
      setPlanBusySlot(null);
    }
  };

  const executeRevertPlanSlot = async (hourSlot: string) => {
    if (!user || !selectedStationId || planBusySlot) return;
    setPlanBusySlot(hourSlot);
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/ai/price-plan/${selectedStationId}/${encodeURIComponent(hourSlot)}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.pricePlan) {
          setData(prev => prev ? {
            ...prev,
            station: prev.station ? {
              ...prev.station,
              pricePlan: body.pricePlan,
              activePriceOverride: body.activePriceOverride || null
            } : prev.station
          } : prev);
        }
        setOverrideSuccessMsg(`AI price reverted for ${hourSlot} slot.`);
        setTimeout(() => setOverrideSuccessMsg(null), 6000);
      }
    } catch (err) {
      console.error('Failed to revert plan slot', err);
    } finally {
      setPlanBusySlot(null);
    }
  };

  const handleTogglePlanSlot = (slotData: HourlyData, currentlyApplied: boolean) => {
    if (currentlyApplied) {
      requestRevertPlanSlot(slotData.time);
    } else {
      const basePrice = Number(data?.station?.basePricePerKwh) || 0;
      const effectiveRate = basePrice * slotData.multiplier;
      const diff = effectiveRate - basePrice;
      const surgeLabel = diff > 0 ? `+LKR ${diff.toFixed(2)}/kWh surge` : diff < 0 ? `−LKR ${Math.abs(diff).toFixed(2)}/kWh discount` : 'standard';

      setConfirmModal({
        isOpen: true,
        title: `Schedule AI Price for ${slotData.time}?`,
        message: `Set dynamic rate of LKR ${effectiveRate.toFixed(2)}/kWh (${slotData.multiplier.toFixed(2)}x, ${surgeLabel}) for the ${slotData.time} slot? Drivers booking this hour will be billed this rate until the hour concludes.`,
        confirmText: 'Schedule AI Rate',
        cancelText: 'Cancel',
        isDanger: false,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          executeApplyPlanSlot(slotData);
        },
      });
    }
  };

  const requestRevertPlanSlot = (hourSlot: string) => {
    const basePrice = Number(data?.station?.basePricePerKwh) || 0;
    setConfirmModal({
      isOpen: true,
      title: `Revert AI Price for ${hourSlot}?`,
      message: `Clear scheduled AI pricing for the ${hourSlot} slot? The rate will immediately return to base (LKR ${basePrice.toFixed(2)}/kWh).`,
      confirmText: 'Revert to Base',
      cancelText: 'Cancel',
      isDanger: false,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        executeRevertPlanSlot(hourSlot);
      },
    });
  };

  // 8. Revert ALL scheduled AI prices at once (with confirmation)
  const executeRevertAllPlan = async () => {
    if (!user || !selectedStationId || planBusySlot) return;
    setPlanBusySlot('__all__');
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/ai/price-plan/${selectedStationId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.pricePlan) {
          setData(prev => prev ? {
            ...prev,
            station: prev.station ? {
              ...prev.station,
              pricePlan: body.pricePlan,
              activePriceOverride: body.activePriceOverride || null
            } : prev.station
          } : prev);
        }
        setOverrideSuccessMsg('All scheduled AI prices reverted to standard base rate.');
        setTimeout(() => setOverrideSuccessMsg(null), 8000);
      }
    } catch (err) {
      console.error('Failed to revert all plan slots', err);
    } finally {
      setPlanBusySlot(null);
    }
  };

  const requestRevertAllPlan = () => {
    const basePrice = Number(data?.station?.basePricePerKwh) || 0;
    const planCount = data?.station?.pricePlan?.length || 0;
    setConfirmModal({
      isOpen: true,
      title: 'Revert All Scheduled AI Prices?',
      message: `Are you sure you want to clear all ${planCount} scheduled AI price slots for this station? All hours will immediately revert to the normal base rate (LKR ${basePrice.toFixed(2)}/kWh).`,
      confirmText: 'Revert All Slots',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        executeRevertAllPlan();
      },
    });
  };

  // 9. Change this station's AI pricing aggressiveness profile (with confirmation)
  const executeProfileChange = async (profile: 'conservative' | 'balanced' | 'aggressive') => {
    if (!user || !selectedStationId || savingProfile) return;
    setSavingProfile(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/stations/${selectedStationId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pricingProfile: profile })
      });
      if (res.ok) {
        setStations(prev => prev.map(s => s._id === selectedStationId ? { ...s, pricingProfile: profile } : s));
        setOverrideSuccessMsg(`AI pricing profile set to ${profile.toUpperCase()}. Dynamic multipliers now follow this curve.`);
        setTimeout(() => setOverrideSuccessMsg(null), 6000);
        fetchStationForecast(selectedStationId);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.message || 'Failed to update pricing profile.');
      }
    } catch (err) {
      console.error('Failed to update pricing profile', err);
      alert('Failed to update pricing profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const requestProfileChange = (profile: 'conservative' | 'balanced' | 'aggressive') => {
    const currentProf = data?.station?.pricingProfile || 'balanced';
    if (currentProf === profile) return;
    const profileLabels = {
      conservative: 'Conservative (0.92x – 1.15x)',
      balanced: 'Balanced (0.90x – 1.30x)',
      aggressive: 'Aggressive (0.85x – 1.45x)',
    };
    setConfirmModal({
      isOpen: true,
      title: `Switch AI Pricing to ${profile.toUpperCase()}?`,
      message: `Change dynamic demand curve to ${profile.toUpperCase()}? Multiplier ceiling: ${profileLabels[profile]}. Automated recommendations for this station will recalculate accordingly.`,
      confirmText: `Set ${profile.toUpperCase()}`,
      cancelText: 'Cancel',
      isDanger: false,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        executeProfileChange(profile);
      },
    });
  };

  const currentStation = stations.find(s => s._id === selectedStationId);
  const isAiOnline = data?.aiConnected !== false && (data?.hourly && data.hourly.length > 0);
  const baseRate = Number(data?.station?.basePricePerKwh) || 0;
  const pricePlan: PlanEntry[] = data?.station?.pricePlan || [];
  const activeOverride = data?.station?.activePriceOverride || null;
  const appliedSlots = new Map(pricePlan.map(p => [p.hourSlot, p]));

  const currentProfile = data?.station?.pricingProfile || 'balanced';
  const PROFILE_CAPS: Record<string, number> = { conservative: 1.15, balanced: 1.3, aggressive: 1.45 };
  const PROFILE_FLOORS: Record<string, number> = { conservative: 0.92, balanced: 0.9, aggressive: 0.85 };
  const profileCap = PROFILE_CAPS[currentProfile] ?? 1.3;
  const profileFloor = PROFILE_FLOORS[currentProfile] ?? 0.9;

  /* ── Derived Metrics for KPIs ── */
  const hourly = data?.hourly || [];
  const daily = data?.daily || [];
  const avgMult = hourly.length ? hourly.reduce((s, h) => s + h.multiplier, 0) / hourly.length : 0;
  const peakSlot = hourly.reduce(
    (mx, h) => (h.occupancy > mx.occupancy ? h : mx),
    hourly[0] || { occupancy: 0, time: '--' }
  );
  const currentSlot = hourly[0] || null;
  const activeRateKwh = activeOverride ? Number(activeOverride.effectiveRate) : baseRate;

  const kpis = [
    {
      title: 'Peak Grid Demand',
      value: hourly.length ? `${Math.round(peakSlot.occupancy)}%` : '--',
      change: hourly.length ? `@ ${peakSlot.time}` : '—',
      sub: 'Next 6 hours forecast',
      iconPath: 'M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941',
      spark: hourly.map(h => ({ v: h.occupancy })),
      sparkColor: '#2563eb',
    },
    {
      title: 'Avg Surge Multiplier',
      value: hourly.length ? `${avgMult.toFixed(2)}x` : '--',
      change: avgMult >= 1.25 ? 'High Surge' : avgMult > 1 ? 'Elevated' : 'Standard',
      sub: 'Automated ML forecast',
      iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
      spark: hourly.map(h => ({ v: h.multiplier })),
      sparkColor: '#f4b740',
    },
    {
      title: 'Live Port Occupancy',
      value: hourly.length ? `${Math.round(currentSlot?.occupancy || 0)}%` : '--',
      change: 'Live Telemetry',
      sub: currentSlot ? `Slot ${currentSlot.time}` : 'Pending sync',
      iconPath: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
      spark: hourly.map(h => ({ v: h.occupancy })),
      sparkColor: '#2fb39a',
    },
    {
      title: 'Active Energy Rate',
      value: `LKR ${activeRateKwh.toFixed(2)}`,
      change: activeOverride ? 'Dynamic Live' : 'Base Rate',
      sub: '/ kWh tariff',
      iconPath: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      spark: hourly.map(h => ({ v: Math.round(baseRate * h.multiplier) })),
      sparkColor: '#0ea5e9',
    },
  ];

  return (
    <div className="w-full space-y-6 font-sans pb-16">

      {/* ══════════ 1. HEADER BANNER & CONTROLS ══════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:px-6 sm:py-5 bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white font-black flex items-center justify-center shadow-xs shrink-0">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-(--brand-ink)">
                AI Demand & Dynamic Pricing
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-(--brand-green)/10 text-(--brand-green-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-green)/20 hidden sm:inline-block">
                Inference Live
              </span>
            </div>
            <p className="text-xs text-(--brand-muted) font-medium mt-0.5">
              Real-time grid occupancy forecasting and dynamic pricing multipliers powered by Python ML microservices.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap lg:flex-nowrap">
          {/* Station Selector Dropdown */}
          {stations.length > 1 && (
            <div className="relative">
              <select
                value={selectedStationId}
                onChange={e => handleStationChange(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-2xl bg-white border border-[#e0e5e3] text-xs font-extrabold text-(--brand-ink) focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 cursor-pointer shadow-2xs min-w-[200px]"
              >
                {stations.map(st => (
                  <option key={st._id} value={st._id}>{st.stationName}</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-(--brand-muted)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          )}

          {/* AI Aggressiveness Profile Selector */}
          {currentStation && (
            <div
              className="flex items-center gap-1 p-1 rounded-2xl bg-(--surface-soft)/60 border border-[#e0e5e3] shadow-2xs"
              title="Change dynamic pricing curve aggressiveness"
            >
              <span className="pl-2 pr-1 text-[9px] font-black uppercase tracking-wider text-(--brand-muted) hidden sm:block">Profile</span>
              {(['conservative', 'balanced', 'aggressive'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  disabled={savingProfile}
                  onClick={() => requestProfileChange(p)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black capitalize transition-all cursor-pointer disabled:opacity-60 ${
                    currentProfile === p
                      ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white shadow-2xs'
                      : 'text-(--brand-muted) hover:text-(--brand-ink) hover:bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Force Refresh Button */}
          <button
            type="button"
            onClick={handleForceRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-(--surface-soft) border border-[#e0e5e3] text-(--brand-ink) text-xs font-black shadow-2xs transition-all cursor-pointer disabled:opacity-70 disabled:cursor-wait shrink-0 active:scale-95"
          >
            <svg className={`w-3.5 h-3.5 text-(--brand-blue-deep) ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>{refreshing ? 'Calculating...' : 'Run Price Check'}</span>
          </button>
        </div>
      </div>

      {/* ══════════ 2. SUCCESS / OVERRIDE BANNER ══════════ */}
      <AnimatePresence>
        {overrideSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-(--brand-green)/10 border border-(--brand-green)/25 text-(--brand-green-deep) font-black text-xs flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-green)">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>{overrideSuccessMsg}</span>
            </div>
            <button onClick={() => setOverrideSuccessMsg(null)} className="text-(--brand-green-deep) hover:text-(--brand-ink) font-bold text-xs cursor-pointer p-1">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ 3. UNIFIED STATUS STRIP ══════════ */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-3.5 border border-[#e0e5e3]/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {isAiOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-(--brand-green)/10 text-(--brand-green-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-green)/20">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) animate-pulse" />
              Inference Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Engine Offline
            </span>
          )}

          {data?.weatherConnected !== false ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-blue)/20">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              {data?.weather.condition} ({data?.weather.temp}°C)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-200">
              Weather Offline
            </span>
          )}

          {activeOverride && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-300">
              Live AI Rate: LKR {Number(activeOverride.effectiveRate).toFixed(2)}/kWh · reverts {activeOverride.expiresAt ? new Date(activeOverride.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'at end of hour'}
            </span>
          )}

          {pricePlan.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-blue)/20">
              {pricePlan.length} AI Price Slot{pricePlan.length > 1 ? 's' : ''} Scheduled
            </span>
          )}
        </div>

        <div className="text-(--brand-muted) font-semibold text-[11px]">
          Last Sync: <span className="text-(--brand-ink) font-extrabold">{data?.lastUpdated || '—'}</span>
        </div>
      </div>

      {/* ══════════ 4. HERO KPI ROW ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[150px] rounded-3xl bg-white/60 border border-[#e0e5e3] animate-pulse" />
          ))
        ) : (
          kpis.map((kpi, i) => (
            <KpiCard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              sub={kpi.sub}
              iconPath={kpi.iconPath}
              spark={kpi.spark}
              sparkColor={kpi.sparkColor}
              delay={i * 0.05}
            />
          ))
        )}
      </div>

      {/* ══════════ 5. MAIN GRID CONTENT ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT 8 COLUMNS: 6-Hour Forecast & Scheduled AI Prices & 7-Day Outlook */}
        <div className="lg:col-span-8 space-y-6">

          {/* ── SECTION 5A: 6-HOUR DEMAND FORECAST & ACTION RADAR ── */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden space-y-5">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />

            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-base font-extrabold text-(--brand-ink) tracking-tight">6-Hour Live Demand Forecast</h2>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Hourly predicted grid capacity & suggested multipliers</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-(--surface-soft) text-(--brand-muted) border border-[#e0e5e3]">
                  <span className="w-2 h-2 rounded-full bg-(--brand-blue)" /> Occupancy
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-(--surface-soft) text-(--brand-muted) border border-[#e0e5e3]">
                  <span className="w-2 h-2 rounded-full bg-[#f4b740]" /> Multiplier
                </span>
              </div>
            </div>

            {!isAiOnline && !loading ? (
              <div className="p-8 text-center rounded-2xl bg-(--surface-soft)/40 border border-dashed border-[#e0e5e3] my-2">
                <p className="text-sm font-extrabold text-(--brand-ink) mb-1">AI Inference Microservice Offline</p>
                <p className="text-xs text-(--brand-muted) max-w-sm mx-auto">
                  Python ML microservice is unreachable on port 5001. Live predictions will reconnect once the microservice is running.
                </p>
              </div>
            ) : (
              <>
                {/* Dual-Axis Combo Chart */}
                <div className="h-[240px] w-full">
                  {loading ? (
                    <div className="w-full h-full rounded-2xl bg-(--surface-soft)/40 animate-pulse" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={hourly} margin={{ top: 10, right: 0, left: -14, bottom: 0 }}>
                        <defs>
                          <linearGradient id="areaGradForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#2fb39a" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6ece9" vertical={false} />
                        <XAxis dataKey="time" stroke="#8fa099" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis
                          yAxisId="occ"
                          stroke="#8fa099"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={v => `${v}%`}
                          domain={[0, 100]}
                        />
                        <YAxis
                          yAxisId="mult"
                          orientation="right"
                          stroke="#c58d1b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={v => `${v}x`}
                          domain={[0, (dataMax: number) => +(dataMax + 0.4).toFixed(2)]}
                        />
                        <Tooltip content={<ComboTooltip />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
                        <Area
                          yAxisId="occ"
                          type="monotone"
                          dataKey="occupancy"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          fill="url(#areaGradForecast)"
                          dot={false}
                        />
                        <Bar yAxisId="mult" dataKey="multiplier" fill="#f4b740" radius={[6, 6, 0, 0]} barSize={20} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Surge Radar Strip — 6 actionable slot chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 bg-(--surface-soft)/40 p-3.5 rounded-2xl border border-[#e0e5e3]/80">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-28 rounded-2xl bg-white animate-pulse" />
                    ))
                  ) : (
                    hourly.map((h, i) => {
                      const isHigh = h.multiplier >= 1.25;
                      const isMod = h.multiplier > 1.0 && h.multiplier < 1.25;
                      const applied = appliedSlots.get(h.time);
                      const suggestedRate = baseRate * h.multiplier;
                      const busy = planBusySlot === h.time;

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                          className={`flex flex-col items-center justify-between p-3 rounded-2xl border text-center transition-all relative ${
                            applied
                              ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                              : 'bg-white border-[#e0e5e3] hover:shadow-xs hover:-translate-y-0.5'
                          }`}
                        >
                          {applied && (
                            <span className="absolute -top-2 right-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500 text-white shadow-2xs">
                              ON
                            </span>
                          )}

                          <span className="text-xs font-black text-(--brand-muted) mb-0.5">{h.time}</span>
                          <span className="text-lg font-black text-(--brand-ink) mb-1">{Math.round(h.occupancy)}%</span>

                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md mb-1.5 ${
                              isHigh
                                ? 'bg-rose-500 text-white'
                                : isMod
                                ? 'bg-[#f4b740] text-white'
                                : 'bg-(--brand-green) text-white'
                            }`}
                          >
                            {h.multiplier.toFixed(2)}x
                          </span>

                          <span className={`text-xs font-black mb-2 ${applied ? 'text-amber-800' : 'text-(--brand-ink)'}`}>
                            LKR {applied ? Number(applied.effectiveRate).toFixed(2) : suggestedRate.toFixed(2)}
                          </span>

                          {/* Toggle switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!!applied}
                            disabled={!!planBusySlot}
                            onClick={() => handleTogglePlanSlot(h, !applied)}
                            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait shrink-0 ${applied ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green)' : 'bg-(--brand-border)'}`}
                            title={applied ? `Revert ${h.time} back to normal rate` : `Apply AI price for ${h.time}`}
                          >
                            <span
                              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${applied ? 'left-[22px]' : 'left-0.5'}`}
                            />
                          </button>

                          <span className="text-[9px] font-bold text-(--brand-muted) mt-1.5 truncate">
                            {applied
                              ? `until ${applied.expiresAt ? new Date(applied.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'HH:MM'}`
                              : busy
                              ? 'updating...'
                              : 'tap to apply'}
                          </span>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── SECTION 5B: SCHEDULED AI PRICES (STATION-WISE PLAN) ── */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />

            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-(--brand-ink) tracking-tight">
                  Scheduled AI Rates & Tariff Plan
                </h2>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">
                  AI rates scheduled for this station — each auto-reverts to base rate when its hour passes.
                </p>
              </div>
              {pricePlan.length > 0 && (
                <button
                  type="button"
                  onClick={requestRevertAllPlan}
                  disabled={!!planBusySlot}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-black uppercase tracking-wider hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <span>Revert All Slots</span>
                </button>
              )}
            </div>

            {pricePlan.length === 0 ? (
              <div className="py-10 text-center rounded-2xl border border-dashed border-[#e0e5e3] bg-(--surface-soft)/20">
                <div className="w-10 h-10 rounded-2xl bg-(--surface-soft) border border-[#e0e5e3] flex items-center justify-center mx-auto text-(--brand-muted) mb-2">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-extrabold text-(--brand-ink)">No AI Prices Scheduled</p>
                <p className="text-xs text-(--brand-muted) font-medium px-6 mt-1 max-w-md mx-auto">
                  Flip the switches in the 6-Hour Forecast above to schedule AI rates for specific hours.
                  Drivers see them only during that hour, then it auto-reverts to the normal rate.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pricePlan
                  .slice()
                  .sort((a, b) => a.hourSlot.localeCompare(b.hourSlot))
                  .map((p, idx) => {
                    const live = activeOverride?.hourSlot === p.hourSlot;
                    const diff = Number(p.effectiveRate) - Number(p.originalRate || baseRate);
                    return (
                      <motion.div
                        key={p.hourSlot + idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        className={`p-4 rounded-2xl border flex flex-col gap-2 ${live ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/40' : 'bg-white border-[#e0e5e3]'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-(--brand-ink)">{p.hourSlot}</span>
                          {live ? (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">Live Now</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => requestRevertPlanSlot(p.hourSlot)}
                              disabled={!!planBusySlot}
                              className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              Revert
                            </button>
                          )}
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="font-mono text-base font-black text-(--brand-ink)">LKR {Number(p.effectiveRate).toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-(--brand-muted)">{Number(p.multiplier).toFixed(2)}x</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className={diff > 0 ? 'text-rose-500 font-black' : diff < 0 ? 'text-(--brand-green-deep) font-black' : 'text-(--brand-muted)'}>
                            {diff > 0 ? `+LKR ${diff.toFixed(2)} surge` : diff < 0 ? `−LKR ${Math.abs(diff).toFixed(2)} discount` : 'same as base'}
                          </span>
                          <span className="text-(--brand-muted)">
                            reverts {p.expiresAt ? new Date(p.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'HH:MM'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ── SECTION 5C: 7-DAY WEEKLY OUTLOOK ── */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />

            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-(--brand-ink) tracking-tight">7-Day Weekly Outlook</h2>
                <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Daily peak load projections & special event factors</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-(--surface-soft) text-(--brand-muted) border border-[#e0e5e3]">
                Multi-Day Model
              </span>
            </div>

            {!isAiOnline && !loading ? (
              <div className="p-6 text-center rounded-2xl bg-(--surface-soft)/30 border border-[#e0e5e3] text-xs text-(--brand-muted)">
                Weekly outlook requires active Python ML microservice sync.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-2xl bg-(--surface-soft) animate-pulse" />
                  ))
                ) : (
                  daily.map((d, i) => {
                    const isHigh = d.avgMultiplier >= 1.20;
                    const prevDay = i > 0 ? daily[i - 1] : null;
                    const trend = prevDay ? d.avgMultiplier - prevDay.avgMultiplier : 0;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                          isHigh
                            ? 'bg-[#f4b740]/10 border-[#f4b740]/30 shadow-2xs'
                            : 'bg-white border-[#e0e5e3] hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-(--brand-ink)">{d.day}</span>
                            <span className="text-[9px] font-bold text-(--brand-muted)">{d.date}</span>
                          </div>

                          <div className="flex items-end justify-between mb-2">
                            <span className={`text-base font-black ${isHigh ? 'text-[#c58d1b]' : 'text-(--brand-ink)'}`}>
                              {d.avgMultiplier.toFixed(2)}x
                            </span>
                            {trend > 0.001 ? (
                              <span className="text-[10px] font-black text-(--brand-green-deep) flex items-center" title="Up from previous day">
                                ↑
                              </span>
                            ) : trend < -0.001 ? (
                              <span className="text-[10px] font-black text-[#c58d1b] flex items-center" title="Down from previous day">
                                ↓
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-(--brand-muted)" title="Steady">─</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="w-full bg-(--surface-soft) h-1.5 rounded-full overflow-hidden border border-[#e0e5e3]/60">
                            <div
                              className={`h-full rounded-full ${isHigh ? 'bg-[#f4b740]' : 'bg-(--brand-blue)'}`}
                              style={{ width: `${Math.min(100, d.occupancy)}%` }}
                            />
                          </div>
                          <p className="text-[9px] font-bold text-(--brand-muted) truncate" title={d.status}>
                            ~{Math.round(d.occupancy)}% · {d.status}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* ── SECTION 5D: PRACTICAL OPERATOR GUIDE ── */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 relative overflow-hidden space-y-4">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />
            <div>
              <h2 className="text-base font-extrabold text-(--brand-ink) tracking-tight">
                Continuous AI Dynamic Pricing Architecture
              </h2>
              <p className="text-xs text-(--brand-muted) font-medium mt-0.5">How dynamic demand forecasting works with continuous tariff curves.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Surge */}
              <div className="p-4 rounded-2xl bg-(--surface-soft)/40 border border-[#e0e5e3]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
                    </svg>
                  </div>
                  <h4 className="text-xs font-black text-(--brand-ink) uppercase tracking-wider">High Demand Surge</h4>
                </div>
                <p className="text-[11px] text-(--brand-muted) font-medium leading-relaxed">
                  Prices scale smoothly with forecasted traffic up to a <b className="text-rose-500 font-bold">{profileCap.toFixed(2)}x ceiling</b>. Schedule it to maximize station revenue during peak rush.
                </p>
              </div>

              {/* Discount */}
              <div className="p-4 rounded-2xl bg-(--surface-soft)/40 border border-[#e0e5e3]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-(--brand-green)/10 border border-(--brand-green)/20 text-(--brand-green-deep) flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    </svg>
                  </div>
                  <h4 className="text-xs font-black text-(--brand-ink) uppercase tracking-wider">Off-Peak Discount</h4>
                </div>
                <p className="text-[11px] text-(--brand-muted) font-medium leading-relaxed">
                  When forecast load is ≤30%, the tariff drops to <b className="text-(--brand-green-deep) font-bold">{profileFloor.toFixed(2)}x floor</b>. Attract drivers to fill idle chargers in slow hours.
                </p>
              </div>

              {/* Auto-revert */}
              <div className="p-4 rounded-2xl bg-(--surface-soft)/40 border border-[#e0e5e3]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 text-(--brand-blue-deep) flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xs font-black text-(--brand-ink) uppercase tracking-wider">Hourly Auto-Revert</h4>
                </div>
                <p className="text-[11px] text-(--brand-muted) font-medium leading-relaxed">
                  Every scheduled AI price applies for exactly one hour slot, then automatically returns to the normal base rate without requiring manual cleanup.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT 4 COLUMNS: AI CONTEXT WIDGET + PROXIMITY SPECIAL EVENTS */}
        <div className="lg:col-span-4 flex flex-col space-y-6">

          {/* ── AI CONTEXT & WEATHER CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] text-(--brand-ink) relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-(--brand-blue) to-(--brand-green)" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted)">
                Model Telemetry Context
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-blue)/20">
                Port 5001 Sync
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Inference status */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-[#e0e5e3]/60">
                <span className="font-bold text-(--brand-muted)">ML Neural Engine</span>
                {isAiOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-(--brand-green)/10 text-(--brand-green-deep) text-[10px] font-black border border-(--brand-green)/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Offline
                  </span>
                )}
              </div>

              {/* Weather */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-[#e0e5e3]/60">
                <span className="font-bold text-(--brand-muted)">Local Ambient Weather</span>
                <span className="font-black text-(--brand-ink)">
                  {data?.weather.condition || 'Clear'} ({data?.weather.temp || 28}°C)
                </span>
              </div>

              {/* Base Rate */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-[#e0e5e3]/60">
                <span className="font-bold text-(--brand-muted)">Station Base Tariff</span>
                <span className="font-mono font-black text-xs text-(--brand-ink)">LKR {baseRate.toFixed(2)}/kWh</span>
              </div>

              {/* Active AI Price (live plan entry) */}
              {activeOverride && (
                <div className="pt-2">
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black flex items-center justify-between">
                    <span>Live AI Price: LKR {Number(activeOverride.effectiveRate).toFixed(2)}/kWh</span>
                    <span className="text-[10px] font-bold text-amber-700">Reverts on hour</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── PROXIMITY SPECIAL EVENTS (10KM) ── */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden space-y-4 flex-1 flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />

            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-extrabold text-(--brand-ink) tracking-tight flex items-center gap-2">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 text-(--brand-blue)">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Proximity Special Events
                </h2>
              </div>
              <p className="text-xs text-(--brand-muted) font-medium">
                Events within a <span className="font-bold text-(--brand-ink)">10km radius</span> factor into surge pricing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowEventForm(!showEventForm)}
              className="w-full py-2.5 rounded-2xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-extrabold text-xs shadow-2xs hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              {showEventForm ? (
                <>
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  <span>Cancel Form</span>
                </>
              ) : (
                <>
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  <span>Schedule Event Near Station</span>
                </>
              )}
            </button>

            {/* Event Form */}
            <AnimatePresence>
              {showEventForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 12 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  onSubmit={handleAddEvent}
                  className="p-4 rounded-2xl bg-(--surface-soft)/40 border border-[#e0e5e3] space-y-3 overflow-hidden text-xs"
                >
                  <div>
                    <label className="font-black text-(--brand-ink) block mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cricket Tournament"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#e0e5e3] text-xs font-semibold focus:outline-none focus:border-(--brand-blue)"
                    />
                  </div>
                  <div>
                    <label className="font-black text-(--brand-ink) block mb-1">Venue Location</label>
                    <input
                      type="text"
                      placeholder="e.g. City Stadium"
                      value={newLocationName}
                      onChange={e => setNewLocationName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#e0e5e3] text-xs font-semibold focus:outline-none focus:border-(--brand-blue)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-black text-(--brand-ink) block mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0e5e3] text-xs font-semibold focus:outline-none focus:border-(--brand-blue)"
                      />
                    </div>
                    <div>
                      <label className="font-black text-(--brand-ink) block mb-1">Time</label>
                      <input
                        type="time"
                        required
                        value={newTime}
                        onChange={e => setNewTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0e5e3] text-xs font-semibold focus:outline-none focus:border-(--brand-blue)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-black text-(--brand-ink) block mb-1">Coordinates</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#e0e5e3] font-semibold text-(--brand-muted) truncate text-xs">
                        {newLat && newLng ? `${Number(newLat).toFixed(3)}, ${Number(newLng).toFixed(3)}` : 'No pin set'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-[#e0e5e3] text-(--brand-ink) font-extrabold text-xs hover:bg-(--surface-soft) transition-colors shrink-0 cursor-pointer shadow-2xs"
                      >
                        Pick Map
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addingEvent}
                    className="w-full py-2.5 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-black text-xs shadow-xs transition-all cursor-pointer disabled:opacity-60 mt-1"
                  >
                    {addingEvent ? 'Saving...' : 'Add Event to Calendar'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[340px] [&::-webkit-scrollbar]:hidden">
              {!data?.specialEvents || data.specialEvents.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed border-[#e0e5e3] bg-(--surface-soft)/20">
                  <div className="w-10 h-10 rounded-2xl bg-(--surface-soft) border border-[#e0e5e3] flex items-center justify-center mx-auto text-(--brand-muted) mb-2">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <p className="text-xs font-extrabold text-(--brand-ink)">No Events Scheduled</p>
                  <p className="text-[11px] text-(--brand-muted) font-medium px-4 mt-0.5">Add events happening near this station.</p>
                </div>
              ) : (
                data.specialEvents.map((ev, idx) => {
                  const dateParts = ev.date.split('-');
                  const dayNum = dateParts[2] || '';
                  const monthShort = dateParts[1]
                    ? new Date(2000, Number(dateParts[1]) - 1, 1).toLocaleString('en', { month: 'short' })
                    : '';

                  return (
                    <motion.div
                      key={ev._id || idx}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      className="p-3.5 rounded-2xl bg-white border border-[#e0e5e3] hover:shadow-xs transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Date badge */}
                        <div className="w-12 h-12 rounded-xl bg-(--surface-soft) border border-[#e0e5e3] flex flex-col items-center justify-center shrink-0">
                          <span className="text-[8px] font-black text-(--brand-muted) uppercase leading-none">{monthShort || '·'}</span>
                          <span className="text-sm font-black text-(--brand-ink) leading-tight">{dayNum || ev.date}</span>
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-(--brand-blue)/10 text-(--brand-blue-deep) border border-(--brand-blue)/20">
                              @ {ev.time || '12:00'}
                            </span>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-(--brand-green)/10 text-(--brand-green-deep) border border-(--brand-green)/20">
                              Within 10km
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-(--brand-ink) truncate">{ev.title}</h4>
                          {ev.locationName && (
                            <p className="text-[11px] font-medium text-(--brand-muted) truncate flex items-center gap-1">
                              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                              {ev.locationName}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => ev._id && requestDeleteEvent(ev._id, ev.title)}
                        className="p-1.5 text-(--brand-muted) hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0 opacity-70 group-hover:opacity-100"
                        title="Remove event"
                      >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ══════════ MAP PICKER MODAL ══════════ */}
      <AnimatePresence>
        {showMapPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMapPicker(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[#e0e5e3]"
            >
              <div className="px-6 py-4 border-b border-[#e0e5e3] flex justify-between items-center bg-white/80 backdrop-blur-xl">
                <div>
                  <h3 className="text-sm font-extrabold text-(--brand-ink)">Select Event Coordinates</h3>
                  <p className="text-xs text-(--brand-muted) font-medium">Click on the map to place event pin within 10km radius.</p>
                </div>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-(--surface-soft) text-(--brand-muted) transition-colors cursor-pointer"
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="w-full h-[50vh] bg-slate-100 relative">
                {!isLoaded ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--brand-blue)"></div>
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={
                      newLat && newLng
                        ? { lat: Number(newLat), lng: Number(newLng) }
                        : currentStation?.location?.coordinates
                        ? { lat: currentStation.location.coordinates[1], lng: currentStation.location.coordinates[0] }
                        : { lat: 6.9271, lng: 79.8612 }
                    }
                    zoom={13}
                    options={{ disableDefaultUI: true, zoomControl: true }}
                    onClick={(e) => {
                      if (e.latLng) {
                        setNewLat(e.latLng.lat().toString());
                        setNewLng(e.latLng.lng().toString());
                      }
                    }}
                  >
                    {newLat && newLng && (
                      <MarkerF position={{ lat: Number(newLat), lng: Number(newLng) }} />
                    )}
                    {currentStation?.location?.coordinates && (
                      <MarkerF
                        position={{ lat: currentStation.location.coordinates[1], lng: currentStation.location.coordinates[0] }}
                        icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
                      />
                    )}
                  </GoogleMap>
                )}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-xs border border-[#e0e5e3] text-xs font-bold text-(--brand-muted) flex items-center gap-3">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-(--brand-blue)" /> Station</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Event</span>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-white border-t border-[#e0e5e3] flex justify-end gap-2.5 text-xs">
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="px-4 py-2 rounded-xl font-bold text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="px-5 py-2 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-extrabold shadow-xs transition-colors cursor-pointer"
                >
                  Confirm Location
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════ REUSABLE CONFIRMATION MODAL ══════════ */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
}