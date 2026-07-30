'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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

type SpecialEvent = {
  _id: string;
  title: string;
  date: string;
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
  station?: { id: string; name: string; city: string; coordinates: [number, number] };
  weather: { condition: string; temp: number; source: string };
  specialEvents: SpecialEvent[];
  activeEvent?: SpecialEvent | null;
  hourly: HourlyData[];
  daily: DailyData[];
  lastUpdated: string;
};

export default function AiForecastCard() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stations & Selection
  const [stations, setStations] = useState<StationItem[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [data, setData] = useState<ForecastPayload | null>(null);

  // New Event Form
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [addingEvent, setAddingEvent] = useState(false);

  // 1. Fetch Owner's Stations
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
          } else {
            // No stations yet, load default forecast
            fetchStationForecast('');
          }
        }
      } catch (err) {
        console.error('Failed to load stations', err);
      }
    };
    fetchStations();
  }, [user]);

  // 2. Fetch Forecast for Selected Station
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
      }
    } catch (err) {
      console.error('Failed to load station forecast', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedStationId) {
      fetchStationForecast(selectedStationId);
    }
  }, [selectedStationId, fetchStationForecast]);

  const handleForceRefresh = () => {
    setRefreshing(true);
    fetchStationForecast(selectedStationId);
  };

  // 3. Add Manual Special Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStationId || !newTitle || !newDate) return;
    setAddingEvent(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/ai/station-events/${selectedStationId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, date: newDate, category: 'Sports Event / Cricket Match' })
      });
      if (res.ok) {
        setNewTitle('');
        setNewDate('');
        handleForceRefresh();
      }
    } catch (err) {
      console.error('Failed to add event', err);
    } finally {
      setAddingEvent(false);
    }
  };

  // 4. Delete Event
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

  const nextPeak = data?.hourly.find(h => h.multiplier > 1.0) || data?.hourly[0];
  const stationNameDisplay = data?.station?.name || stations.find(s => s._id === selectedStationId)?.stationName || 'Network Hub';

  /* ─── Weather icon helper ─── */
  const weatherIcon = (condition: string) => {
    const c = condition?.toLowerCase() || '';
    if (c.includes('cloud') || c.includes('overcast')) return '☁️';
    if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
    if (c.includes('thunder') || c.includes('storm')) return '⛈️';
    return '☀️';
  };

  return (
    <div className="w-full mb-6 relative z-30 font-sans">

      {/* ══════════ COLLAPSED BAR ══════════ */}
      <motion.div
        onClick={() => setIsOpen(true)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.998 }}
        className="cursor-pointer bg-white border border-(--brand-border)/80 rounded-2xl px-5 py-3.5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all flex items-center justify-between gap-4 group"
      >
        {/* Left section */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4a90a4] to-[#6cb567] flex items-center justify-center shrink-0">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="white" className="w-[18px] h-[18px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-(--brand-blue) truncate">{stationNameDisplay}</span>
              <span className="text-[10px] text-(--brand-muted) font-medium hidden sm:inline">· {data?.weather.source || 'Open-Meteo API'}</span>
              {data?.activeEvent && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#f4b740]/12 text-[#d09d2e] border border-[#f4b740]/25">
                  🏏 {data.activeEvent.title}
                </span>
              )}
            </div>
            <p className="text-[13px] font-bold text-(--brand-ink) tracking-tight truncate mt-0.5">
              {loading ? 'Evaluating...' : `AI Surge: ${nextPeak?.recommendation || 'Normal Demand'} (${nextPeak?.multiplier || 1.0}x)`}
            </p>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--surface-soft) border border-(--brand-border)/60 text-[11px] font-semibold text-(--brand-ink)">
            {weatherIcon(data?.weather.condition || 'Clear')} {data?.weather.condition || 'Clear'} · {data?.weather.temp || 30}°C
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--brand-blue) text-white text-[11px] font-bold group-hover:bg-(--brand-blue-deep) transition-colors">
            <span className="hidden sm:inline">Cockpit</span>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </div>
        </div>
      </motion.div>

      {/* ══════════ EXPANDED COCKPIT MODAL ══════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-(--brand-ink)/50 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.97, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border border-(--brand-border)/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            >

              {/* ── Modal Header ── */}
              <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-(--brand-border)/60">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4a90a4] to-[#6cb567] flex items-center justify-center shrink-0">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[17px] font-extrabold text-(--brand-ink) tracking-tight truncate">AI Surge Command Cockpit</h2>
                    <p className="text-[11px] text-(--brand-muted) font-medium mt-0.5">6 causal input variables · per-station forecast</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {stations.length > 1 && (
                    <select
                      value={selectedStationId}
                      onChange={e => setSelectedStationId(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-(--surface-soft) border border-(--brand-border)/60 text-[11px] font-bold text-(--brand-ink) focus:outline-none focus:border-(--brand-blue) cursor-pointer"
                    >
                      {stations.map(st => (
                        <option key={st._id} value={st._id}>{st.stationName}</option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={handleForceRefresh}
                    disabled={refreshing}
                    className="p-2 rounded-lg bg-(--surface-soft) border border-(--brand-border)/60 text-(--brand-blue) hover:bg-(--surface-tint) transition-colors cursor-pointer"
                    title="Run Prediction"
                  >
                    <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-(--surface-soft) transition-colors cursor-pointer text-(--brand-muted)"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* ── Modal Body ── */}
              <div className="p-6 overflow-y-auto space-y-6 max-h-[calc(90vh-80px)]">

                {/* SECTION 1: Special Events Calendar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                  {/* Left: Events List */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[14px] font-extrabold text-(--brand-ink) tracking-tight">Special Events Calendar</h3>
                        <p className="text-[11px] text-(--brand-muted) font-medium mt-0.5">{stationNameDisplay} · Scheduled events trigger surge pricing</p>
                      </div>
                      <span className="text-[10px] font-bold text-(--brand-blue) bg-(--brand-blue)/8 px-2.5 py-1 rounded-lg border border-(--brand-blue)/15">
                        {data?.specialEvents?.length || 0} events
                      </span>
                    </div>

                    {!data?.specialEvents || data.specialEvents.length === 0 ? (
                      <div className="py-10 text-center rounded-xl border-2 border-dashed border-(--brand-border)/80 bg-(--surface-soft)/20">
                        <p className="text-[12px] text-(--brand-muted) font-medium">No upcoming events scheduled. Add a match or festival below.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.specialEvents.map((ev, idx) => {
                          const evDate = new Date(ev.date);
                          const now = new Date();
                          const diffDays = Math.ceil((evDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                          const isWithinWeek = diffDays >= 0 && diffDays <= 7;

                          return (
                            <div
                              key={ev._id || idx}
                              className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                                isWithinWeek
                                  ? 'bg-[#f4b740]/6 border-[#f4b740]/30'
                                  : 'bg-(--surface-soft)/40 border-(--brand-border)/60'
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-bold text-(--brand-ink) bg-white px-2 py-0.5 rounded-md border border-(--brand-border)/60">{ev.date}</span>
                                  {isWithinWeek && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#f4b740] text-white uppercase tracking-wider">Active</span>
                                  )}
                                </div>
                                <p className="text-[13px] font-bold text-(--brand-ink) truncate">{ev.title}</p>
                                <p className="text-[10px] text-(--brand-muted) font-medium">{ev.category}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => ev._id && handleDeleteEvent(ev._id)}
                                className="p-1.5 text-(--ui-error) hover:bg-(--ui-error)/8 rounded-lg transition-colors cursor-pointer shrink-0"
                                title="Remove event"
                              >
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Add Event Form */}
                  <div className="p-5 rounded-xl bg-(--surface-soft)/40 border border-(--brand-border)/60 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[13px] font-extrabold text-(--brand-ink) tracking-tight mb-4">Schedule Event</h4>

                      <form onSubmit={handleAddEvent} className="space-y-3.5">
                        <div>
                          <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.12em] block mb-1.5">Event Title</label>
                          <input
                            type="text"
                            required
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            placeholder="e.g. Asia Cup Final ODI"
                            className="w-full px-3 py-2.5 rounded-lg bg-white border border-(--brand-border)/80 text-[12px] font-medium text-(--brand-ink) placeholder:text-(--brand-muted)/50 focus:outline-none focus:border-(--brand-blue) transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-[0.12em] block mb-1.5">Event Date</label>
                          <input
                            type="date"
                            required
                            value={newDate}
                            onChange={e => setNewDate(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-white border border-(--brand-border)/80 text-[12px] font-medium text-(--brand-ink) focus:outline-none focus:border-(--brand-blue) transition-colors"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={addingEvent}
                          className="w-full py-2.5 rounded-lg bg-(--brand-blue) hover:bg-(--brand-blue-deep) text-white font-bold text-[11px] transition-all shadow-sm cursor-pointer"
                        >
                          {addingEvent ? 'Scheduling...' : 'Add Event'}
                        </button>
                      </form>
                    </div>

                    <div className="mt-5 pt-4 border-t border-(--brand-border)/50 space-y-1 text-[10px] text-(--brand-muted) font-medium">
                      <p>📍 Source: {data?.weather.source || 'Open-Meteo API'}</p>
                      <p>{weatherIcon(data?.weather.condition || 'Clear')} {data?.weather.condition || 'Clear'}, {data?.weather.temp || 30}°C</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Charts */}
                <div className="pt-5 border-t border-(--brand-border)/50">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Left: Hourly Forecast Chart */}
                    <div className="lg:col-span-2 space-y-3">
                      <div>
                        <h3 className="text-[14px] font-extrabold text-(--brand-ink) tracking-tight">6-Hour Capacity Curve</h3>
                        <p className="text-[11px] text-(--brand-muted) font-medium mt-0.5">Predicted occupancy driven by time, weather, grid load, and events</p>
                      </div>

                      <div className="h-56 w-full">
                        {loading ? (
                          <div className="w-full h-full flex items-center justify-center bg-(--surface-soft)/30 rounded-xl border border-(--brand-border)/60 animate-pulse">
                            <span className="text-[11px] font-bold text-(--brand-muted)">Calculating forecast...</span>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.hourly || []} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#4a90a4" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#4a90a4" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e5e3" />
                              <XAxis dataKey="time" stroke="#6b6f72" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke="#6b6f72" fontSize={10} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'white',
                                  borderRadius: '12px',
                                  border: '1px solid #e0e5e3',
                                  fontSize: '11px',
                                  boxShadow: '0 8px 24px -6px rgba(0,0,0,0.1)',
                                }}
                                formatter={(val: any) => [`${val}%`, 'Occupancy']}
                              />
                              <Area type="monotone" dataKey="occupancy" stroke="#4a90a4" strokeWidth={2.5} fillOpacity={1} fill="url(#occGrad)" dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Right: 7-Day Outlook */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-[14px] font-extrabold text-(--brand-ink) tracking-tight">7-Day Outlook</h3>
                        <p className="text-[11px] text-(--brand-muted) font-medium mt-0.5">Daily occupancy expectations</p>
                      </div>

                      <div className="space-y-2">
                        {(data?.daily || []).map((d, i) => {
                          const isEventDay = d.avgMultiplier > 1.15;
                          return (
                            <div
                              key={i}
                              className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-[11px] transition-all ${
                                isEventDay
                                  ? 'bg-[#f4b740]/6 border-[#f4b740]/30'
                                  : 'bg-(--surface-soft)/30 border-(--brand-border)/50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-extrabold text-(--brand-muted) w-7">{d.day}</span>
                                <span className="font-medium text-(--brand-ink)">{d.status}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-(--brand-blue)">{d.avgMultiplier.toFixed(2)}x</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-(--brand-border)/50 text-(--brand-ink)">{Math.round(d.occupancy)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

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
