'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
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

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };

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
    <div className="bg-white/95 backdrop-blur-xl border border-(--brand-border) rounded-2xl px-4 py-3 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)]">
      <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider mb-1.5">{label}</p>
      <div className="space-y-1.5">
        <p className="text-xs font-black text-(--brand-ink) flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4a90a4]" />
          Grid Occupancy: <span className="text-[#4a90a4]">{Math.round(Number(occ))}%</span>
        </p>
        <p className="text-xs font-black text-(--brand-ink) flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f4b740]" />
          Surge Multiplier: <span className="text-[#d09d2e]">{Number(mult).toFixed(2)}x</span>
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all relative overflow-hidden group"
    >
      {/* accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4a90a4] to-[#6cb567] opacity-90" />

      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-[0.14em]">{title}</p>
        <div className="w-8 h-8 rounded-xl bg-(--surface-soft)/50 border border-(--brand-border)/60 flex items-center justify-center text-(--brand-blue) shrink-0 group-hover:scale-105 transition-transform">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
      </div>

      <h3 className="text-[22px] font-black text-(--brand-ink) tracking-tight leading-none mb-1.5">{value}</h3>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-(--surface-soft) text-(--brand-green-deep) border border-(--brand-border)/60 whitespace-nowrap">
          {change}
        </span>
        <span className="text-[10px] text-(--brand-muted) font-medium truncate">{sub}</span>
      </div>

      {spark.length > 0 && (
        <div className="h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────── COMPONENT ─────────────────────── */

export default function AiPredictionView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stations & Selection
  const [stations, setStations] = useState<StationItem[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [data, setData] = useState<ForecastPayload | null>(null);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('18:00');
  const [newLat, setNewLat] = useState<string>('');
  const [newLng, setNewLng] = useState<string>('');
  const [addingEvent, setAddingEvent] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // AI Price Plan State (per-hour toggles for scheduling station-wise AI prices)
  const [planBusySlot, setPlanBusySlot] = useState<string | null>(null);
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  // 1. Fetch Forecast for Selected Station
  const fetchStationForecast = useCallback(async (stId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const endpoint = stId ? `/api/ai/station-forecast/${stId}` : `/api/ai/forecast`;
      const res = await fetch(apiUrl(endpoint), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(prev => prev ? { ...prev, aiConnected: false } : null);
      }
    } catch (err) {
      console.error('Failed to load station forecast', err);
      setData(prev => prev ? { ...prev, aiConnected: false } : null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // 2. Fetch Owner's Stations
  useEffect(() => {
    if (!user) return;
    const fetchStations = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(apiUrl('/api/stations/owner'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          setStations(list);
          if (list.length > 0) {
            setSelectedStationId(list[0]._id);
            if (list[0].location?.coordinates) {
              setNewLng(String(list[0].location.coordinates[0]));
              setNewLat(String(list[0].location.coordinates[1]));
            }
          } else {
            fetchStationForecast('');
          }
        }
      } catch (err) {
        console.error('Failed to load stations', err);
      }
    };
    fetchStations();
  }, [user, fetchStationForecast]);

  // 3. Auto-Trigger at the Top of Every Hour (0th minute)
  useEffect(() => {
    if (!selectedStationId) return;

    fetchStationForecast(selectedStationId);

    const now = new Date();
    const minutesToNextHour = 60 - now.getMinutes();
    const secondsToNextMinute = 60 - now.getSeconds();
    const msToNextHour = (minutesToNextHour - 1) * 60000 + secondsToNextMinute * 1000 - now.getMilliseconds();

    let intervalId: NodeJS.Timeout;
    const timeoutId = setTimeout(() => {
      fetchStationForecast(selectedStationId);
      intervalId = setInterval(() => {
        fetchStationForecast(selectedStationId);
      }, 3600000);
    }, msToNextHour);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedStationId, fetchStationForecast]);

  const handleStationChange = (stId: string) => {
    setSelectedStationId(stId);
    const target = stations.find(s => s._id === stId);
    if (target?.location?.coordinates) {
      setNewLng(String(target.location.coordinates[0]));
      setNewLat(String(target.location.coordinates[1]));
    }
  };

  const handleForceRefresh = () => {
    setRefreshing(true);
    fetchStationForecast(selectedStationId);
  };

  // 4. Add Special Event (with 10km proximity check)
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStationId || !newTitle || !newDate) return;
    setAddingEvent(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/ai/station-events/${selectedStationId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newTitle,
          locationName: newLocationName,
          date: newDate,
          time: newTime,
          latitude: newLat ? parseFloat(newLat) : null,
          longitude: newLng ? parseFloat(newLng) : null,
          category: 'Special Event'
        })
      });
      if (res.ok) {
        setNewTitle('');
        setNewLocationName('');
        setNewDate('');
        setShowEventForm(false);
        handleForceRefresh();
      }
    } catch (err) {
      console.error('Failed to add event', err);
    } finally {
      setAddingEvent(false);
    }
  };

  // 5. Delete Event
  const handleDeleteEvent = async (evId: string) => {
    if (!user || !selectedStationId) return;
    try {
      const token = await user.getIdToken();
      await fetch(apiUrl(`/api/ai/station-events/${selectedStationId}/${evId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      handleForceRefresh();
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  // 6. Apply / Revert AI Price for one hour slot (station-wise price plan)
  //    Switch ON  -> POST adds/updates the slot in the station's price plan
  //    Switch OFF -> DELETE removes the slot so drivers see the normal rate again
  const handleTogglePlanSlot = async (slot: HourlyData, shouldApply: boolean) => {
    if (!user || !selectedStationId) return;
    if (planBusySlot) return; // one toggle at a time
    const basePrice = Number(data?.station?.basePricePerKwh) || 0;
    if (shouldApply && !basePrice) {
      alert('Station base rate is not configured. Set a base price first.');
      return;
    }
    setPlanBusySlot(slot.time);
    try {
      const token = await user.getIdToken();
      let res: Response;
      if (shouldApply) {
        const calculatedRate = (basePrice * slot.multiplier).toFixed(2);
        res = await fetch(apiUrl(`/api/ai/apply-price-override/${selectedStationId}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            hourSlot: slot.time,
            multiplier: slot.multiplier,
            calculatedRate: parseFloat(calculatedRate)
          })
        });
      } else {
        res = await fetch(apiUrl(`/api/ai/price-plan/${selectedStationId}/${encodeURIComponent(slot.time)}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }

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
        const until = body?.activePriceOverride?.expiresAt
          ? new Date(body.activePriceOverride.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null;
        if (shouldApply) {
          const rate = (basePrice * slot.multiplier).toFixed(2);
          setOverrideSuccessMsg(
            `⚡ AI Price LKR ${rate}/kWh scheduled for ${slot.time}${until ? ` · drivers see it live until ${until}` : ''}. It auto-reverts after this hour.`
          );
        } else {
          setOverrideSuccessMsg(`↩️ ${slot.time} reverted to normal rate LKR ${basePrice.toFixed(2)}/kWh.`);
        }
        setTimeout(() => setOverrideSuccessMsg(null), 8000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || 'Failed to update the AI price plan.');
      }
    } catch (err) {
      console.error('Failed to update price plan', err);
      alert('Failed to update the AI price plan.');
    } finally {
      setPlanBusySlot(null);
    }
  };

  // 7. Revert one scheduled AI price slot back to normal
  const handleRevertPlanSlot = async (hourSlot: string) => {
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
        const basePrice = Number(data?.station?.basePricePerKwh) || 0;
        setOverrideSuccessMsg(`↩️ ${hourSlot} reverted to normal rate LKR ${basePrice.toFixed(2)}/kWh.`);
        setTimeout(() => setOverrideSuccessMsg(null), 8000);
      }
    } catch (err) {
      console.error('Failed to revert plan slot', err);
    } finally {
      setPlanBusySlot(null);
    }
  };

  // 8. Revert ALL scheduled AI prices at once
  const handleRevertAllPlan = async () => {
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
        setOverrideSuccessMsg('↩️ All scheduled AI prices reverted to the normal base rate.');
        setTimeout(() => setOverrideSuccessMsg(null), 8000);
      }
    } catch (err) {
      console.error('Failed to revert all plan slots', err);
    } finally {
      setPlanBusySlot(null);
    }
  };

  // 9. Change this station's AI pricing aggressiveness profile
  const handleProfileChange = async (profile: 'conservative' | 'balanced' | 'aggressive') => {
    if (!user || !selectedStationId || savingProfile) return;
    if ((data?.station?.pricingProfile || 'balanced') === profile) return;
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
        setOverrideSuccessMsg(`🎛️ AI pricing set to ${profile}. The demand curve now prices this station accordingly.`);
        setTimeout(() => setOverrideSuccessMsg(null), 6000);
        fetchStationForecast(selectedStationId);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.message || 'Failed to update the pricing profile.');
      }
    } catch (err) {
      console.error('Failed to update pricing profile', err);
      alert('Failed to update the pricing profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const weatherIcon = (condition: string) => {
    const c = condition?.toLowerCase() || '';
    if (c.includes('cloud') || c.includes('overcast')) return '☁️';
    if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
    if (c.includes('thunder') || c.includes('storm')) return '⛈️';
    return '☀️';
  };

  const currentStation = stations.find(s => s._id === selectedStationId);
  const isAiOnline = data?.aiConnected !== false && (data?.hourly && data.hourly.length > 0);
  const baseRate = Number(data?.station?.basePricePerKwh) || 0;
  const pricePlan: PlanEntry[] = data?.station?.pricePlan || [];
  const activeOverride = data?.station?.activePriceOverride || null;
  // hourSlot -> plan entry, for quick per-hour toggle lookups
  const appliedSlots = new Map(pricePlan.map(p => [p.hourSlot, p]));

  // Continuous-pricing curve profile (used in the small "what happens here" note)
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
  // Driver-facing rate: active override for the hour, else the base rate
  // (per the "override-only" pricing decision, the AI multiplier is not
  // folded into the price drivers see unless the owner applies it).
  const activeRateKwh = activeOverride ? Number(activeOverride.effectiveRate) : baseRate;

  const kpis = [
    {
      title: 'Peak Demand',
      value: hourly.length ? `${Math.round(peakSlot.occupancy)}%` : '--',
      change: hourly.length ? `@ ${peakSlot.time}` : '—',
      sub: 'Next 6 hours',
      iconPath: 'M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941',
      spark: hourly.map(h => ({ v: h.occupancy })),
      sparkColor: '#4a90a4',
    },
    {
      title: 'Avg Multiplier',
      value: hourly.length ? `${avgMult.toFixed(2)}x` : '--',
      change: avgMult >= 1.25 ? 'High Surge' : avgMult > 1 ? 'Elevated' : 'Normal',
      sub: 'Automated forecast',
      iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
      spark: hourly.map(h => ({ v: h.multiplier })),
      sparkColor: '#f4b740',
    },
    {
      title: 'Live Occupancy',
      value: hourly.length ? `${Math.round(currentSlot?.occupancy || 0)}%` : '--',
      change: 'Live',
      sub: currentSlot ? `Slot ${currentSlot.time}` : 'Pending sync',
      iconPath: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
      spark: hourly.map(h => ({ v: h.occupancy })),
      sparkColor: '#6cb567',
    },
    {
      title: 'Active Rate',
      value: `LKR ${activeRateKwh.toFixed(2)}`,
      change: activeOverride ? 'Override Live' : 'Base Rate',
      sub: '/ kWh',
      iconPath: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      spark: hourly.map(h => ({ v: Math.round(baseRate * h.multiplier) })),
      sparkColor: '#3f7f90',
    },
  ];

  return (
    <div className="space-y-6 font-sans pb-12">

      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4a90a4] to-[#6cb567] text-white font-bold flex items-center justify-center shadow-sm shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.496 1.508 1.333 1.508 2.316V18" />
              </svg>
            </div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-(--brand-ink)">Demand & Pricing Intelligence</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--brand-green)/10 text-(--brand-green-deep) text-[9px] font-extrabold uppercase tracking-[0.12em] border border-(--brand-green)/20">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) animate-pulse" />
              Automated Engine
            </span>
          </div>
          <p className="text-[12px] text-(--brand-muted) font-medium">
            Real-time grid occupancy forecasting and dynamic pricing multipliers.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {stations.length > 1 && (
            <div className="relative">
              <select
                value={selectedStationId}
                onChange={e => handleStationChange(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 rounded-xl bg-white border border-(--brand-border)/80 text-[11px] font-bold text-(--brand-ink) focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 cursor-pointer shadow-xs min-w-[190px]"
              >
                {stations.map(st => (
                  <option key={st._id} value={st._id}>{st.stationName}</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-(--brand-muted)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          )}

          {currentStation && (
            <div
              className="flex items-center gap-1 p-1 rounded-xl bg-white border border-(--brand-border)/80 shadow-xs"
              title="How aggressively AI prices should swing for this station"
            >
              <span className="pl-1.5 pr-1 text-[9px] font-extrabold uppercase tracking-wider text-(--brand-muted) hidden sm:block">AI</span>
              {(['conservative', 'balanced', 'aggressive'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  disabled={savingProfile}
                  onClick={() => handleProfileChange(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold capitalize transition-colors cursor-pointer disabled:opacity-60 ${
                    currentProfile === p
                      ? 'bg-[#4a90a4] text-white shadow-xs'
                      : 'text-(--brand-muted) hover:bg-(--surface-soft)'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleForceRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4a90a4] to-[#6cb567] text-white text-[11px] font-extrabold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shrink-0 active:scale-95"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {refreshing ? 'Calculating...' : 'Run Price Check'}
          </button>
        </div>
      </div>

      {/* ══════════ SUCCESS / OVERRIDE BANNER ══════════ */}
      <AnimatePresence>
        {overrideSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-[#6cb567]/15 border border-[#6cb567]/30 text-[#5ba857] font-extrabold text-xs flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span>{overrideSuccessMsg}</span>
            </div>
            <button onClick={() => setOverrideSuccessMsg(null)} className="text-[#5ba857] hover:text-(--brand-ink) font-bold text-xs cursor-pointer">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ UNIFIED STATUS STRIP ══════════ */}
      <div className="bg-white rounded-xl p-3 border border-(--brand-border)/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-3 flex-wrap">
          {isAiOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#6cb567]/10 text-[#5ba857] text-[10px] font-extrabold uppercase tracking-wider border border-[#6cb567]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6cb567] animate-pulse" />
              Inference Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Engine Offline
            </span>
          )}

          {data?.weatherConnected !== false ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#4a90a4]/10 text-[#3f7f90] text-[10px] font-extrabold uppercase tracking-wider border border-[#4a90a4]/20">
              <span>{weatherIcon(data?.weather.condition || 'Clear')}</span>
              {data?.weather.condition} ({data?.weather.temp}°C)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-extrabold uppercase tracking-wider border border-amber-200">
              <span>⚠️</span> Weather Disconnected
            </span>
          )}

          {activeOverride && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300">
              <span>⚡</span> Live AI Price: LKR {Number(activeOverride.effectiveRate).toFixed(2)}/kWh · reverts at {activeOverride.expiresAt ? new Date(activeOverride.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'end of hour'}
            </span>
          )}

          {pricePlan.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#4a90a4]/10 text-[#3f7f90] text-[10px] font-extrabold uppercase tracking-wider border border-[#4a90a4]/20">
              <span>🗓️</span> {pricePlan.length} AI Price slot{pricePlan.length > 1 ? 's' : ''} scheduled
            </span>
          )}
        </div>

        <div className="text-(--brand-muted) font-semibold text-[10px]">
          Last Updated: <span className="text-(--brand-ink) font-extrabold">{data?.lastUpdated || '—'}</span> (Syncs hourly)
        </div>
      </div>

      {/* ══════════ HERO KPI LEDGER ROW ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[150px] rounded-2xl bg-white border border-(--brand-border)/80 animate-pulse" />
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
              delay={i * 0.06}
            />
          ))
        )}
      </div>

      {/* ══════════ MAIN GRID CONTENT ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT 8 COLUMNS: 6-Hour Forecast & 7-Day Outlook */}
        <div className="lg:col-span-8 space-y-5">

          {/* ── SECTION 1: 6-HOUR DEMAND FORECAST ── */}
          <div className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col space-y-4">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4a90a4] to-[#6cb567] opacity-90" />

            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-[14px] font-extrabold text-(--brand-ink) tracking-tight">6-Hour Live Demand Forecast</h2>
                <p className="text-[11px] text-(--brand-muted) font-medium">Hourly predicted grid capacity & suggested multipliers</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-(--surface-soft) text-(--brand-muted) border border-(--brand-border)/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4a90a4]" /> Occupancy
                </span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-(--surface-soft) text-(--brand-muted) border border-(--brand-border)/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f4b740]" /> Multiplier
                </span>
              </div>
            </div>

            {!isAiOnline && !loading ? (
              <div className="p-6 text-center rounded-xl bg-(--surface-soft)/40 border border-dashed border-(--brand-border)/80 my-2">
                <p className="text-[12px] font-extrabold text-(--brand-ink) mb-1">AI Engine Disconnected</p>
                <p className="text-[11px] text-(--brand-muted) max-w-xs mx-auto">
                  Python ML microservice is unreachable on port 5001. No artificial fallbacks are shown.
                </p>
              </div>
            ) : (
              <>
                {/* Dual-Axis Combo Chart */}
                <div className="h-[230px] w-full">
                  {loading ? (
                    <div className="w-full h-full rounded-xl bg-(--surface-soft)/40 animate-pulse" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={hourly} margin={{ top: 10, right: 0, left: -14, bottom: 0 }}>
                        <defs>
                          <linearGradient id="areaGradForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4a90a4" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#6cb567" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e5e3" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b6f72" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis
                          yAxisId="occ"
                          stroke="#6b6f72"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={v => `${v}%`}
                          domain={[0, 100]}
                        />
                        <YAxis
                          yAxisId="mult"
                          orientation="right"
                          stroke="#d09d2e"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={v => `${v}x`}
                          domain={[0, (dataMax: number) => +(dataMax + 0.4).toFixed(2)]}
                        />
                        <Tooltip content={<ComboTooltip />} cursor={{ fill: 'rgba(74,144,164,0.06)' }} />
                        <Area
                          yAxisId="occ"
                          type="monotone"
                          dataKey="occupancy"
                          stroke="#4a90a4"
                          strokeWidth={2.5}
                          fill="url(#areaGradForecast)"
                          dot={false}
                        />
                        <Bar yAxisId="mult" dataKey="multiplier" fill="#f4b740" radius={[5, 5, 0, 0]} barSize={18} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Surge Radar Strip — 6 actionable slot chips */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-(--surface-soft)/30 p-3 rounded-xl border border-(--brand-border)/50">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-24 rounded-xl bg-(--surface-soft) animate-pulse" />
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
                          transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                          className={`flex flex-col items-center justify-between p-2.5 rounded-xl border text-center transition-all relative ${
                            applied
                              ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/40'
                              : 'bg-white border-(--brand-border)/60 hover:shadow-xs hover:-translate-y-0.5'
                          }`}
                        >
                          {/* Applied marker */}
                          {applied && (
                            <span className="absolute -top-2 right-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500 text-white shadow-xs">
                              ON
                            </span>
                          )}

                          <span className="text-xs font-bold text-(--brand-muted) mb-0.5">{h.time}</span>
                          <span className="text-lg font-black text-(--brand-ink) mb-1">{Math.round(h.occupancy)}%</span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 ${
                              isHigh
                                ? 'bg-rose-500 text-white'
                                : isMod
                                ? 'bg-[#f4b740] text-white'
                                : 'bg-[#6cb567] text-white'
                            }`}
                          >
                            {h.multiplier.toFixed(2)}x
                          </span>

                          <span className={`text-[11px] font-black mb-2 ${applied ? 'text-amber-700' : 'text-(--brand-muted)'}`}>
                            LKR {applied ? Number(applied.effectiveRate).toFixed(2) : suggestedRate.toFixed(2)}
                          </span>

                          {/* Toggle switch: ON = AI price scheduled, OFF = normal rate */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!!applied}
                            disabled={!!planBusySlot}
                            onClick={() => handleTogglePlanSlot(h, !applied)}
                            className={`relative w-11 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait shrink-0 ${applied ? 'bg-[#4a90a4]' : 'bg-(--brand-border)'}`}
                            title={applied ? `Revert ${h.time} back to normal rate` : `Apply AI price for ${h.time}`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${applied ? 'left-[22px]' : 'left-0.5'}`}
                            />
                          </button>

                          <span className="text-[8px] font-bold text-(--brand-muted) mt-1">
                            {applied
                              ? `reverts ${applied.expiresAt ? new Date(applied.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'HH:MM'}`
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

          {/* ── SECTION 1b: SCHEDULED AI PRICES (station-wise plan) ── */}
          <div className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4a90a4] to-[#6cb567] opacity-90" />

            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div>
                <h2 className="text-[14px] font-extrabold text-(--brand-ink) tracking-tight flex items-center gap-2">
                  🗓️ Scheduled AI Prices
                </h2>
                <p className="text-[11px] text-(--brand-muted) font-medium">
                  AI rates you have added for this station — each one auto-reverts to normal when its hour passes.
                </p>
              </div>
              {pricePlan.length > 0 && (
                <button
                  type="button"
                  onClick={handleRevertAllPlan}
                  disabled={!!planBusySlot}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-extrabold uppercase tracking-wider hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-60"
                >
                  ↩️ Revert All
                </button>
              )}
            </div>

            {pricePlan.length === 0 ? (
              <div className="py-8 text-center rounded-xl border border-dashed border-(--brand-border)/80 bg-(--surface-soft)/20">
                <span className="text-xl block mb-1">⚡</span>
                <p className="text-xs font-bold text-(--brand-ink)">No AI prices scheduled yet</p>
                <p className="text-[10px] text-(--brand-muted) font-medium px-6 mt-0.5">
                  Flip the switches in the 6-Hour Forecast above to add AI prices for specific hours.
                  Drivers see them only during that hour, then it reverts to the normal rate automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
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
                        className={`p-3 rounded-xl border flex flex-col gap-1.5 ${live ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400/40' : 'bg-(--surface-soft)/30 border-(--brand-border)/60'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-(--brand-ink)">{p.hourSlot}</span>
                          {live ? (
                            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-white">Live now</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevertPlanSlot(p.hourSlot)}
                              disabled={!!planBusySlot}
                              className="text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              Revert
                            </button>
                          )}
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="font-mono text-[15px] font-black text-(--brand-ink)">LKR {Number(p.effectiveRate).toFixed(2)}</span>
                          <span className="text-[9px] font-bold text-(--brand-muted)">{Number(p.multiplier).toFixed(2)}x</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-bold">
                          <span className={diff > 0 ? 'text-rose-500' : diff < 0 ? 'text-[#5ba857]' : 'text-(--brand-muted)'}>
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

          {/* ── SECTION 1c: PRACTICAL USE-CASE GUIDE ── */}
          <div className="bg-gradient-to-br from-[#f0f6f4] to-[#eef3f8] rounded-2xl border border-(--brand-border)/70 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4a90a4] to-[#6cb567] opacity-80" />
            <h2 className="text-[13px] font-extrabold text-(--brand-ink) tracking-tight mb-1">💡 Practical Use-Case Guide</h2>
            <p className="text-[11px] text-(--brand-muted) font-medium mb-4">How to use AI pricing with this station, based on the model's occupancy forecast.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Surge use case */}
              <div className="p-3.5 rounded-xl bg-white border border-(--brand-border)/60">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center text-sm">🔥</span>
                  <h4 className="text-[11px] font-black text-(--brand-ink) uppercase tracking-wider">High Demand = Surge</h4>
                </div>
                <p className="text-[10px] text-(--brand-muted) font-medium leading-relaxed">
                  The AI price now scales <b className="text-(--brand-ink)">smoothly</b> with predicted demand — the busier the hour, the higher the price, up to a <b className="text-rose-500">{profileCap.toFixed(2)}x</b> ceiling. Apply it to earn more when demand is high.
                </p>
                {hourly[0] && hourly[0].multiplier >= 1.15 && (
                  <p className="mt-2 text-[10px] font-extrabold text-rose-500">
                    Next hour ({hourly[0].time}): {hourly[0].recommendation} · {hourly[0].multiplier.toFixed(2)}x → LKR {(baseRate * hourly[0].multiplier).toFixed(2)}/kWh
                  </p>
                )}
              </div>

              {/* Discount use case */}
              <div className="p-3.5 rounded-xl bg-white border border-(--brand-border)/60">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-[#6cb567]/10 text-[#5ba857] flex items-center justify-center text-sm">💚</span>
                  <h4 className="text-[11px] font-black text-(--brand-ink) uppercase tracking-wider">Low Demand = Discount</h4>
                </div>
                <p className="text-[10px] text-(--brand-muted) font-medium leading-relaxed">
                  When forecast occupancy is <b className="text-(--brand-ink)">≤30%</b> the price drops to its <b className="text-[#5ba857]">discount floor ({profileFloor.toFixed(2)}x)</b>. Apply it in slow hours to attract drivers and fill idle chargers.
                </p>
                {hourly[0] && hourly[0].multiplier <= 0.9 && (
                  <p className="mt-2 text-[10px] font-extrabold text-[#5ba857]">
                    Next hour ({hourly[0].time}): {hourly[0].recommendation} · {hourly[0].multiplier.toFixed(2)}x → LKR {(baseRate * hourly[0].multiplier).toFixed(2)}/kWh
                  </p>
                )}
              </div>

              {/* Auto-revert use case */}
              <div className="p-3.5 rounded-xl bg-white border border-(--brand-border)/60">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-[#4a90a4]/10 text-[#3f7f90] flex items-center justify-center text-sm">⏱️</span>
                  <h4 className="text-[11px] font-black text-(--brand-ink) uppercase tracking-wider">Auto-Revert Every Hour</h4>
                </div>
                <p className="text-[10px] text-(--brand-muted) font-medium leading-relaxed">
                  Every AI price you add lasts <b className="text-(--brand-ink)">exactly one hour</b>, then drivers automatically see the normal base rate again. No manual cleanup — just flip a switch back if plans change.
                </p>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-(--brand-muted) font-medium leading-relaxed">
              <b className="text-(--brand-ink)">What happens here:</b> AI price = Base (LKR {baseRate.toFixed(2)}) × a smooth demand curve (0.90–{profileCap.toFixed(2)}x), rounded to LKR 0.50. Prices move with demand — no sudden jumps — and every applied price reverts after its hour.
            </p>
          </div>

          {/* ── SECTION 2: 7-DAY WEEKLY OUTLOOK ── */}
          <div className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4a90a4] to-[#6cb567] opacity-90" />

            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <div>
                <h2 className="text-[14px] font-extrabold text-(--brand-ink) tracking-tight">7-Day Weekly Outlook</h2>
                <p className="text-[11px] text-(--brand-muted) font-medium">Daily peak load projections & special event factors</p>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-(--surface-soft) text-(--brand-muted) border border-(--brand-border)/60">
                Week View
              </span>
            </div>

            {!isAiOnline && !loading ? (
              <div className="p-5 text-center rounded-xl bg-(--surface-soft)/30 border border-(--brand-border)/60 text-[11px] text-(--brand-muted)">
                Weekly outlook requires active AI microservice sync.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-(--surface-soft) animate-pulse" />
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
                        transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                          isHigh
                            ? 'bg-[#f4b740]/10 border-[#f4b740]/30'
                            : 'bg-white border-(--brand-border)/60 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-black text-(--brand-ink)">{d.day}</span>
                            <span className="text-[9px] font-bold text-(--brand-muted)">{d.date}</span>
                          </div>

                          <div className="flex items-end justify-between mb-1.5">
                            <span className={`text-[16px] font-black ${isHigh ? 'text-[#d09d2e]' : 'text-(--brand-ink)'}`}>
                              {d.avgMultiplier.toFixed(2)}x
                            </span>
                            {trend > 0.001 ? (
                              <span className="text-[9px] font-extrabold text-[#5ba857] flex items-center gap-0.5" title="Up from previous day">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                                ↑
                              </span>
                            ) : trend < -0.001 ? (
                              <span className="text-[9px] font-extrabold text-[#d09d2e] flex items-center gap-0.5" title="Down from previous day">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                ↓
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-(--brand-muted)" title="Steady">─</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="w-full bg-(--surface-soft) h-1.5 rounded-full overflow-hidden border border-(--brand-border)/40">
                            <div
                              className={`h-full rounded-full ${isHigh ? 'bg-[#f4b740]' : 'bg-[#4a90a4]'}`}
                              style={{ width: `${Math.min(100, d.occupancy)}%` }}
                            />
                          </div>
                          <p className="text-[9px] font-extrabold text-(--brand-muted) truncate" title={d.status}>
                            ~{Math.round(d.occupancy)}% peak · {d.status}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT 4 COLUMNS: AI CONTEXT + SPECIAL EVENTS */}
        <div className="lg:col-span-4 flex flex-col space-y-5">

          {/* ── AI CONTEXT & WEATHER CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="bg-gradient-to-br from-[#3f7f90] via-[#4a90a4] to-[#5ba857] text-white rounded-2xl p-5 shadow-sm relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-14 -left-10 w-40 h-40 rounded-full bg-[#6cb567]/25 blur-2xl pointer-events-none" />

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/25 text-[9px] font-extrabold uppercase tracking-wider mb-3">
              🤖 AI Context Engine
            </span>

            <div className="space-y-3">
              {/* Inference status */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Model Inference</span>
                {isAiOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/25 text-[10px] font-extrabold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6cb567] animate-pulse" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 border border-white/20 text-[10px] font-extrabold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Offline
                  </span>
                )}
              </div>

              {/* Weather */}
              <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Local Weather</p>
                  {data?.weatherConnected !== false ? (
                    <p className="text-[13px] font-bold truncate">
                      {data?.weather.condition} <span className="text-white/80">({data?.weather.temp}°C)</span>
                    </p>
                  ) : (
                    <p className="text-[12px] font-bold text-white/70">Weather service offline</p>
                  )}
                </div>
                <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-lg shrink-0">
                  {weatherIcon(data?.weather.condition || '')}
                </span>
              </div>

              {/* Base Rate */}
              <div className="pt-3 border-t border-white/15 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Base Rate</span>
                <span className="font-mono font-bold text-[13px]">LKR {baseRate.toFixed(2)}</span>
              </div>

              {/* Active AI Price (live plan entry) */}
              {activeOverride && (
                <div className="pt-2.5 border-t border-white/15 !mt-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#f4b740]/25 border border-[#f4b740]/40 text-[10px] font-extrabold">
                    ⚡ Live AI Price: LKR {Number(activeOverride.effectiveRate).toFixed(2)}/kWh · until {activeOverride.expiresAt ? new Date(activeOverride.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'end of hour'}
                  </span>
                  {pricePlan.length > 0 && (
                    <p className="mt-2 text-[10px] font-bold text-white/80">
                      🗓️ {pricePlan.length} scheduled slot{pricePlan.length > 1 ? 's' : ''} in this station's AI price plan.
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── PROXIMITY SPECIAL EVENTS ── */}
          <div className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden space-y-4 flex-1 flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4a90a4] to-[#6cb567] opacity-90" />

            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[14px] font-extrabold text-(--brand-ink) tracking-tight flex items-center gap-2">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-blue)">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Proximity Special Events
                </h2>
              </div>
              <p className="text-[11px] text-(--brand-muted) font-medium">
                Events within a <span className="font-bold text-(--brand-ink)">10km radius</span> factor into surge pricing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowEventForm(!showEventForm)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4a90a4] to-[#6cb567] text-white font-extrabold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {showEventForm ? (
                <>
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Cancel Scheduling
                </>
              ) : (
                <>
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Schedule Special Event
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
                  className="p-4 rounded-xl bg-(--surface-soft)/30 border border-(--brand-border)/60 space-y-3 overflow-hidden text-xs"
                >
                  <div>
                    <label className="font-bold text-(--brand-ink) block mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cricket Tournament"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-(--brand-border)/80 text-xs font-medium focus:outline-none focus:border-(--brand-blue)"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-(--brand-ink) block mb-1">Venue Location</label>
                    <input
                      type="text"
                      placeholder="e.g. City Stadium"
                      value={newLocationName}
                      onChange={e => setNewLocationName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-(--brand-border)/80 text-xs font-medium focus:outline-none focus:border-(--brand-blue)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-(--brand-ink) block mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-(--brand-border)/80 text-xs font-medium focus:outline-none focus:border-(--brand-blue)"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-(--brand-ink) block mb-1">Time</label>
                      <input
                        type="time"
                        required
                        value={newTime}
                        onChange={e => setNewTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-(--brand-border)/80 text-xs font-medium focus:outline-none focus:border-(--brand-blue)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-(--brand-ink) block mb-1">Location Coordinates</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-lg bg-white border border-(--brand-border)/80 font-medium text-(--brand-muted) truncate text-xs">
                        {newLat && newLng ? `${Number(newLat).toFixed(3)}, ${Number(newLng).toFixed(3)}` : 'No pin set'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="px-3 py-2 rounded-lg bg-white border border-(--brand-border)/80 text-(--brand-ink) font-bold text-xs hover:bg-(--surface-soft) transition-colors shrink-0 cursor-pointer"
                      >
                        Pick Map
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addingEvent}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#4a90a4] to-[#6cb567] text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60 mt-1"
                  >
                    {addingEvent ? 'Saving...' : 'Add Event to Calendar'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[330px]">
              {!data?.specialEvents || data.specialEvents.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-dashed border-(--brand-border)/80 bg-(--surface-soft)/20">
                  <span className="text-xl block mb-1">🗓️</span>
                  <p className="text-xs font-bold text-(--brand-ink)">No Events Scheduled</p>
                  <p className="text-[10px] text-(--brand-muted) font-medium px-4 mt-0.5">Add events happening near this station.</p>
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
                      className="p-3 rounded-xl bg-white border border-(--brand-border)/70 hover:border-(--brand-border) hover:shadow-xs transition-all flex items-start justify-between gap-2.5 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Date block */}
                        <div className="w-11 h-11 rounded-xl bg-(--surface-soft) border border-(--brand-border)/60 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[8px] font-extrabold text-(--brand-muted) uppercase leading-none">{monthShort || '·'}</span>
                          <span className="text-[13px] font-black text-(--brand-ink) leading-tight">{dayNum || ev.date}</span>
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-[#4a90a4]/10 text-[#3f7f90] border border-[#4a90a4]/20">
                              @ {ev.time || '12:00'}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#6cb567]/10 text-[#5ba857] border border-[#6cb567]/20">
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
                        onClick={() => ev._id && handleDeleteEvent(ev._id)}
                        className="p-1 text-(--brand-muted) hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0 opacity-70 group-hover:opacity-100"
                        title="Remove event"
                      >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
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
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-(--brand-border)"
            >
              <div className="px-5 py-3.5 border-b border-(--brand-border)/60 flex justify-between items-center bg-(--surface-soft)/40">
                <div>
                  <h3 className="text-[13px] font-extrabold text-(--brand-ink)">Select Event Location</h3>
                  <p className="text-[10px] text-(--brand-muted) font-medium">Click on the map to set event coordinates.</p>
                </div>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-(--surface-soft) text-(--brand-muted) transition-colors cursor-pointer"
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="w-full h-[50vh] bg-slate-100 relative">
                {!isLoaded ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#4a90a4]"></div>
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
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-xs border border-(--brand-border)/60 text-[10px] font-bold text-(--brand-muted) flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4a90a4]" /> Station</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Event</span>
                </div>
              </div>

              <div className="px-5 py-3 bg-(--surface-soft)/40 border-t border-(--brand-border)/60 flex justify-end gap-2 text-[11px]">
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="px-4 py-1.5 rounded-xl font-bold text-(--brand-muted) hover:bg-(--surface-soft) transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-[#4a90a4] to-[#6cb567] text-white font-extrabold shadow-xs transition-colors cursor-pointer"
                >
                  Confirm Location
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}