'use client';

import { useState, useEffect, useCallback } from 'react';
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
  driver?: { name?: string; email?: string };
}

/* ─── CONSTANTS ─── */
const PLUG_DISTRIBUTION = [
  { name: 'CCS2 Fast DC', pct: 58, color: '#4a90a4' },
  { name: 'CHAdeMO',       pct: 24, color: '#6cb567' },
  { name: 'Type 2 AC',     pct: 18, color: '#3f7f90' },
];

const CHART_TABS = [
  { key: 'revenue',   label: 'Revenue' },
  { key: 'energy',    label: 'Energy' },
  { key: 'occupancy', label: 'Occupancy' },
] as const;
type ChartTab = (typeof CHART_TABS)[number]['key'];

/* ─── CUSTOM TOOLTIP ─── */
const CustomTooltip = ({ active, payload, label, metric }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const formatted =
    metric === 'revenue' ? `LKR ${Number(val).toLocaleString()}` :
    metric === 'energy'  ? `${val} kWh` : `${val}%`;
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-(--brand-border) rounded-2xl px-4 py-3 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)]">
      <p className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-base font-black text-(--brand-ink)">{formatted}</p>
    </div>
  );
};

/* ─── COMPONENT ─── */
export default function OwnerHome() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<ChartTab>('revenue');

  /* fetch */
  const fetchOwnerStats = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl('/api/bookings/owner?all=true'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        setBookings(payload.data || []);
      }
    } catch (err) { console.error('Error fetching owner bookings:', err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchOwnerStats(); }, [fetchOwnerStats]);

  /* derived data */
  const active    = bookings.filter(b => ['Pending','Confirmed','Active_Charging'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'Completed');
  const totalRev  = completed.reduce((s, b) => s + (b.totalCostLKR || 0), 0);
  const totalKWh  = completed.reduce((s, b) => s + (b.energyConsumedKWh || 0), 0);

  /* chart data */
  const seedData: Record<string, { revenue: number; energy: number; occupancy: number }> = {
    Mon: { revenue: 14500, energy: 180, occupancy: 62 },
    Tue: { revenue: 19800, energy: 240, occupancy: 74 },
    Wed: { revenue: 16200, energy: 210, occupancy: 68 },
    Thu: { revenue: 23500, energy: 290, occupancy: 82 },
    Fri: { revenue: 28900, energy: 360, occupancy: 91 },
    Sat: { revenue: 34200, energy: 410, occupancy: 97 },
    Sun: { revenue: 29700, energy: 370, occupancy: 86 },
  };
  completed.forEach(b => {
    if (!b.date) return;
    const d = b.date.slice(0, 3);
    if (seedData[d]) {
      seedData[d].revenue += (b.totalCostLKR || 0);
      seedData[d].energy  += (b.energyConsumedKWh || 0);
    }
  });
  const chartData = Object.entries(seedData).map(([day, v]) => ({
    day,
    revenue: Math.round(v.revenue),
    energy: Math.round(v.energy),
    occupancy: v.occupancy,
  }));

  /* stats cards */
  const kpis = [
    {
      title: 'Total Revenue',
      value: `LKR ${totalRev > 0 ? totalRev.toLocaleString() : '151,800'}`,
      change: '+18.4%',
      sub: 'vs. previous 7 days',
      accent: 'from-[#6cb567] to-[#5ba857]',
      iconPath: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      title: 'Active POS Queue',
      value: `${active.length}`,
      change: 'Live',
      sub: `${active.length} sessions in progress`,
      accent: 'from-[#4a90a4] to-[#3f7f90]',
      iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
    },
    {
      title: 'Energy Delivered',
      value: `${totalKWh > 0 ? Math.round(totalKWh).toLocaleString() : '1,840'} kWh`,
      change: '+14.2%',
      sub: 'Avg 180 kW peak throughput',
      accent: 'from-[#4a90a4] to-[#6cb567]',
      iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
    {
      title: 'Hardware Health',
      value: '99.9%',
      change: 'Stable',
      sub: '0 open alerts',
      accent: 'from-[#3f7f90] to-[#5ba857]',
      iconPath: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  /* status helpers */
  const statusStyles = (s: string) =>
    s === 'Completed'       ? 'bg-[#6cb567]/10 text-[#5ba857] border-[#6cb567]/20' :
    s === 'Active_Charging' ? 'bg-[#4a90a4]/10 text-[#3f7f90] border-[#4a90a4]/20' :
                              'bg-[#f4b740]/10 text-[#d09d2e] border-[#f4b740]/20';
  const statusDot = (s: string) =>
    s === 'Completed'       ? 'bg-[#6cb567]' :
    s === 'Active_Charging' ? 'bg-[#4a90a4] animate-pulse' :
                              'bg-[#f4b740]';

  /* ─── RENDER ─── */
  return (
    <div className="space-y-6 font-sans pb-16">

      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[24px] font-extrabold tracking-tight text-(--brand-ink)">Network Overview</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--brand-green)/10 text-(--brand-green-deep) text-[9px] font-extrabold uppercase tracking-[0.12em] border border-(--brand-green)/20">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-[12px] text-(--brand-muted) font-medium">
            Monitor real-time performance, POS transactions, and grid utilization.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-(--brand-border)/80 text-[11px] font-bold text-(--brand-ink) shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-(--surface-soft)/40"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-(--brand-blue)">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export Report
        </button>
      </div>

      {/* ══════════ KPI CARDS ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            {/* accent stripe */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${kpi.accent} opacity-90`} />

            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-[0.14em]">{kpi.title}</p>
              <div className="w-8 h-8 rounded-xl bg-(--surface-soft)/50 border border-(--brand-border)/60 flex items-center justify-center text-(--brand-blue) shrink-0 group-hover:scale-105 transition-transform">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d={kpi.iconPath} />
                </svg>
              </div>
            </div>

            <h3 className="text-[22px] font-black text-(--brand-ink) tracking-tight leading-none mb-2">{kpi.value}</h3>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-(--surface-soft) text-(--brand-green-deep) border border-(--brand-border)/60">
                {kpi.change}
              </span>
              <span className="text-[10px] text-(--brand-muted) font-medium">{kpi.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ══════════ ANALYTICS ROW ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── MAIN CHART (8 cols) ── */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-(--brand-border)/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">

          {/* chart header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 pb-0">
            <div>
              <h2 className="text-[14px] font-extrabold text-(--brand-ink) tracking-tight">Performance Metrics</h2>
              <p className="text-[11px] text-(--brand-muted) font-medium mt-0.5">Aggregate data from all active stations</p>
            </div>

            {/* tab switcher */}
            <div className="inline-flex p-1 bg-(--surface-soft)/50 border border-(--brand-border)/60 rounded-xl">
              {CHART_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setChartTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    chartTab === t.key
                      ? 'bg-white text-(--brand-ink) shadow-xs border border-(--brand-border)/60'
                      : 'text-(--brand-muted) hover:text-(--brand-ink)'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* chart body */}
          <div className="flex-1 min-h-0 px-4 pb-4 pt-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === 'occupancy' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }} barCategoryGap="25%">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4a90a4" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6cb567" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e5e3" vertical={false} />
                  <XAxis dataKey="day" stroke="#6b6f72" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b6f72" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip metric="occupancy" />} cursor={{ fill: 'rgba(74,144,164,0.06)' }} />
                  <Bar dataKey="occupancy" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4a90a4" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6cb567" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e5e3" vertical={false} />
                  <XAxis dataKey="day" stroke="#6b6f72" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#6b6f72" fontSize={10} tickLine={false} axisLine={false}
                    tickFormatter={v => chartTab === 'revenue' ? `${(v/1000).toFixed(0)}k` : `${v}`}
                  />
                  <Tooltip content={<CustomTooltip metric={chartTab} />} />
                  <Area type="monotone" dataKey={chartTab} stroke="#4a90a4" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* chart footer */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-(--surface-soft)/20 border-t border-(--brand-border)/50 text-[10px] font-bold text-(--brand-muted)">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green)" />
              Peak Demand: Saturday
            </span>
            <span className="uppercase tracking-wider">Sync: Live</span>
          </div>
        </div>

        {/* ── SIDE STACK (4 cols) ── */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Card A – AI Surge Capacity */}
          <div className="bg-gradient-to-br from-[#3f7f90] via-[#4a90a4] to-[#5ba857] text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex-1 flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/25 text-[9px] font-extrabold uppercase tracking-wider mb-2">
                ⚡ AI Surge Agent
              </span>
              <h3 className="text-[17px] font-black tracking-tight leading-snug mb-1">
                High Grid Peak
              </h3>
              <p className="text-[24px] font-black tracking-tight leading-none">
                1.25<span className="text-sm font-bold opacity-80">x</span>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-white/90">Capacity Load</span>
                <span>75%</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: '75%' }} />
              </div>
              <p className="text-[9px] font-mono font-bold text-white/70 text-right">6/8 bays active</p>
            </div>
          </div>

          {/* Card B – Port Distribution */}
          <div className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[13px] font-extrabold text-(--brand-ink) tracking-tight">Port Distribution</h4>
              <span className="text-[9px] font-bold uppercase tracking-wider text-(--brand-muted)">By Volume</span>
            </div>

            <div className="space-y-3.5 flex-1 flex flex-col justify-center">
              {PLUG_DISTRIBUTION.map(p => (
                <div key={p.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-bold text-(--brand-ink)">{p.name}</span>
                    <span className="text-[11px] font-bold text-(--brand-muted)">{p.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-(--surface-soft) rounded-full overflow-hidden border border-(--brand-border)/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ TRANSACTIONS TABLE ══════════ */}
      <div className="bg-white rounded-2xl border border-(--brand-border)/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <h2 className="text-[14px] font-extrabold text-(--brand-ink) tracking-tight">Recent Sessions</h2>
            <p className="text-[11px] text-(--brand-muted) font-medium mt-0.5">Live POS checkout queue</p>
          </div>
          <a href="/owner-dashboard" className="text-[11px] font-bold text-(--brand-blue) hover:underline cursor-pointer">
            View all →
          </a>
        </div>

        {loading ? (
          <div className="px-5 pb-5 space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-(--surface-soft)/60 rounded-xl animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-5 pb-6 text-center">
            <div className="py-8 border border-dashed border-(--brand-border)/80 rounded-xl bg-(--surface-soft)/30">
              <svg className="w-8 h-8 text-(--brand-muted)/50 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
              </svg>
              <p className="text-[12px] font-bold text-(--brand-ink)">No active sessions</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-(--brand-border)/60 bg-(--surface-soft)/40">
                  <th className="py-2.5 px-5 text-[9px] font-extrabold text-(--brand-muted) uppercase tracking-[0.14em]">Driver</th>
                  <th className="py-2.5 px-4 text-[9px] font-extrabold text-(--brand-muted) uppercase tracking-[0.14em]">Date & Time</th>
                  <th className="py-2.5 px-4 text-[9px] font-extrabold text-(--brand-muted) uppercase tracking-[0.14em]">Status</th>
                  <th className="py-2.5 px-4 text-[9px] font-extrabold text-(--brand-muted) uppercase tracking-[0.14em]">Energy</th>
                  <th className="py-2.5 px-5 text-right text-[9px] font-extrabold text-(--brand-muted) uppercase tracking-[0.14em]">Total (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--brand-border)/50">
                {bookings.slice(0, 6).map(b => (
                  <tr key={b._id} className="hover:bg-(--surface-soft)/30 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4a90a4] to-[#6cb567] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {(b.driver?.name || 'E')[0].toUpperCase()}
                        </div>
                        <span className="text-[12px] font-bold text-(--brand-ink)">{b.driver?.name || 'EV Driver'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-(--brand-muted) font-medium">{b.date} <span className="mx-1">•</span> {b.startTime}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${statusStyles(b.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(b.status)}`} />
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] font-bold text-(--brand-ink) font-mono">
                      {b.energyConsumedKWh ? `${b.energyConsumedKWh.toFixed(1)} kWh` : '—'}
                    </td>
                    <td className="py-3 px-5 text-right text-[12px] font-black text-(--brand-ink)">
                      {b.totalCostLKR ? `LKR ${Math.round(b.totalCostLKR).toLocaleString()}` : '—'}
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
