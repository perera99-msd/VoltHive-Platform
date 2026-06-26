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

  return (
    <div className="w-full mb-8 relative z-30 font-sans">
      {/* COLLAPSED TOP COCKPIT CARD */}
      <motion.div
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.003 }}
        whileTap={{ scale: 0.997 }}
        className="cursor-pointer bg-(--brand-card) border border-(--brand-border) rounded-3xl p-5 shadow-sm hover:shadow-md transition-all text-(--brand-ink) flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-80 h-full bg-linear-to-l from-(--surface-soft) to-transparent pointer-events-none -z-0" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue) shrink-0 shadow-xs">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-(--brand-blue) text-white shadow-xs">📍 {stationNameDisplay}</span>
              <span className="text-xs text-(--brand-muted) font-semibold">• {data?.weather.source || 'Open-Meteo Live API'}</span>
              {data?.activeEvent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">🏏 Rush: {data.activeEvent.title}</span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-(--brand-ink) mt-1 tracking-tight">
              {loading ? 'Evaluating Station Location & Calendar...' : `AI Dynamic Surge: ${nextPeak?.recommendation || 'Normal Demand'} (${nextPeak?.multiplier || 1.0}x)`}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end relative z-10">
          <div className="px-4 py-2 rounded-xl bg-(--surface-soft) border border-(--brand-border) text-xs font-bold text-(--brand-ink) flex items-center gap-2">
            <span>☀️ {data?.weather.condition || 'Clear'} ({data?.weather.temp || 30}°C)</span>
          </div>
          <button className="px-5 py-2.5 bg-(--brand-blue) hover:bg-(--brand-blue-deep) text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer">
            <span>Cockpit & Calendar</span>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
        </div>
      </motion.div>

      {/* EXPANDED FULL STATION COCKPIT & CALENDAR MODAL */}
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
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-(--brand-ink)">Neural Grid Station Command Cockpit</h2>
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">⚡ 1 Production Engine Active</span>
                    </div>
                    <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Evaluating 6 causal input variables per station location coordinates and calendar.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-wrap">
                  {stations.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-(--brand-muted)">Station:</span>
                      <select
                        value={selectedStationId}
                        onChange={e => setSelectedStationId(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white border border-(--brand-border) text-xs font-bold text-(--brand-ink) shadow-xs cursor-pointer focus:outline-none focus:border-(--brand-blue)"
                      >
                        {stations.map(st => (
                          <option key={st._id} value={st._id}>{st.stationName}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleForceRefresh}
                    disabled={refreshing}
                    className="px-4 py-2 bg-white hover:bg-(--surface-tint) text-(--brand-blue) text-xs font-bold rounded-xl border border-(--brand-border) shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                    <span>Run Prediction</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 hover:bg-(--brand-border)/40 rounded-xl transition-colors cursor-pointer text-(--brand-muted)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-8 max-h-[calc(90vh-100px)]">
                
                {/* SECTION 1: PER-STATION SPECIAL EVENTS CALENDAR MANAGER */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LEFT 2 COLS: EVENTS LIST & PREDICTION IMPACT */}
                  <div className="lg:col-span-2 p-6 rounded-3xl bg-(--surface-tint)/40 border border-(--brand-border) space-y-4">
                    <div className="flex items-center justify-between border-b border-(--brand-border)/80 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🗓️</span>
                        <div>
                          <h4 className="font-bold text-base text-(--brand-ink)">Manual Special Events Calendar ({stationNameDisplay})</h4>
                          <p className="text-xs text-(--brand-muted)">Scheduled upcoming matches or concerts trigger dynamic crowd surge pricing up to 1 week ahead.</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-(--brand-blue)/10 text-(--brand-blue) font-bold text-xs shrink-0">
                        {data?.specialEvents?.length || 0} Events Logged
                      </span>
                    </div>

                    <div className="space-y-3 pt-2">
                      {!data?.specialEvents || data.specialEvents.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-(--brand-border) text-xs text-(--brand-muted) font-semibold">
                          No upcoming special events scheduled for this station. Add a cricket match or festival date below!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {data.specialEvents.map((ev, idx) => {
                            const evDate = new Date(ev.date);
                            const now = new Date();
                            const diffDays = Math.ceil((evDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                            const isWithinWeek = diffDays >= 0 && diffDays <= 7;

                            return (
                              <div key={ev._id || idx} className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${isWithinWeek ? 'bg-amber-500/10 border-amber-500/30 text-(--brand-ink)' : 'bg-white border-(--brand-border) opacity-70'}`}>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white text-(--brand-ink) shadow-2xs border border-(--brand-border)">{ev.date}</span>
                                    {isWithinWeek && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-2xs">ACTIVE SURGE RUSH</span>}
                                  </div>
                                  <h5 className="font-bold text-sm text-(--brand-ink) pt-1">🏏 {ev.title}</h5>
                                  <p className="text-[11px] text-(--brand-muted) font-medium">{ev.category}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => ev._id && handleDeleteEvent(ev._id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-xs font-bold shrink-0"
                                  title="Remove event"
                                >
                                  🗑️
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT 1 COL: ADD NEW EVENT FORM */}
                  <div className="p-6 rounded-3xl bg-(--surface-soft) border border-(--brand-border) flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">➕</span>
                        <h4 className="font-bold text-sm text-(--brand-ink)">Schedule Station Event</h4>
                      </div>

                      <form onSubmit={handleAddEvent} className="space-y-4">
                        <div>
                          <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider block mb-1">Event Title</label>
                          <input
                            type="text"
                            required
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            placeholder="e.g. Asia Cup Final ODI"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-(--brand-border) text-xs font-semibold text-(--brand-ink) focus:outline-none focus:border-(--brand-blue)"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-wider block mb-1">Event Date (YYYY-MM-DD)</label>
                          <input
                            type="date"
                            required
                            value={newDate}
                            onChange={e => setNewDate(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-(--brand-border) text-xs font-semibold text-(--brand-ink) focus:outline-none focus:border-(--brand-blue)"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={addingEvent}
                            className="w-full py-3 rounded-xl bg-(--brand-blue) hover:bg-(--brand-blue-deep) text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>{addingEvent ? 'Scheduling...' : 'Add Event to Station'}</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="mt-6 p-3 rounded-xl bg-white/60 border border-(--brand-border)/60 text-[11px] text-(--brand-muted) space-y-1">
                      <p>📍 <b>Weather Source:</b> {data?.weather.source || 'Open-Meteo API'}</p>
                      <p>⚡ <b>Current Ambient:</b> {data?.weather.condition || 'Clear'}, {data?.weather.temp || 30}°C</p>
                    </div>
                  </div>

                </div>

                {/* SECTION 2: CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-(--brand-border)">
                  
                  {/* Left 2 Cols: 6 Hour Hourly Forecast */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-(--brand-ink)">6-Hour Capacity & Dynamic Tariff Curve</h3>
                        <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Driven by 6 causal variables: Time, Day, Weekend, Grid Peak, Weather, and Station Events.</p>
                      </div>
                    </div>

                    <div className="h-64 w-full pt-4">
                      {loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-(--surface-tint)/20 rounded-2xl border border-(--brand-border) animate-pulse text-xs font-bold text-(--brand-muted)">
                          Recalculating Neural Grid Forecast...
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data?.hourly || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                              formatter={(val: any, name: any) => [val + '%', 'Predicted Occupancy']}
                            />
                            <Area type="monotone" dataKey="occupancy" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#occGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Right 1 Col: 7 Day Macro Outlook */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-(--brand-ink)">7-Day Station Event Outlook</h3>
                      <p className="text-xs text-(--brand-muted) font-medium mt-0.5">Daily occupancy expectations highlighting scheduled event days.</p>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {(data?.daily || []).map((d, i) => {
                        const isEventDay = d.avgMultiplier > 1.15;
                        return (
                          <div key={i} className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${isEventDay ? 'bg-amber-500/10 border-amber-500/40 shadow-xs font-bold' : 'bg-(--surface-soft) border-(--brand-border)'}`}>
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold w-8 text-(--brand-muted)">{d.day}</span>
                              <span className="text-(--brand-ink)">{d.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-(--brand-blue)">{d.avgMultiplier.toFixed(2)}x</span>
                              <span className="text-[11px] px-2 py-0.5 rounded bg-white text-(--brand-ink) font-bold border border-(--brand-border)/60">{Math.round(d.occupancy)}%</span>
                            </div>
                          </div>
                        );
                      })}
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
