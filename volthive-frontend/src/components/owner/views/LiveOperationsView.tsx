'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../../../lib/api';
import { auth } from '../../../lib/firebase';
import AdminBookingModal from '../AdminBookingModal';
import EditBookingModal from '../EditBookingModal';
import ViewBookingModal from '../ViewBookingModal';
import ConfirmModal from '../../common/ConfirmModal';
import Toast from '../../common/Toast';

interface Booking {
  _id: string;
  customerName?: string;
  customerPhone?: string;
  driver?: { name?: string; email?: string; telephone?: string; phone?: string };
  station?: { _id?: string; stationName?: string; address?: string };
  chargerId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  lockedPricePerKwh: number;
  totalCostLKR?: number;
  paymentStatus?: string;
  energyConsumedKWh?: number;
  createdAt?: string;
}

export default function LiveOperationsView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Active_Charging' | 'Completed' | 'History'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAdminBooking, setShowAdminBooking] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  
  // Confirmation state for POS actions
  const [confirmAction, setConfirmAction] = useState<{ bookingId: string; newStatus?: string; paymentStatus?: string; label: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' } | null>(null);

  const executeDeleteBooking = async (bookingId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(apiUrl(`/api/bookings/${bookingId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletingBookingId(null);
      if (res.ok) {
        setToastMessage({ msg: 'Reservation record permanently deleted.', type: 'success' });
        fetchBookings();
      } else {
        setToastMessage({ msg: 'Failed to delete reservation.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setDeletingBookingId(null);
      setToastMessage({ msg: 'Network failure communicating with server.', type: 'error' });
    }
  };

  const fetchBookings = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(apiUrl('/api/bookings/owner?all=true'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await res.json();
      if (payload.success) {
        setBookings(payload.data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  const executeStatusUpdate = async () => {
    if (!confirmAction) return;
    const { bookingId, newStatus } = confirmAction;
    setConfirmAction(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(apiUrl(`/api/bookings/${bookingId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setToastMessage({ msg: `Booking status updated to ${newStatus?.replace('_', ' ')}`, type: 'success' });
        fetchBookings();
      } else {
        setToastMessage({ msg: 'Failed to update status', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating status', error);
      setToastMessage({ msg: 'Network failure', type: 'error' });
    }
  };

  const executePaymentUpdate = async () => {
    if (!confirmAction) return;
    const { bookingId, paymentStatus } = confirmAction;
    setConfirmAction(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(apiUrl(`/api/bookings/${bookingId}/payment`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus })
      });

      if (res.ok) {
        setToastMessage({ msg: 'Payment marked as Settled / Paid!', type: 'success' });
        fetchBookings();
      } else {
        setToastMessage({ msg: 'Failed to update payment status', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating payment status', error);
      setToastMessage({ msg: 'Network failure', type: 'error' });
    }
  };

  // NOTE: Booking time extension has been removed per product decision.
  // If a driver needs more time, create a NEW booking for the next hour.

  const filteredBookings = bookings.filter(b => {
    const cName = b.customerName || b.driver?.name || '';
    const cPhone = b.customerPhone || b.driver?.telephone || b.driver?.phone || '';
    const sName = b.station?.stationName || '';

    const matchesSearch = cName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cPhone.includes(searchQuery) ||
      sName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'All') {
      return b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'Active_Charging';
    }
    if (activeFilter === 'History') {
      return b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'No_Show' || b.status === 'Expired';
    }
    return b.status === activeFilter;
  });

  // Metrics Calculations (real data)
  const activeCount = bookings.filter(b => b.status === 'Active_Charging').length;
  const pendingCount = bookings.filter(b => b.status === 'Pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const activeQueueCount = activeCount + pendingCount + confirmedCount;
  // Revenue = only completed (settled) checkout totals — not per-kWh prices
  const todayRevenue = bookings
    .filter(b => b.status === 'Completed')
    .reduce((acc, b) => acc + (b.totalCostLKR || 0), 0);

  // Ticking clock to show "Approve within mm:ss" on Pending cards
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const pendingRemaining = (createdAt?: string) => {
    if (!createdAt) return { rem: 0, label: '--:--' };
    const deadline = new Date(createdAt).getTime() + 15 * 60 * 1000;
    const rem = Math.max(0, deadline - now);
    const m = Math.floor(rem / 60000);
    const s = Math.floor((rem % 60000) / 1000);
    return { rem, label: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--brand-blue)"></div>
      </div>
    );
  }

  return (
    <div className="w-full relative font-sans pb-16">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[24px] font-extrabold tracking-tight text-(--brand-ink)">Live POS Console</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--brand-green)/10 text-(--brand-green-deep) text-[10px] font-extrabold uppercase tracking-wider border border-(--brand-green)/20">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-[12px] text-(--brand-muted) font-medium">Manage incoming reservations, active charging sessions, customer hotlines, and POS checkouts.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button onClick={() => setShowAdminBooking(true)} className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-(--brand-blue) to-(--brand-green) text-white rounded-xl text-[12px] font-bold shadow-sm hover:brightness-105 transition-all cursor-pointer flex justify-center items-center gap-2">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            + New Manual Booking
          </button>
          <button onClick={fetchBookings} className="w-full sm:w-auto px-4 py-2.5 bg-white border border-(--brand-border)/80 rounded-xl text-[12px] font-bold text-(--brand-ink) shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-blue)"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            Refresh List
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY BAR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-(--brand-green)/10 border border-(--brand-green)/20 flex items-center justify-center text-(--brand-green-deep)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Active Charging</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">{activeCount} Plugged In</h3>
          </div>
        </div>

        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--ui-warning)]/10 border border-[var(--ui-warning)]/20 flex items-center justify-center text-[#d09d2e]">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">{pendingCount} Awaiting</h3>
          </div>
        </div>

        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Active Queue</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">{activeQueueCount} Active</h3>
          </div>
        </div>

        <div className="bg-white border border-(--brand-border)/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue-deep)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-(--brand-muted) uppercase tracking-wider">Estimated Revenue</p>
            <h3 className="text-[18px] font-black text-(--brand-ink)">LKR {todayRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER TABS ── */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) absolute left-4 top-1/2 -translate-y-1/2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input
            type="text"
            placeholder="Search by Customer Name, Phone Number, or Station Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-(--brand-border)/80 rounded-xl text-[13px] text-(--brand-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) shadow-xs transition-all placeholder:text-(--brand-muted)/50"
          />
        </div>

        <div className="inline-flex p-1 bg-white border border-(--brand-border)/80 rounded-xl shadow-xs overflow-x-auto scrollbar-hide">
          {(['All', 'Pending', 'Confirmed', 'Active_Charging', 'Completed', 'History'] as const).map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === filter 
                  ? 'bg-(--surface-soft) text-(--brand-ink) border border-(--brand-border)/60 font-black' 
                  : 'text-(--brand-muted) hover:text-(--brand-ink)'
              }`}
            >
              {filter === 'All' ? 'Active Queue' : filter === 'History' ? 'History / Closed' : filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── QUEUE GRID ── */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence>
          {filteredBookings.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-16 bg-(--surface-soft)/30 border-2 border-dashed border-(--brand-border)/80 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-(--brand-border)/80 flex items-center justify-center mx-auto mb-4 text-(--brand-muted)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-[14px] font-extrabold text-(--brand-ink)">No Records Found</h3>
              <p className="text-[12px] text-(--brand-muted) mt-1 font-medium">
                {searchQuery ? `No reservations match "${searchQuery}".` : 'No reservations match the selected filter category.'}
              </p>
            </motion.div>
          ) : (
            filteredBookings.map((booking) => {
              const cName = booking.customerName && booking.customerName.trim() !== '' 
                ? booking.customerName 
                : (booking.driver?.name || 'Walk-in Customer');

              const cPhone = booking.customerPhone && booking.customerPhone.trim() !== '' 
                ? booking.customerPhone 
                : (booking.driver?.telephone || (booking.driver as any)?.phone || 'No Phone');

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  key={booking._id} 
                  className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Status Top Gradient Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] opacity-80 ${
                    booking.status === 'Pending' ? 'bg-gradient-to-r from-[var(--ui-warning)] to-[var(--ui-warning)]/80' : 
                    booking.status === 'Confirmed' ? 'bg-gradient-to-r from-(--brand-blue) to-(--brand-green)' : 
                    booking.status === 'Active_Charging' ? 'bg-gradient-to-r from-(--brand-green) to-(--brand-green-deep)' :
                    booking.status === 'Completed' ? 'bg-gradient-to-r from-(--brand-green) to-[var(--accent-green)]' :
                    'bg-gradient-to-r from-(--ui-error) to-red-600'
                  }`} />

                  {/* Header Row: Customer Name & Action Toolbar */}
                  <div className="flex justify-between items-start mb-3 mt-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-[13px] shrink-0 shadow-xs ${
                        booking.status === 'Pending' ? 'bg-[var(--ui-warning)]' : 
                        booking.status === 'Confirmed' ? 'bg-(--brand-blue)' : 
                        booking.status === 'Active_Charging' ? 'bg-(--brand-green)' :
                        booking.status === 'Completed' ? 'bg-(--brand-green)' :
                        'bg-(--ui-error)'
                      }`}>
                        {cName[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-(--brand-ink) text-[15px] tracking-tight truncate max-w-[130px] sm:max-w-[150px]">{cName}</h3>
                        <p className="text-[11px] font-bold text-(--brand-muted) truncate max-w-[140px]">{booking.station?.stationName || 'VoltHive Premise'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-(--surface-soft)/60 p-1 rounded-xl border border-(--brand-border)/40">
                        <button
                          onClick={() => setViewingBooking(booking)}
                          title="View POS Receipt Details"
                          className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-white hover:text-(--brand-blue) hover:shadow-xs transition-all cursor-pointer"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>

                        <button
                          onClick={() => setEditingBooking(booking)}
                          title="Edit Reservation Specs"
                          className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-white hover:text-(--brand-blue) hover:shadow-xs transition-all cursor-pointer"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        </button>

                        <button
                          onClick={() => setDeletingBookingId(booking._id)}
                          title="Delete Reservation Record"
                          className="p-1.5 rounded-lg text-(--brand-muted) hover:bg-(--ui-error)/10 hover:text-(--ui-error) transition-all cursor-pointer"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>

                      <div className={`px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-md border flex items-center gap-1.5 shrink-0 ${
                        booking.status === 'Pending' ? 'bg-[var(--ui-warning)]/10 text-[#d09d2e] border-[var(--ui-warning)]/20' : 
                        booking.status === 'Confirmed' ? 'bg-(--brand-blue)/10 text-(--brand-blue-deep) border-(--brand-blue)/20' : 
                        booking.status === 'Active_Charging' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                        booking.status === 'Completed' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                        'bg-(--ui-error)/10 text-(--ui-error) border-(--ui-error)/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          booking.status === 'Pending' ? 'bg-[var(--ui-warning)]' : 
                          booking.status === 'Confirmed' ? 'bg-(--brand-blue)' : 
                          booking.status === 'Active_Charging' ? 'bg-(--brand-green) animate-pulse' :
                          booking.status === 'Completed' ? 'bg-(--brand-green)' :
                          'bg-(--ui-error)'
                        }`} />
                        {booking.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Customer Contact Hotline Bar */}
                  <div className="mb-4 px-3 py-1.5 bg-(--surface-soft)/60 rounded-xl text-[11px] font-medium flex items-center justify-between gap-2 border border-(--brand-border)/40">
                    <span className="font-extrabold text-(--brand-ink) flex items-center gap-1">
                      📞 <a href={`tel:${cPhone}`} className="hover:underline hover:text-(--brand-blue)">{cPhone}</a>
                    </span>
                    <span className="text-[10px] text-(--brand-muted) truncate max-w-[130px]">
                      ✉️ {booking.driver?.email || 'N/A'}
                    </span>
                  </div>

                  {/* Time & Price Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
                    <div className="bg-(--surface-soft)/40 p-3 rounded-xl border border-(--brand-border)/50 flex flex-col justify-center">
                      <p className="text-[9px] text-(--brand-muted) font-extrabold uppercase tracking-wider mb-0.5">Time Slot</p>
                      <p className="font-black text-(--brand-ink) text-[13px]">{booking.startTime} - {booking.endTime}</p>
                      <p className="text-[9px] text-(--brand-muted) font-medium mt-0.5">{booking.date}</p>
                    </div>
                    <div className="bg-(--surface-soft)/40 p-3 rounded-xl border border-(--brand-border)/50 flex flex-col justify-center">
                      <p className="text-[9px] text-(--brand-muted) font-extrabold uppercase tracking-wider mb-0.5">
                        {booking.totalCostLKR ? 'Total Bill / Fee' : 'Locked Rate'}
                      </p>
                      <p className="font-black text-(--brand-ink) text-[13px]">
                        LKR {booking.totalCostLKR !== undefined ? booking.totalCostLKR : booking.lockedPricePerKwh}
                      </p>
                      <p className="text-[9px] text-(--brand-muted) font-medium mt-0.5">
                        {booking.totalCostLKR !== undefined ? (booking.paymentStatus ? `Pay Status: ${booking.paymentStatus}` : 'Calculated') : 'Per kWh'}
                      </p>
                    </div>
                  </div>

                  {/* ACTION BUTTONS (POS Execution Flow) */}
                  <div className="mt-auto">
                    {booking.status === 'Pending' && (() => {
                      const { rem, label } = pendingRemaining(booking.createdAt);
                      const windowPassed = rem === 0;
                      return (
                        <div className="space-y-2">
                          <div className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border text-center ${
                            windowPassed
                              ? 'bg-[var(--ui-error)]/10 text-(--ui-error) border-[var(--ui-error)]/30'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {windowPassed ? '⏰ Approval window passed — will be marked Expired' : `⏳ Approve within ${label}`}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setConfirmAction({ bookingId: booking._id, newStatus: 'Confirmed', label: 'Accept Reservation' })}
                              className="py-2.5 bg-(--brand-ink) hover:bg-black text-white text-[11px] font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => setConfirmAction({ bookingId: booking._id, newStatus: 'Cancelled', label: 'Reject Reservation' })}
                              className="py-2.5 bg-[var(--ui-error)]/10 hover:bg-[var(--ui-error)]/20 text-(--ui-error) border border-(--ui-error)/30 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {booking.status === 'Confirmed' && (
                      <div className="space-y-2">
                        <button 
                          onClick={() => setConfirmAction({ bookingId: booking._id, newStatus: 'Active_Charging', label: 'Start Physical Charging Session' })}
                          className="w-full py-3 bg-(--brand-blue) hover:bg-(--brand-blue-deep) text-white text-[12px] font-bold rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 cursor-pointer"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                          Start Charging Session
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setConfirmAction({ bookingId: booking._id, newStatus: 'No_Show', label: 'Mark Driver No-Show (50% Penalty)' })} 
                            className="py-2 bg-[var(--ui-warning)]/10 hover:bg-[var(--ui-warning)]/20 text-[#a37620] border border-[var(--ui-warning)]/30 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer"
                          >
                            Mark No-Show (50%)
                          </button>
                          <button 
                            onClick={() => setConfirmAction({ bookingId: booking._id, newStatus: 'Cancelled', label: 'Cancel Booking' })} 
                            className="py-2 bg-(--ui-error)/10 hover:bg-(--ui-error)/20 text-(--ui-error) border border-(--ui-error)/30 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel Booking
                          </button>
                        </div>
                      </div>
                    )}

                    {booking.status === 'Active_Charging' && (
                      <button 
                        onClick={() => setConfirmAction({ bookingId: booking._id, newStatus: 'Completed', label: 'Stop Charge & Checkout Driver' })}
                        className="w-full py-3 bg-white border border-(--ui-error) text-(--ui-error) hover:bg-(--ui-error) hover:text-white text-[12px] font-bold rounded-xl transition-all shadow-sm cursor-pointer flex justify-center items-center gap-2 group"
                      >
                        <span className="w-2 h-2 rounded-full bg-(--ui-error) group-hover:bg-white animate-pulse" />
                        Stop Charge & Check Out
                      </button>
                    )}

                    {booking.status === 'Expired' && (
                      <div className="w-full py-2.5 bg-(--ui-error)/5 border border-(--ui-error)/20 text-(--ui-error) text-center text-[10px] font-bold rounded-xl">
                        Booking expired — no response within 15 min. Use the delete icon to remove the record.
                      </div>
                    )}

                    {(booking.status === 'Completed' || booking.status === 'Cancelled' || booking.status === 'No_Show') && (
                      <div>
                        {booking.paymentStatus !== 'Done' ? (
                          <button
                            onClick={() => setConfirmAction({ bookingId: booking._id, paymentStatus: 'Done', label: 'Mark Payment as Settled / Paid' })}
                            className="w-full py-2.5 bg-(--brand-green) hover:bg-(--brand-green-deep) text-white text-[11px] font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Mark Payment as Settled / Paid
                          </button>
                        ) : (
                          <div className="w-full py-2 bg-(--brand-green)/10 border border-(--brand-green)/20 text-(--brand-green-deep) text-center text-[10px] font-bold rounded-xl">
                            ✓ Payment Settled
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* ── MODALS & TOASTS ── */}
      <AdminBookingModal
        isOpen={showAdminBooking}
        onClose={() => setShowAdminBooking(false)}
        existingBookings={bookings}
        onCreated={(msg) => {
          fetchBookings();
          if (msg) setToastMessage({ msg, type: 'success' });
        }}
      />

      <ViewBookingModal
        booking={viewingBooking}
        isOpen={!!viewingBooking}
        onClose={() => setViewingBooking(null)}
        onEdit={(b) => setEditingBooking(b)}
      />

      <EditBookingModal
        isOpen={!!editingBooking}
        onClose={() => setEditingBooking(null)}
        onUpdated={(msg) => {
          fetchBookings();
          if (msg) setToastMessage({ msg, type: 'success' });
        }}
        booking={editingBooking}
      />

      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        title="Confirm POS Operation"
        message={`Are you sure you want to ${confirmAction?.label}?`}
        confirmText="Confirm Action"
        isDanger={confirmAction?.newStatus === 'Cancelled' || confirmAction?.newStatus === 'No_Show'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.paymentStatus) {
            executePaymentUpdate();
          } else {
            executeStatusUpdate();
          }
        }}
      />

      <ConfirmModal
        isOpen={Boolean(deletingBookingId)}
        title="Permanently Delete Booking Record"
        message="Are you sure you want to delete this reservation record? This will permanently remove the booking and release any assigned hardware charger."
        confirmText="Delete Booking"
        isDanger={true}
        onClose={() => setDeletingBookingId(null)}
        onConfirm={() => deletingBookingId && executeDeleteBooking(deletingBookingId)}
      />

      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
