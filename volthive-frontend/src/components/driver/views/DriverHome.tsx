// volthive-frontend/src/components/driver/views/DriverHome.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';

interface Booking {
  _id: string;
  station: { stationName?: string; name?: string; address?: string };
  status: string;
  date: string;
  startTime: string;
  energyConsumedKWh?: number;
  totalCostLKR?: number;
  lockedPricePerKwh?: number;
}

export default function DriverHome({ onBookNow }: { onBookNow?: () => void }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch(apiUrl('/api/bookings/driver'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const payload = await res.json();
          setBookings(payload.data || []);
        }
      } catch (err) {
        console.error('Failed to load driver stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  const upcomingBookings = bookings.filter(b => ['Pending', 'Confirmed', 'Active_Charging'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'Completed');
  
  // No system billing — surface the average AGREED rate (locked at booking).
  const agreedRates = bookings.map(b => Number(b.lockedPricePerKwh)).filter(r => r > 0);
  const avgAgreedRate = agreedRates.length > 0 ? Math.round(agreedRates.reduce((a, b) => a + b, 0) / agreedRates.length) : null;

  const totalSessions = bookings.filter(b => ['Completed', 'Cancelled', 'No_Show'].includes(b.status));
  const completionRate = totalSessions.length > 0 ? Math.round((completedBookings.length / totalSessions.length) * 100) : null;

  // Real AI demand signal (occupancy + recommendation from the live AI service)
  const [aiSuggestion, setAiSuggestion] = useState<{ predicted_occupancy?: string; suggested_multiplier?: number; ai_recommendation?: string } | null>(null);
  useEffect(() => {
    const fetchAi = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(apiUrl('/api/ai/pricing-suggestion'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setAiSuggestion(await res.json());
      } catch (err) {
        console.warn('AI suggestion unavailable:', err);
      }
    };
    fetchAi();
  }, [user]);

  return (
    <section className="space-y-6 relative overflow-hidden">
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-(--accent-blue)/18 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-(--accent-green)/14 blur-[120px] pointer-events-none" />

      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-4xl border border-(--brand-card)/70 bg-(--brand-card)/78 backdrop-blur-2xl p-6 md:p-8 shadow-[0_26px_70px_-42px_rgba(9,32,52,0.58)]"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-(--brand-muted)">Driver Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-(--brand-ink) mt-2">
              Welcome back,
              <span className="text-transparent bg-clip-text bg-linear-to-r from-(--brand-blue) to-(--brand-green)"> {user?.displayName?.split(' ')[0] || 'Driver'}.</span>
            </h1>
            <p className="text-(--brand-muted) mt-2 max-w-2xl font-medium">Your live charging workflow is ready. Continue from map mode, review reservations, and manage trips from one clean surface.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBookNow}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition-all"
            >
              Open Live Map
            </button>
          </div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <article className="rounded-3xl border border-(--brand-card)/70 bg-(--brand-card)/80 backdrop-blur-xl p-5 shadow-[0_16px_34px_-26px_rgba(9,32,52,0.42)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--brand-muted)">Active & Upcoming</p>
          <p className="text-3xl font-bold tracking-tight text-(--brand-ink) mt-2">{loading ? '...' : upcomingBookings.length < 10 ? `0${upcomingBookings.length}` : upcomingBookings.length}</p>
          <p className="text-xs text-(--brand-muted) mt-1 truncate">
            {upcomingBookings[0] ? `Next at ${upcomingBookings[0].startTime} · ${upcomingBookings[0].station?.stationName || upcomingBookings[0].station?.name || 'VoltHive Station'}` : 'No upcoming charging sessions'}
          </p>
        </article>
        <article className="rounded-3xl border border-(--brand-card)/70 bg-(--brand-card)/80 backdrop-blur-xl p-5 shadow-[0_16px_34px_-26px_rgba(9,32,52,0.42)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--brand-muted)">Average Agreed Rate</p>
          <p className="text-3xl font-bold tracking-tight text-(--brand-ink) mt-2">{avgAgreedRate != null ? `LKR ${avgAgreedRate}` : '—'}</p>
          <p className="text-xs text-(--brand-muted) mt-1">Per kWh across completed sessions</p>
        </article>
        <article className="rounded-3xl border border-(--brand-card)/70 bg-(--brand-card)/80 backdrop-blur-xl p-5 shadow-[0_16px_34px_-26px_rgba(9,32,52,0.42)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--brand-muted)">Reliability Rate</p>
          <p className="text-3xl font-bold tracking-tight text-(--brand-ink) mt-2">{completionRate != null ? `${completionRate}%` : '—'}</p>
          <p className="text-xs text-(--brand-muted) mt-1">Successful completion history</p>
        </article>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <motion.article
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.82, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="xl:col-span-2 rounded-4xl border border-(--brand-card)/65 bg-(--brand-card)/78 backdrop-blur-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-(--brand-ink)">Recent Activity Feed</h2>
            <span className="px-3 py-1 rounded-full bg-(--accent-blue)/14 text-(--brand-blue) text-xs font-bold">{bookings.length} total</span>
          </div>

          <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
            {loading ? (
              <div className="p-4 rounded-2xl bg-(--surface-soft) animate-pulse h-16 w-full" />
            ) : bookings.length === 0 ? (
              <div className="text-center py-10 text-(--brand-muted) text-sm font-semibold">
                No charging activity recorded yet. Book your first session from the live map!
              </div>
            ) : (
              bookings.slice(0, 5).map(b => (
                <div key={b._id} className="rounded-2xl border border-(--brand-border) bg-(--background)/80 p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${b.status === 'Completed' ? 'bg-(--ui-success)' : b.status === 'Active_Charging' ? 'bg-(--brand-blue) animate-ping' : 'bg-(--ui-warning)'}`} />
                      <p className="font-bold text-sm text-(--brand-ink)">{b.station?.stationName || b.station?.name || 'EV Station'} · <span className="text-xs font-semibold uppercase text-(--brand-muted)">{b.status.replace('_', ' ')}</span></p>
                    </div>
                    <p className="text-xs text-(--brand-muted) mt-1">{b.date} at {b.startTime} {b.lockedPricePerKwh ? `· LKR ${b.lockedPricePerKwh}/kWh agreed` : ''}</p>
                  </div>
                  {b.lockedPricePerKwh ? (
                    <div className="text-right font-bold text-sm text-(--brand-ink)">
                      LKR {b.lockedPricePerKwh}<span className="text-[10px] text-(--brand-muted)">/kWh</span>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.82, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-4xl border border-(--brand-card)/65 bg-linear-to-br from-(--brand-blue) to-(--brand-green) text-white p-6 relative overflow-hidden shadow-xl"
        >
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <h3 className="text-xl font-bold mb-2">AI Demand Signal</h3>
          <p className="text-sm font-medium text-white/90 leading-relaxed mb-6">
            {aiSuggestion
              ? `AI predicts ${aiSuggestion.predicted_occupancy || '—'} occupancy right now — ${aiSuggestion.ai_recommendation || 'normal demand'}.`
              : 'Live AI demand signal will appear here when the AI engine responds.'}
          </p>
          <button onClick={onBookNow} className="w-full py-3 bg-(--brand-card) text-(--brand-ink) font-bold rounded-xl text-sm shadow-md hover:bg-(--surface-tint) transition-all cursor-pointer">
            Open Live Map
          </button>
        </motion.article>
      </div>
    </section>
  );
}