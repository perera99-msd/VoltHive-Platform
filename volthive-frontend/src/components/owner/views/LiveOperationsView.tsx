'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../../../lib/api';
import { auth } from '../../../lib/firebase';
import { useLiveEvents } from '../../../context/LiveEventsContext';
import AdminBookingModal from '../AdminBookingModal';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Active_Charging' | 'Completed' | 'History'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAdminBooking, setShowAdminBooking] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Confirmation state for POS actions
  const [confirmAction, setConfirmAction] = useState<{ bookingId: string; newStatus?: string; paymentStatus?: string; label: string; isDanger?: boolean } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' } | null>(null);

  const fetchBookings = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(apiUrl('/api/bookings/owner?all=true'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await res.json();
      if (payload.success) {
        setBookings(payload.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };

  useEffect(() => {
    fetchBookings();
    // Slow self-healing fallback poll (SSE pushes instant updates when live).
    const interval = setInterval(fetchBookings, 60000);
    return () => clearInterval(interval);
  }, []);

  // Realtime: refresh instantly when a booking event arrives for this owner.
  const { subscribe } = useLiveEvents();
  useEffect(() => {
    const unsub = subscribe(
      ['booking.created', 'booking.updated', 'booking.deleted', 'booking.expired'],
      () => {
        fetchBookings();
      }
    );
    return unsub;
  }, [subscribe]);

  const executeDeleteBooking = async (bookingId: string) => {
    setIsDeleting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(apiUrl(`/api/bookings/${bookingId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletingBooking(null);
      if (res.ok) {
        setToastMessage({ msg: 'Reservation record permanently deleted.', type: 'success' });
        fetchBookings();
      } else {
        setToastMessage({ msg: 'Failed to delete reservation.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setDeletingBooking(null);
      setToastMessage({ msg: 'Network failure communicating with server.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const executeStatusUpdate = async () => {
    if (!confirmAction) return;
    const { bookingId, newStatus } = confirmAction;
    setIsUpdatingStatus(true);

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

      setConfirmAction(null);
      if (res.ok) {
        setToastMessage({ msg: `Booking status updated to ${newStatus?.replace('_', ' ')}`, type: 'success' });
        fetchBookings();
      } else {
        setToastMessage({ msg: 'Failed to update status', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating status', error);
      setConfirmAction(null);
      setToastMessage({ msg: 'Network failure', type: 'error' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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

  // Metrics Calculations
  const activeCount = bookings.filter(b => b.status === 'Active_Charging').length;
  const pendingCount = bookings.filter(b => b.status === 'Pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const activeQueueCount = activeCount + pendingCount + confirmedCount;
  const completedCount = bookings.filter(b => b.status === 'Completed').length;

  // Ticking clock for countdown
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
      <div className="flex items-center justify-center py-24 font-sans">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-(--brand-blue)"></div>
      </div>
    );
  }

  return (
    <div className="w-full relative font-sans space-y-6 pb-16">
      
      {/* ── 1. HEADER BANNER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white font-black flex items-center justify-center shadow-xs shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--brand-ink)">Live Operations & POS</h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--brand-green)/10 text-(--brand-green-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-green)/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-(--brand-muted) font-medium">
            Manage incoming driver reservations, active charging sessions, customer hotlines, and POS checkouts.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <button 
            onClick={() => setShowAdminBooking(true)} 
            className="inline-flex items-center justify-center gap-2 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white px-5 py-3 rounded-2xl text-xs font-black shadow-xs hover:shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Manual Booking</span>
          </button>
          
          <button 
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/90 border border-[#e0e5e3] rounded-2xl text-xs font-bold text-(--brand-ink) shadow-2xs hover:bg-(--surface-soft) transition-all cursor-pointer shrink-0"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 text-(--brand-blue) ${isRefreshing ? 'animate-spin' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* ── 2. METRICS SUMMARY BAR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Charging */}
        <div className="bg-white/90 backdrop-blur-2xl border border-[#e0e5e3]/90 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />
          <div className="w-12 h-12 rounded-2xl bg-(--brand-green)/10 border border-(--brand-green)/20 flex items-center justify-center text-(--brand-green-deep) shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Active Charging</p>
            <h3 className="text-xl font-black text-(--brand-ink)">{activeCount} Plugged In</h3>
            <p className="text-[11px] text-(--brand-muted) font-semibold">Live power dispensing</p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white/90 backdrop-blur-2xl border border-[#e0e5e3]/90 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[var(--ui-warning)] to-[var(--ui-warning)]/80 opacity-90" />
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300/40 flex items-center justify-center text-[#c58d1b] shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-xl font-black text-(--brand-ink)">{pendingCount} Awaiting</h3>
            <p className="text-[11px] text-(--brand-muted) font-semibold">15-minute auto window</p>
          </div>
        </div>

        {/* Active Queue */}
        <div className="bg-white/90 backdrop-blur-2xl border border-[#e0e5e3]/90 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />
          <div className="w-12 h-12 rounded-2xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue-deep) shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Active Queue</p>
            <h3 className="text-xl font-black text-(--brand-ink)">{activeQueueCount} Sessions</h3>
            <p className="text-[11px] text-(--brand-muted) font-semibold">{confirmedCount} confirmed slots</p>
          </div>
        </div>

        {/* Settled Revenue */}
        <div className="bg-white/90 backdrop-blur-2xl border border-[#e0e5e3]/90 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-90" />
          <div className="w-12 h-12 rounded-2xl bg-(--brand-blue)/10 border border-(--brand-blue)/20 flex items-center justify-center text-(--brand-blue-deep) shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-(--brand-muted) uppercase tracking-wider">Completed Sessions</p>
            <h3 className="text-xl font-black text-(--brand-ink)">{completedCount} Sessions</h3>
            <p className="text-[11px] text-(--brand-muted) font-semibold">Settle the agreed rate manually</p>
          </div>
        </div>
      </div>

      {/* ── 3. SEARCH & FILTER TABS ── */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) absolute left-4 top-1/2 -translate-y-1/2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by customer name, phone number, or station premise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 bg-white/90 backdrop-blur-xl border border-[#e0e5e3] rounded-2xl text-xs text-(--brand-ink) font-semibold focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) shadow-2xs transition-all placeholder:text-(--brand-muted)/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--brand-muted) hover:text-(--brand-ink) font-bold text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="inline-flex p-1.5 bg-white/90 backdrop-blur-xl border border-[#e0e5e3] rounded-2xl shadow-2xs overflow-x-auto scrollbar-hide">
          {(['All', 'Pending', 'Confirmed', 'Active_Charging', 'Completed', 'History'] as const).map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === filter 
                  ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white shadow-xs' 
                  : 'text-(--brand-muted) hover:text-(--brand-ink) hover:bg-(--surface-soft)'
              }`}
            >
              {filter === 'All' ? 'Active Queue' : filter === 'History' ? 'History / Closed' : filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. QUEUE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence>
          {filteredBookings.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-16 bg-white/80 backdrop-blur-2xl border-2 border-dashed border-[#e0e5e3] rounded-3xl text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-(--surface-soft) border border-[#e0e5e3] flex items-center justify-center mx-auto mb-4 text-(--brand-muted)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-black text-(--brand-ink)">No Reservation Records Found</h3>
              <p className="text-xs text-(--brand-muted) mt-1 font-medium max-w-sm mx-auto">
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
                : (booking.driver?.telephone || booking.driver?.phone || 'No Phone');

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  key={booking._id} 
                  className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Status Top Accent Gradient Stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] opacity-90 ${
                    booking.status === 'Pending' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                    booking.status === 'Confirmed' ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green)' : 
                    booking.status === 'Active_Charging' ? 'bg-linear-to-r from-(--brand-green) to-(--brand-green-deep)' :
                    booking.status === 'Completed' ? 'bg-linear-to-r from-(--brand-green) to-emerald-600' :
                    'bg-linear-to-r from-rose-500 to-rose-600'
                  }`} />

                  {/* Header Row: Customer Name & Action Toolbar */}
                  <div className="flex justify-between items-start gap-2 mb-3 mt-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-2xs ${
                        booking.status === 'Pending' ? 'bg-amber-500' : 
                        booking.status === 'Confirmed' ? 'bg-(--brand-blue)' : 
                        booking.status === 'Active_Charging' ? 'bg-(--brand-green)' :
                        booking.status === 'Completed' ? 'bg-(--brand-green)' :
                        'bg-rose-500'
                      }`}>
                        {(cName[0] || 'C').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-(--brand-ink) text-sm tracking-tight truncate">{cName}</h3>
                        <p className="text-[11px] font-bold text-(--brand-blue-deep) truncate">{booking.station?.stationName || 'VoltHive Premise'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 bg-(--surface-soft)/60 p-1 rounded-2xl border border-[#e0e5e3]">
                        <button
                          onClick={() => setViewingBooking(booking)}
                          title="View Booking Details"
                          className="p-1.5 rounded-xl text-(--brand-muted) hover:bg-white hover:text-(--brand-blue) hover:shadow-2xs transition-all cursor-pointer"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>

                        {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                          <button
                            onClick={() => setDeletingBooking(booking)}
                            title="Delete Reservation (frees slot)"
                            className="p-1.5 rounded-xl text-(--brand-muted) hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                          >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border flex items-center gap-1.5 shrink-0 ${
                        booking.status === 'Pending' ? 'bg-amber-500/10 text-amber-700 border-amber-300' : 
                        booking.status === 'Confirmed' ? 'bg-(--brand-blue)/10 text-(--brand-blue-deep) border-(--brand-blue)/20' : 
                        booking.status === 'Active_Charging' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                        booking.status === 'Completed' ? 'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20' :
                        'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          booking.status === 'Pending' ? 'bg-amber-500' : 
                          booking.status === 'Confirmed' ? 'bg-(--brand-blue)' : 
                          booking.status === 'Active_Charging' ? 'bg-(--brand-green) animate-pulse' :
                          booking.status === 'Completed' ? 'bg-(--brand-green)' :
                          'bg-rose-500'
                        }`} />
                        <span>{booking.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Contact Hotline Bar */}
                  <div className="mb-3 px-3.5 py-2 bg-(--surface-soft)/50 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 border border-[#e0e5e3]">
                    <span className="font-extrabold text-(--brand-ink) flex items-center gap-1.5">
                      <span>📞</span>
                      <a href={`tel:${cPhone}`} className="hover:underline hover:text-(--brand-blue)">{cPhone}</a>
                    </span>
                    <span className="text-[11px] text-(--brand-muted) truncate max-w-[130px]">
                      ✉️ {booking.driver?.email || 'N/A'}
                    </span>
                  </div>

                  {/* Time & Price Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4 flex-1">
                    <div className="bg-white p-3 rounded-2xl border border-[#e0e5e3] flex flex-col justify-center shadow-2xs">
                      <p className="text-[9px] text-(--brand-muted) font-black uppercase tracking-wider mb-0.5">Time Slot</p>
                      <p className="font-black text-(--brand-ink) text-xs">{booking.startTime} - {booking.endTime}</p>
                      <p className="text-[10px] text-(--brand-muted) font-semibold mt-0.5">{booking.date}</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-[#e0e5e3] flex flex-col justify-center shadow-2xs">
                      <p className="text-[9px] text-(--brand-muted) font-black uppercase tracking-wider mb-0.5">Locked Rate (Agreed)</p>
                      <p className="font-black text-(--brand-ink) text-xs">
                        LKR {booking.lockedPricePerKwh ?? '—'} / kWh
                      </p>
                      <p className="text-[10px] text-(--brand-muted) font-semibold mt-0.5">Price locked when booking was made</p>
                    </div>
                  </div>

                  {/* ACTION BUTTONS (POS Execution Flow) */}
                  <div className="mt-auto">
                    {booking.status === 'Pending' && (() => {
                      const { rem, label } = pendingRemaining(booking.createdAt);
                      const windowPassed = rem === 0;
                      return (
                        <div className="space-y-2">
                          <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border text-center ${
                            windowPassed
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {windowPassed ? '⏰ Approval window passed — will be marked Expired' : `⏳ Approve within ${label}`}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setConfirmAction({ bookingId: booking._id, newStatus: 'Confirmed', label: 'Accept Reservation' })}
                              className="py-2.5 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs font-black rounded-xl transition-all shadow-xs hover:brightness-105 cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => setConfirmAction({ bookingId: booking._id, newStatus: 'Cancelled', label: 'Reject Reservation', isDanger: true })}
                              className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black rounded-xl transition-all cursor-pointer"
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
                          className="w-full py-2.5 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs font-black rounded-xl transition-all shadow-xs hover:brightness-105 flex justify-center items-center gap-2 cursor-pointer"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                          </svg>
                          <span>Start Charging Session</span>
                        </button>
                        <button
                          onClick={() => setDeletingBooking(booking)}
                          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black rounded-xl transition-all cursor-pointer"
                        >
                          Delete Booking (frees slot)
                        </button>
                      </div>
                    )}

                    {booking.status === 'Active_Charging' && (
                      <button 
                        onClick={() => setConfirmAction({ bookingId: booking._id, newStatus: 'Completed', label: 'Stop Charge & Checkout Driver' })}
                        className="w-full py-2.5 bg-white border border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white text-xs font-black rounded-xl transition-all shadow-2xs cursor-pointer flex justify-center items-center gap-2 group"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 group-hover:bg-white animate-pulse" />
                        <span>Stop Charge & Check Out</span>
                      </button>
                    )}

                    {booking.status === 'Expired' && (
                      <div className="w-full py-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-center text-[10px] font-bold rounded-xl">
                        Booking expired — no response within 15 min. Use delete icon to clean record.
                      </div>
                    )}

                    {(booking.status === 'Completed' || booking.status === 'Cancelled' || booking.status === 'No_Show') && (
                      <div className="w-full py-2.5 bg-(--surface-soft)/50 border border-[#e0e5e3] text-(--brand-muted) text-center text-[10px] font-bold rounded-xl">
                        {booking.status === 'Completed'
                          ? '✓ Session completed — settle the agreed LKR rate manually with the driver'
                          : 'Closed — this record is removed automatically shortly'}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* ── 5. MODALS & TOASTS ── */}
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
      />

      {/* POS Action Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        title="Confirm POS Operation"
        message={`Are you sure you want to ${confirmAction?.label}?`}
        confirmText="Confirm Operation"
        cancelText="Cancel"
        isDanger={confirmAction?.isDanger}
        isLoading={isUpdatingStatus}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeStatusUpdate}
      />

      {/* Delete Booking Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingBooking)}
        title="Permanently Delete Booking Record?"
        message={`Are you sure you want to delete the reservation record for "${deletingBooking?.customerName || deletingBooking?.driver?.name || 'Customer'}"? This will release any assigned hardware charger.`}
        confirmText="Delete Booking"
        cancelText="Keep Booking"
        isDanger={true}
        isLoading={isDeleting}
        onClose={() => setDeletingBooking(null)}
        onConfirm={() => deletingBooking && executeDeleteBooking(deletingBooking._id)}
      />

      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
