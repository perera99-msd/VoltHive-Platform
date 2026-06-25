'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../lib/api';
import ConfirmModal from '../../common/ConfirmModal';
import Toast from '../../common/Toast';

interface Booking {
  _id: string;
  station: { stationName?: string; name?: string; address?: string };
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  lockedPricePerKwh?: number;
  totalCostLKR?: number;
  energyConsumedKWh?: number;
}

export default function ReservationsView() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' } | null>(null);

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
        setToastMessage({ msg: 'Charging reservation cancelled.', type: 'success' });
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
    return ['Completed', 'Cancelled', 'No_Show'].includes(b.status);
  });

  return (
    <section className="space-y-7 vh-rise-in">
      <header className="rounded-[2rem] border border-(--brand-border) bg-(--brand-card)/82 backdrop-blur-2xl p-6 md:p-7">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-(--brand-ink)">Reservations</h1>
        <p className="text-(--brand-muted) text-sm mt-1">Track upcoming charging windows, route directions, and manage slots dynamically.</p>
      </header>

      <div className="flex p-1 rounded-xl bg-(--accent-blue)/12 border border-(--brand-border) w-full max-w-sm">
        <button
          onClick={() => setTab('upcoming')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'upcoming' ? 'bg-(--brand-card) text-(--brand-ink) shadow-xs' : 'text-(--brand-muted) hover:text-(--brand-ink)'}`}
        >
          Upcoming ({bookings.filter(b => ['Pending', 'Confirmed', 'Active_Charging'].includes(b.status)).length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'past' ? 'bg-(--brand-card) text-(--brand-ink) shadow-xs' : 'text-(--brand-muted) hover:text-(--brand-ink)'}`}
        >
          Past History
        </button>
      </div>

      {loading ? (
        <div className="rounded-[1.75rem] border border-(--brand-border) bg-(--surface-soft) p-8 animate-pulse h-64" />
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-[1.75rem] border border-(--brand-border) bg-(--brand-card)/80 p-12 text-center text-(--brand-muted)">
          <p className="text-lg font-bold text-(--brand-ink)">No {tab} reservations found</p>
          <p className="text-sm mt-1">Select any station pin on the live map to book a guaranteed charging window.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredBookings.map(b => (
            <article key={b._id} className="rounded-[1.75rem] border border-(--brand-border) bg-(--brand-card)/86 backdrop-blur-2xl p-5 md:p-6 shadow-[0_18px_38px_-26px_rgba(9,32,52,0.45)]">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b border-(--brand-border)">
                <div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.14em] uppercase border ${b.status === 'Active_Charging' ? 'bg-(--brand-blue)/15 text-(--brand-blue) border-(--brand-blue)/30 animate-pulse' : b.status === 'Confirmed' ? 'bg-(--ui-success)/15 text-(--ui-success) border-(--ui-success)/30' : b.status === 'Completed' ? 'bg-(--surface-soft) text-(--brand-muted) border-(--brand-border)' : 'bg-(--ui-error)/15 text-(--ui-error) border-(--ui-error)/30'}`}>
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
                <div className="rounded-xl border border-(--brand-border) bg-(--background) p-3">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-(--brand-muted)">Locked Rate</p>
                  <p className="text-sm font-bold text-(--brand-ink) mt-1">LKR {b.lockedPricePerKwh || 82} / kWh</p>
                </div>
                <div className="rounded-xl border border-(--brand-border) bg-(--background) p-3">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-(--brand-muted)">Time Window</p>
                  <p className="text-sm font-bold text-(--brand-ink) mt-1">{b.startTime} - {b.endTime}</p>
                </div>
                <div className="rounded-xl border border-(--brand-border) bg-(--background) p-3">
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
                    className="flex-1 py-3 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-center text-sm font-bold shadow-sm hover:brightness-105 transition-all"
                  >
                    Get GPS Directions
                  </a>
                  <button
                    onClick={() => setCancellingId(b._id)}
                    className="flex-1 py-3 rounded-xl border border-(--ui-error)/30 bg-(--ui-error)/10 text-(--ui-error) text-sm font-bold hover:bg-(--ui-error)/20 transition-colors cursor-pointer"
                  >
                    Cancel Reservation
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(cancellingId)}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this charging slot reservation? Your guaranteed time window will be released to other EV drivers."
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