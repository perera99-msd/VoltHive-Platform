'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';

/* ─── TYPES ─── */
interface Booking {
  _id: string;
  status: string;
  totalCostLKR?: number;
  energyConsumedKWh?: number;
  date: string;
  startTime: string;
  endTime?: string;
  customerName?: string;
  driver?: { name?: string; email?: string };
  station?: { stationName?: string };
  lockedPricePerKwh?: number;
}

interface Charger {
  _id: string;
  plugType: string;
  powerKW: number;
  basePricePerKwh: number;
  status: string;
  currentRate?: number;
}

interface Station {
  _id: string;
  stationName: string;
  address?: string;
  chargers?: Charger[];
  basePricePerKwh?: number;
}

interface AiForecast {
  aiConnected?: boolean;
  hourly?: { time: string; occupancy: number; multiplier: number; recommendation: string }[];
  weather?: { condition: string; temp: number };
}

/* ─── CHART TABS ─── */
const CHART_TABS = [
  { key: 'sessions',   label: 'Sessions' },
  { key: 'bookings',   label: 'Bookings' },
  { key: 'occupancy',  label: 'Occupancy' },
] as const;
type ChartTab = (typeof CHART_TABS)[number]['key'];

/* ─── CUSTOM TOOLTIP ─── */
const CustomTooltip = ({ active, payload, label, metric }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const formatted = metric === 'occupancy' ? `${val}%` : `${val}`;
  return (
    <div className="bg-white/95 backdrop-blur-2xl border border-[#e0e5e3] rounded-2xl px-4 py-3 shadow-[0_12px_32px_-8px_rgba(9,32,52,0.12)]">
      <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-base font-black text-(--brand-ink)">{formatted}</p>
    </div>
  );
};

/* ─── COMPONENT ─── */
export default function OwnerHome({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [aiData, setAiData] = useState<AiForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<ChartTab>('sessions');

  /* fetch owner's bookings + stations + live AI forecast */
  const fetchOwnerStats = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const token = await user.getIdToken();
      const [bookingsRes, stationsRes] = await Promise.all([
        fetch(apiUrl('/api/bookings/owner?all=true'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/stations/owner'), { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      let stationsList: Station[] = [];
      if (bookingsRes.ok) {
        const payload = await bookingsRes.json();
        setBookings(payload.data || []);
      }
      if (stationsRes.ok) {
        const payload = await stationsRes.json();
        stationsList = payload.data || [];
        setStations(stationsList);
      }

      // Live AI station forecast (first station)
      if (stationsList.length > 0) {
        const forecastRes = await fetch(apiUrl(`/api/ai/station-forecast/${stationsList[0]._id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (forecastRes.ok) {
          setAiData(await forecastRes.json());
        }
      }
    } catch (err) {
      console.error('Error fetching owner stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOwnerStats(); }, [fetchOwnerStats]);

  /* ─── REAL DERIVED DATA ─── */
  const allChargers = useMemo(() => stations.flatMap(s => s.chargers || []), [stations]);

  const active     = bookings.filter(b => ['Pending', 'Confirmed', 'Active_Charging'].includes(b.status));
  const pending    = bookings.filter(b => b.status === 'Pending');
  const completed  = bookings.filter(b => b.status === 'Completed');
  // Settlement is manual/off-system (no energy/cost auto-calc). Surface the
  // REAL metrics we do track: completed-session count + average agreed rate.
  const agreedRates = completed.map(b => Number(b.lockedPricePerKwh)).filter(r => Number.isFinite(r) && r > 0);
  const avgAgreedRate = agreedRates.length
    ? Math.round(agreedRates.reduce((s, r) => s + r, 0) / agreedRates.length)
    : 0;

  const offlineChargers = allChargers.filter(c => c.status === 'OFFLINE').length;
  const availableChargers = allChargers.filter(c => c.status === 'AVAILABLE').length;
  const hardwareHealth = allChargers.length > 0
    ? Math.round(((allChargers.length - offlineChargers) / allChargers.length) * 1000) / 10
    : 0;

  const rateOf = (c: Charger) => Number(c.currentRate) || Number(c.basePricePerKwh) || 0;
  const pricedChargers = allChargers.filter(c => rateOf(c) > 0);
  const avgTariff = pricedChargers.length > 0
    ? Math.round(pricedChargers.reduce((s, c) => s + rateOf(c), 0) / pricedChargers.length)
    : 0;

  // Plug distribution from REAL chargers
  const plugDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    allChargers.forEach(c => {
      const p = c.plugType || 'Unknown';
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: allChargers.length ? Math.round((count / allChargers.length) * 100) : 0,
        color: name.includes('CCS') ? '#2563eb' : name.includes('Type') ? '#2fb39a' : '#4a90a4',
      }))
      .sort((a, b) => b.count - a.count);
  }, [allChargers]);

  // Last-7-days chart from REAL bookings (completed sessions, total bookings,
  // and day occupancy = bookings vs installed ports).
  const chartData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days: { day: string; sessions: number; bookings: number; occupancy: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const completedDay = completed.filter(b => b.date === key);
      const allDay = bookings.filter(b => b.date === key);
      days.push({
        day: dayNames[d.getDay()],
        sessions: completedDay.length,
        bookings: allDay.length,
        occupancy: allChargers.length ? Math.min(100, Math.round((allDay.length / allChargers.length) * 100)) : 0,
      });
    }
    return days;
  }, [completed, bookings, allChargers]);

  const currentOccupancy = allChargers.length
    ? Math.min(100, Math.round((active.length / allChargers.length) * 100))
    : 0;

  const hasData = bookings.length > 0 || allChargers.length > 0;
  const peakDay = chartData.reduce((a, b) => (b.sessions > a.sessions ? b : a), chartData[0]);

  // Real AI signal for the surge card
  const aiHour = aiData?.hourly?.[0];
  const aiMultiplier = aiHour?.multiplier;
  const aiOccupancy = aiHour?.occupancy;
  const aiRecommendation = aiHour?.recommendation;
  const aiWeather = aiData?.weather;

  /* stats cards */
  const kpis = [
    {
      title: 'Completed Sessions',
      value: completed.length ? `${completed.length}` : 'No data yet',
      change: completed.length ? 'Settled' : 'Pending',
      sub: avgAgreedRate > 0 ? `Avg LKR ${avgAgreedRate}/kWh agreed` : 'No completed sessions',
      accent: 'from-[#2fb39a] to-[#2563eb]',
      iconPath: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      title: 'Active POS Queue',
      value: `${active.length}`,
      change: active.length ? 'Live Active' : 'Idle',
      sub: `${pending.length} awaiting approval`,
      accent: 'from-[#2563eb] to-[#4a90a4]',
      iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
    },
    {
      title: 'Average Agreed Rate',
      value: avgAgreedRate > 0 ? `LKR ${avgAgreedRate}/kWh` : '—',
      change: completed.length ? `${completed.length} sessions` : 'No sessions',
      sub: avgTariff > 0 ? `Current avg ${avgTariff} LKR/kWh` : 'No chargers installed',
      accent: 'from-[#4a90a4] to-[#2fb39a]',
      iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
    {
      title: 'Hardware Health',
      value: allChargers.length > 0 ? `${hardwareHealth}%` : 'No hardware',
      change: offlineChargers > 0 ? `${offlineChargers} offline` : '100% Online',
      sub: `${availableChargers} of ${allChargers.length} available`,
      accent: 'from-[#3eb398] to-[#2fb39a]',
      iconPath: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  /* export real bookings to CSV */
  const exportCSV = () => {
    const header = ['Driver', 'Station', 'Date', 'Start', 'End', 'Status', 'Agreed Rate (LKR/kWh)'];
    const rows = bookings.map(b => [
      b.driver?.name || b.customerName || 'Walk-in Driver',
      b.station?.stationName || '',
      b.date,
      b.startTime,
      b.endTime,
      b.status,
      b.lockedPricePerKwh ?? '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volthive-owner-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* status helpers */
  const statusStyles = (s: string) =>
    s === 'Completed'       ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/25' :
    s === 'Active_Charging' ? 'bg-(--brand-blue)/10 text-(--brand-blue-deep) border-(--brand-blue)/25' :
                              'bg-amber-500/10 text-amber-700 border-amber-500/25';
  const statusDot = (s: string) =>
    s === 'Completed'       ? 'bg-(--brand-green)' :
    s === 'Active_Charging' ? 'bg-(--brand-blue) animate-pulse' :
                              'bg-amber-500';

  const todayString = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  /* ─── RENDER ─── */
  return (
    <div className="space-y-6 font-sans pb-16">

      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--brand-ink)">
              Network Operations
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--brand-green)/12 text-(--brand-green-deep) text-[10px] font-extrabold uppercase tracking-[0.14em] border border-(--brand-green)/25 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-(--brand-muted) font-medium">
            Real-time grid performance, POS charging queue, and predictive revenue synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-(--surface-soft)/60 border border-[#e0e5e3]/80 text-xs font-bold text-(--brand-muted)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-(--brand-blue)">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {todayString}
          </div>

          <button
            onClick={exportCSV}
            disabled={bookings.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#e0e5e3] text-xs font-bold text-(--brand-ink) shadow-xs hover:shadow-md transition-all cursor-pointer hover:bg-(--surface-soft)/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 text-(--brand-blue)">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ══════════ KPI CARDS ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl border border-[#e0e5e3]/90 p-5 shadow-[0_4px_20px_-4px_rgba(9,32,52,0.04)] hover:shadow-lg transition-all group relative overflow-hidden flex flex-col justify-between"
          >
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[3.5px] bg-linear-to-r ${kpi.accent}`} />

            <div>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-black text-(--brand-muted) uppercase tracking-[0.14em]">
                  {kpi.title}
                </p>
                <div className="w-9 h-9 rounded-xl bg-(--surface-soft)/60 border border-[#e0e5e3]/80 flex items-center justify-center text-(--brand-blue) shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={kpi.iconPath} />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-black text-(--brand-ink) tracking-tight leading-none mb-2">
                {kpi.value}
              </h3>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#e0e5e3]/50">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-(--brand-green)/10 text-(--brand-green-deep) border border-(--brand-green)/20">
                {kpi.change}
              </span>
              <span className="text-[11px] text-(--brand-muted) font-semibold truncate">{kpi.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ══════════ DRIVER MESSAGES QUICK LINK BANNER ══════════ */}
      <button
        onClick={() => onNavigate?.('chat')}
        className="w-full flex items-center justify-between gap-4 p-4.5 rounded-2xl bg-linear-to-r from-[#eef7f4] via-[#f1f6f8] to-[#eaf2f8] border border-[#e0e5e3] hover:shadow-md transition-all cursor-pointer text-left group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-extrabold text-(--brand-ink)">Station Chat & Driver Inquiries</p>
              <span className="px-2 py-0.5 rounded-full bg-(--brand-blue)/15 text-(--brand-blue-deep) text-[9px] font-black uppercase tracking-wider">
                Direct Sync
              </span>
            </div>
            <p className="text-xs text-(--brand-muted) font-medium truncate mt-0.5">
              Instant messaging threads with drivers charging across your stations.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-(--brand-blue-deep) whitespace-nowrap shrink-0 group-hover:translate-x-0.5 transition-transform">
          Open Messages Inbox →
        </span>
      </button>

      {/* ══════════ ANALYTICS & INTELLIGENCE ROW ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── MAIN CHART (8 cols) ── */}
        <div className="lg:col-span-8 bg-white/90 backdrop-blur-xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden">

          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-(--brand-ink) tracking-tight">Performance Analytics</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-(--surface-soft) text-(--brand-muted) border border-[#e0e5e3]/80">
                  Last 7 Days
                </span>
              </div>
              <p className="text-xs text-(--brand-muted) font-medium mt-0.5">
                Completed charging sessions, reservation volume, and station occupancy curves.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="inline-flex p-1 bg-(--surface-soft)/70 border border-[#e0e5e3]/90 rounded-2xl shrink-0">
              {CHART_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setChartTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    chartTab === t.key
                      ? 'bg-white text-(--brand-ink) shadow-xs border border-[#e0e5e3]'
                      : 'text-(--brand-muted) hover:text-(--brand-ink)'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Body */}
          <div className="flex-1 min-h-0 px-4 pb-4 pt-2" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === 'occupancy' ? (
                <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }} barCategoryGap="28%">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#2fb39a" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6ece9" vertical={false} />
                  <XAxis dataKey="day" stroke="#717a76" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis stroke="#717a76" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip metric="occupancy" />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
                  <Bar dataKey="occupancy" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2fb39a" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6ece9" vertical={false} />
                  <XAxis dataKey="day" stroke="#717a76" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#717a76" fontSize={11} fontWeight={600} tickLine={false} axisLine={false}
                    tickFormatter={v => `${v}`}
                  />
                  <Tooltip content={<CustomTooltip metric={chartTab} />} />
                  <Area type="monotone" dataKey={chartTab} stroke="#2fb39a" strokeWidth={3} fill="url(#areaGrad)" dot={false} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Chart Footer */}
          <div className="flex items-center justify-between px-6 py-3 bg-(--surface-soft)/30 border-t border-[#e0e5e3]/70 text-[11px] font-extrabold text-(--brand-muted)">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-(--brand-green)" />
              {peakDay && peakDay.sessions > 0 ? `Peak Day: ${peakDay.day} (${peakDay.sessions} sessions)` : 'Telemetry Sync Active'}
            </span>
            <span className="uppercase tracking-wider font-black text-(--brand-blue-deep)">Live Feed</span>
          </div>
        </div>

        {/* ── SIDE STACK (4 cols) ── */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Card A – Live AI Surge & Grid Agent */}
          <div className="bg-linear-to-br from-[#2a7a8c] via-[#35978f] to-[#3eb398] text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex-1 flex flex-col justify-between">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-black/10 blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[10px] font-black uppercase tracking-wider">
                  ⚡ AI Dynamic Grid Agent
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                  Adaptive
                </span>
              </div>

              <h3 className="text-lg font-black tracking-tight leading-snug mb-1">
                {aiRecommendation || (hasData ? 'Optimal Tariff Equilibrium' : 'Standby Mode')}
              </h3>

              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-3xl font-black tracking-tight leading-none">
                  {aiMultiplier ? `${Number(aiMultiplier).toFixed(2)}x` : '1.00x'}
                </p>
                <span className="text-xs font-extrabold uppercase tracking-wider text-white/80">
                  Tariff Multiplier
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/20 space-y-2.5">
              <div className="flex justify-between text-[11px] font-extrabold uppercase tracking-wider">
                <span className="text-white/90">
                  {aiWeather ? `${aiWeather.condition} · ${Math.round(aiWeather.temp)}°C` : 'Station Capacity'}
                </span>
                <span>{aiOccupancy != null ? `${Math.round(aiOccupancy)}%` : `${currentOccupancy}%`}</span>
              </div>

              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: `${aiOccupancy != null ? Math.min(100, Math.round(aiOccupancy)) : currentOccupancy}%` }}
                />
              </div>

              <p className="text-[10px] font-bold text-white/75 text-right truncate">
                {stations[0]?.stationName || 'Primary Station'} · Live Forecast
              </p>
            </div>
          </div>

          {/* Card B – Port Distribution */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-[#e0e5e3]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-(--brand-ink) tracking-tight">Plug Architecture</h4>
                <p className="text-[11px] text-(--brand-muted) font-medium">Installed hardware distribution</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-(--surface-soft) text-(--brand-muted) border border-[#e0e5e3]/80">
                {allChargers.length} Ports
              </span>
            </div>

            <div className="space-y-3.5 flex-1 flex flex-col justify-center">
              {plugDistribution.length === 0 ? (
                <p className="text-xs text-(--brand-muted) font-medium text-center py-6">
                  No chargers registered yet.
                </p>
              ) : (
                plugDistribution.map(p => (
                  <div key={p.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-bold text-(--brand-ink)">
                        {p.name} <span className="text-(--brand-muted) font-medium">({p.count} units)</span>
                      </span>
                      <span className="text-xs font-extrabold text-(--brand-ink)">{p.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-(--surface-soft) rounded-full overflow-hidden border border-[#e0e5e3]/60">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ TRANSACTIONS TABLE ══════════ */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-(--brand-ink) tracking-tight">Recent Sessions & POS Log</h2>
            <p className="text-xs text-(--brand-muted) font-medium mt-0.5">
              Live driver checkouts, smart tariff locking, and charging sessions.
            </p>
          </div>
          <button
            onClick={() => onNavigate?.('bookings')}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-(--brand-blue-deep) hover:underline cursor-pointer"
          >
            Open Live Operations →
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-(--surface-soft)/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center">
            <div className="py-10 border border-dashed border-[#e0e5e3] rounded-2xl bg-(--surface-soft)/30 max-w-md mx-auto">
              <svg className="w-10 h-10 text-(--brand-muted)/40 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
              </svg>
              <p className="text-sm font-bold text-(--brand-ink)">No active sessions recorded yet</p>
              <p className="text-xs text-(--brand-muted) mt-0.5">Incoming driver reservations will populate here live.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-y border-[#e0e5e3]/80 bg-(--surface-soft)/50">
                  <th className="py-3 px-6 text-[10px] font-black text-(--brand-muted) uppercase tracking-[0.14em]">Driver</th>
                  <th className="py-3 px-4 text-[10px] font-black text-(--brand-muted) uppercase tracking-[0.14em]">Station</th>
                  <th className="py-3 px-4 text-[10px] font-black text-(--brand-muted) uppercase tracking-[0.14em]">Schedule</th>
                  <th className="py-3 px-4 text-[10px] font-black text-(--brand-muted) uppercase tracking-[0.14em]">Status</th>
                  <th className="py-3 px-6 text-right text-[10px] font-black text-(--brand-muted) uppercase tracking-[0.14em]">Agreed Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e5e3]/60 text-sm">
                {bookings.slice(0, 6).map(b => (
                  <tr key={b._id} className="hover:bg-(--surface-soft)/40 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-(--brand-blue) to-(--brand-green) text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {(b.driver?.name || 'D')[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-(--brand-ink)">{b.driver?.name || 'Walk-in Driver'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-(--brand-muted)">
                      {b.station?.stationName || 'Station Point'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-(--brand-muted) font-medium">
                      <span className="font-bold text-(--brand-ink)">{b.date}</span> <span className="mx-1">•</span> {b.startTime}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${statusStyles(b.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(b.status)}`} />
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-(--brand-ink) font-mono">
                      {b.lockedPricePerKwh ? `LKR ${b.lockedPricePerKwh}/kWh` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

