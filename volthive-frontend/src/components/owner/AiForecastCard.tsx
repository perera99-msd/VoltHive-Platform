'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type HourlyData = {
  time: string;
  hour: number;
  occupancy: number;
  multiplier: number;
  recommendation: string;
};

type DailyData = {
  day: string;
  date: string;
  occupancy: number;
  avgMultiplier: number;
  status: string;
};

type ForecastPayload = {
  status: string;
  weather: { condition: string; temp: number; source: string };
  hourly: HourlyData[];
  daily: DailyData[];
  lastUpdated: string;
};

export default function AiForecastCard() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ForecastPayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchForecast = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl('/api/ai/forecast?weather=Clear&temp=28'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load forecast', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchForecast();
    const interval = setInterval(fetchForecast, 60000);
    return () => clearInterval(interval);
  }, [fetchForecast]);

  const handleForceRefresh = () => {
    setRefreshing(true);
    fetchForecast();
  };

  const nextPeak = data?.hourly.find(h => h.multiplier > 1.0) || data?.hourly[0];

  return (
    <div className="w-full mb-8 relative z-30">
      {/* COLLAPSED POP-UP TOP CARD (Site Theme) */}
      <motion.div
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.003 }}
        whileTap={{ scale: 0.997 }}
        className="cursor-pointer bg-(--brand-card) border border-(--brand-border) rounded-3xl p-5 shadow-sm hover:shadow-md transition-all text-(--brand-ink) flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-full bg-linear-to-l from-(--surface-soft) to-transparent pointer-events-none -z-0" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue) shrink-0 shadow-xs">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 00-2.456-2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-(--brand-blue) text-white shadow-xs">AI Surge Engine</span>
              <span className="text-xs text-(--brand-muted) font-semibold">• Live Weather Feed</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-(--brand-ink) mt-1 tracking-tight">
              {loading ? 'Analyzing Neural Grid Demand...' : `Next 6h Prediction: Peak Surge at ${nextPeak?.multiplier || 1.0}x (${nextPeak?.occupancy || 0}% Cap)`}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end relative z-10">
          <div className="px-4 py-2 rounded-xl bg-(--surface-soft) border border-(--brand-border) text-xs font-bold text-(--brand-ink) flex items-center gap-2">
            <span>☀️ {data?.weather.condition || 'Clear'} ({data?.weather.temp || 28}°C)</span>
          </div>
          <button className="px-5 py-2.5 bg-(--brand-blue) hover:bg-(--brand-blue-deep) text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer">
            <span>View Full Forecast</span>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
        </div>
      </motion.div>

      {/* EXPANDED FULL POPUP CARD MODAL (Site Theme) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-(--brand-ink)/60 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-(--brand-card) border border-(--brand-border) rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-(--brand-ink) my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 bg-(--surface-soft) border-b border-(--brand-border) flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-(--brand-blue)/15 border border-(--brand-blue)/25 flex items-center justify-center text-(--brand-blue)">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-(--brand-ink)">AI Engine Dynamic Price Suggestions</h2>
                    <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Model executes hourly predictions correlating live weather, grid congestion, and station capacity.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={handleForceRefresh}
                    disabled={refreshing}
                    className="px-4 py-2.5 bg-white hover:bg-(--surface-tint) text-(--brand-blue) text-xs font-bold rounded-xl border border-(--brand-border) shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                    <span>{refreshing ? 'Running Model...' : 'Run Hourly AI Cycle'}</span>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 bg-(--brand-card) hover:bg-(--surface-soft) border border-(--brand-border) text-(--brand-muted) hover:text-(--brand-ink) rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer transition-colors shadow-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1 bg-(--background)">
                {/* Weather & Sensor Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-(--brand-card) p-4 rounded-2xl border border-(--brand-border) shadow-xs">
                    <p className="text-[11px] uppercase font-bold text-(--brand-muted) tracking-wider">Connected Sensor</p>
                    <p className="text-sm font-bold text-(--brand-ink) mt-1">Free Weather API Feed</p>
                  </div>
                  <div className="bg-(--brand-card) p-4 rounded-2xl border border-(--brand-border) shadow-xs">
                    <p className="text-[11px] uppercase font-bold text-(--brand-muted) tracking-wider">Current Weather</p>
                    <p className="text-sm font-bold text-(--brand-ink) mt-1">☀️ {data?.weather.condition || 'Clear'} ({data?.weather.temp || 28}°C)</p>
                  </div>
                  <div className="bg-(--brand-card) p-4 rounded-2xl border border-(--brand-border) shadow-xs">
                    <p className="text-[11px] uppercase font-bold text-(--brand-muted) tracking-wider">Grid Surge Frequency</p>
                    <p className="text-sm font-bold text-(--brand-ink) mt-1">Every 60 Minutes</p>
                  </div>
                  <div className="bg-(--brand-card) p-4 rounded-2xl border border-(--brand-border) shadow-xs">
                    <p className="text-[11px] uppercase font-bold text-(--brand-muted) tracking-wider">Model Status</p>
                    <p className="text-sm font-bold text-(--brand-green) mt-1">● Active & Synchronized</p>
                  </div>
                </div>

                {/* Section 1: Next 6 Hours */}
                <div className="bg-(--brand-card) p-6 md:p-8 rounded-3xl border border-(--brand-border) shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-(--brand-ink) flex items-center gap-2">
                        <span>⏳ Hourly AI Surge Suggestions (Next 6 Hours)</span>
                      </h3>
                      <p className="text-xs text-(--brand-muted) mt-0.5">Predicted charging station occupancy percentage and AI tariff multipliers.</p>
                    </div>
                    <span className="text-xs font-semibold text-(--brand-blue-deep) bg-(--surface-soft) px-3 py-1.5 rounded-xl border border-(--brand-border) w-fit">
                      Updated: {data?.lastUpdated || 'Live'}
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.hourly || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4a90a4" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="#4a90a4" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e5e3" />
                        <XAxis dataKey="time" stroke="#6b6f72" fontSize={12} />
                        <YAxis stroke="#6b6f72" fontSize={12} unit="%" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e0e5e3', borderRadius: '12px', color: '#1a1a1a', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          formatter={(val: unknown, name: unknown) => [name === 'occupancy' ? `${val}% Occupancy` : `${val}x Tariff Multiplier`, name === 'occupancy' ? 'Predicted Load' : 'Surge Multiplier']}
                        />
                        <Area type="monotone" dataKey="occupancy" stroke="#4a90a4" strokeWidth={3} fillOpacity={1} fill="url(#colorOcc)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Hourly Ticker Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-8">
                    {data?.hourly.map((h, i) => (
                      <div key={i} className={`p-3.5 rounded-2xl border text-center transition-all ${h.multiplier > 1.0 ? 'bg-(--surface-soft) border-(--brand-blue) shadow-xs' : 'bg-(--background) border-(--brand-border)'}`}>
                        <p className="text-xs font-bold text-(--brand-muted)">{h.time}</p>
                        <p className={`text-lg font-black my-1 ${h.multiplier > 1.0 ? 'text-(--brand-blue-deep)' : 'text-(--brand-ink)'}`}>{h.multiplier}x</p>
                        <p className="text-[11px] text-(--brand-muted) font-semibold">{h.occupancy}% Load</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Next 5 Days */}
                <div className="bg-(--brand-card) p-6 md:p-8 rounded-3xl border border-(--brand-border) shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-(--brand-ink)">📅 Weekly Demand Outlook (Next 5 Days)</h3>
                    <p className="text-xs text-(--brand-muted) mt-0.5">Macroscopic weekday congestion forecasting based on historical driver check-ins.</p>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.daily || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e5e3" />
                        <XAxis dataKey="day" stroke="#6b6f72" fontSize={12} />
                        <YAxis stroke="#6b6f72" fontSize={12} unit="%" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e0e5e3', borderRadius: '12px', color: '#1a1a1a', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          formatter={(val: unknown) => [`${val}% Projected Hub Capacity`, 'Daily Load']}
                        />
                        <Bar dataKey="occupancy" fill="#6cb567" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
