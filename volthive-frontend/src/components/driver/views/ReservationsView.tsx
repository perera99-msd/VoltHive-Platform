'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import { motion } from 'framer-motion';
import ConfirmModal from '../../common/ConfirmModal';
import Toast from '../../common/Toast';

interface Booking {
  _id: string;
  station: { _id?: string; stationName?: string; name?: string; address?: string };
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  lockedPricePerKwh?: number;
  totalCostLKR?: number;
  energyConsumedKWh?: number;
}

export default function ReservationsView({ onMessageClick }: { onMessageClick?: (stationId: string) => void }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' | 'info' } | null>(null);

  const fetchReservations = useCallback(async () => {
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
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(fetchReservations, 15000);
    return () => clearInterval(interval);
  }, [fetchReservations]);

  const executeCancelSlot = async (bookingId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(apiUrl(`/api/bookings/${bookingId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      setCancellingId(null);
      if (res.ok) {
        setToastMessage({ msg: 'Charging reservation cancelled successfully.', type: 'success' });
        fetchReservations();
      } else {
        setToastMessage({ msg: 'Failed to cancel reservation.', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to cancel slot:', err);
      setCancellingId(null);
      setToastMessage({ msg: 'Network error cancelling reservation.', type: 'error' });
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (tab === 'upcoming') {
      return ['Pending', 'Confirmed', 'Active_Charging'].includes(b.status);
    }
    return ['Completed', 'Cancelled', 'No_Show', 'Expired'].includes(b.status);
  });

  return (
    <section className="font-sans relative overflow-hidden pb-32 md:pb-12 space-y-7">
      <div className="absolute -top-20 -right-12 w-72 h-72 rounded-full bg-(--accent-blue)/14 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-(--accent-green)/12 blur-[120px] pointer-events-none" />

      {/* Brand Theme Header Card */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-4xl border border-(--brand-card)/70 bg-(--brand-card)/78 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_24px_64px_-44px_rgba(9,32,52,0.58)]"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-(--brand-muted)">EV Slot Management</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-(--brand-ink) mt-1">
          My Charging &
          <span className="text-transparent bg-clip-text bg-linear-to-r from-(--brand-blue) to-(--brand-green)"> Reservations</span>
        </h1>
        <p className="text-(--brand-muted) text-sm mt-1 font-medium">Track upcoming charging windows, get GPS route directions, and manage slots dynamically.</p>
      </motion.header>

      {/* Tab Switcher */}
      <div className="flex p-1.5 rounded-2xl bg-(--brand-card)/85 border border-(--brand-border) w-full max-w-sm backdrop-blur-xl shadow-xs">
        <button
          onClick={() => setTab('upcoming')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${tab === 'upcoming' ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white shadow-md' : 'text-(--brand-muted) hover:text-(--brand-ink)'}`}
        >
          Upcoming ({bookings.filter(b => ['Pending', 'Confirmed', 'Active_Charging'].includes(b.status)).length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${tab === 'past' ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white shadow-md' : 'text-(--brand-muted) hover:text-(--brand-ink)'}`}
        >
          Past History
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-(--brand-border) bg-(--brand-card)/80 backdrop-blur-2xl p-8 animate-pulse h-64" />
      ) : filteredBookings.length === 0 ? (
        <div className="relative rounded-3xl border border-(--brand-card)/80 bg-(--brand-card)/82 backdrop-blur-2xl p-8 sm:p-12 text-center shadow-[0_20px_50px_-25px_rgba(9,32,52,0.4)] overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-(--brand-blue)/15 to-(--brand-green)/15 text-(--brand-blue) border border-(--brand-blue)/20 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-(--brand-ink) tracking-tight">No {tab} reservations found</h3>
          <p className="text-sm text-(--brand-muted) mt-2 max-w-sm mx-auto font-medium leading-relaxed">
            Select any station pin on the live map to book a guaranteed EV charging window.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredBookings.map(b => (
            <motion.article
              key={b._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-(--brand-border) bg-(--brand-card)/86 backdrop-blur-2xl p-5 md:p-7 shadow-[0_18px_38px_-26px_rgba(9,32,52,0.45)] hover:border-(--brand-blue)/30 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b border-(--brand-border)">
                <div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.14em] uppercase border ${b.status === 'Active_Charging' ? 'bg-(--brand-blue)/15 text-(--brand-blue) border-(--brand-blue)/30 animate-pulse' : b.status === 'Confirmed' ? 'bg-(--ui-success)/15 text-(--ui-success) border-(--ui-success)/30' : b.status === 'Completed' ? 'bg-(--surface-soft) text-(--brand-muted) border-(--brand-border)' : b.status === 'Pending' ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' : 'bg-(--ui-error)/15 text-(--ui-error) border-(--ui-error)/30'}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                  <h2 className="text-2xl font-bold text-(--brand-ink) mt-3">{b.station?.stationName || b.station?.name || 'VoltHive EV Station'}</h2>
                  <p className="text-sm text-(--brand-muted) mt-1">{b.station?.address || 'GPS Station Address'}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-3xl font-extrabold tracking-tight text-(--brand-ink)">{b.startTime}</p>
                  <p className="text-xs uppercase tracking-[0.14em] font-bold text-(--brand-muted) mt-1">{b.date}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-(--brand-border) bg-(--background)/80 p-3.5">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-(--brand-muted)">Locked Rate</p>
                  <p className="text-sm font-bold text-(--brand-ink) mt-1">{b.lockedPricePerKwh ? `LKR ${b.lockedPricePerKwh}` : '—'} / kWh</p>
                </div>
                <div className="rounded-2xl border border-(--brand-border) bg-(--background)/80 p-3.5">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-(--brand-muted)">Time Window</p>
                  <p className="text-sm font-bold text-(--brand-ink) mt-1">{b.startTime} - {b.endTime}</p>
                </div>
                <div className="rounded-2xl border border-(--brand-border) bg-(--background)/80 p-3.5">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-(--brand-muted)">{b.status === 'Completed' ? 'Total Bill' : 'Status Info'}</p>
                  <p className="text-sm font-bold text-(--brand-ink) mt-1">{b.status === 'Completed' ? `LKR ${Math.round(b.totalCostLKR || 0)}` : 'Guaranteed Slot'}</p>
                </div>
              </div>

              {['Pending', 'Confirmed'].includes(b.status) && (
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(b.station?.address || b.station?.stationName || 'Colombo')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-center text-sm font-bold shadow-md hover:brightness-105 transition-all"
                  >
                    Get GPS Directions
                  </a>
                  {b.station?._id && (
                    <button
                      onClick={() => {
                        setToastMessage({ msg: 'Opening station chat thread...', type: 'info' });
                        onMessageClick && onMessageClick(b.station!._id!);
                      }}
                      className="flex-1 py-3 rounded-xl border border-(--brand-blue)/30 bg-(--brand-blue)/10 text-(--brand-blue) text-sm font-bold hover:bg-(--brand-blue)/20 transition-colors cursor-pointer"
                    >
                      Message Station
                    </button>
                  )}
                  <button
                    onClick={() => setCancellingId(b._id)}
                    className="flex-1 py-3 rounded-xl border border-(--ui-error)/30 bg-(--ui-error)/10 text-(--ui-error) text-sm font-bold hover:bg-(--ui-error)/20 transition-colors cursor-pointer"
                  >
                    Cancel Reservation
                  </button>
                </div>
              )}
            </motion.article>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(cancellingId)}
        title="Cancel Reservation?"
        message="Are you sure you want to cancel this charging slot reservation? Your guaranteed time window will be released immediately to other EV drivers."
        confirmText="Yes, Cancel Slot"
        isDanger={true}
        onClose={() => setCancellingId(null)}
        onConfirm={() => cancellingId && executeCancelSlot(cancellingId)}
      />

      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </section>
  );
}