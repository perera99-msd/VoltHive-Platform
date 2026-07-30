'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../../../lib/api';
import { auth } from '../../../lib/firebase';
import AdminBookingModal from '../AdminBookingModal';

interface Booking {
  _id: string;
  driver: { name: string; email: string; phone: string };
  station: { stationName: string; address: string };
  chargerId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Pending' | 'Confirmed' | 'Active_Charging' | 'Completed' | 'Cancelled';
  lockedPricePerKwh: number;
  totalCostLKR?: number;
}

export default function LiveOperationsView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Active_Charging'>('All');
  const [showAdminBooking, setShowAdminBooking] = useState(false);

  const fetchBookings = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(apiUrl('/api/bookings/owner'), {
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

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
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
        fetchBookings();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const extendSession = async (bookingId: string, mins: number) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(apiUrl(`/api/bookings/${bookingId}/extend`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ additionalMinutes: mins })
      });
      if (res.ok) {
        fetchBookings();
      } else {
        alert('Failed to extend session duration');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBookings = bookings.filter(b => activeFilter === 'All' ? b.status !== 'Completed' && b.status !== 'Cancelled' : b.status === activeFilter);

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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--brand-green)/10 text-(--brand-green-deep) text-[9px] font-extrabold uppercase tracking-[0.12em] border border-(--brand-green)/20">
              <span className="w-1.5 h-1.5 rounded-full bg-(--brand-green) animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-[12px] text-(--brand-muted) font-medium">Manage incoming reservations, active charging sessions, and POS checkouts.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button onClick={() => setShowAdminBooking(true)} className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-(--brand-blue) to-(--brand-green) text-white rounded-xl text-[12px] font-bold shadow-sm hover:brightness-105 transition-all cursor-pointer">
            + New Booking
          </button>
          <button onClick={fetchBookings} className="w-full sm:w-auto px-4 py-2.5 bg-white border border-(--brand-border)/80 rounded-xl text-[12px] font-bold text-(--brand-ink) shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-blue)"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            Refresh List
          </button>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="mb-6 flex overflow-x-auto pb-2 scrollbar-hide">
        <div className="inline-flex p-1 bg-(--surface-soft)/50 border border-(--brand-border)/60 rounded-xl">
          {(['All', 'Pending', 'Confirmed', 'Active_Charging'] as const).map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === filter 
                  ? 'bg-white text-(--brand-ink) shadow-xs border border-(--brand-border)/60' 
                  : 'text-(--brand-muted) hover:text-(--brand-ink)'
              }`}
            >
              {filter.replace('_', ' ')}
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
              <h3 className="text-[14px] font-extrabold text-(--brand-ink)">No Vehicles in Queue</h3>
              <p className="text-[12px] text-(--brand-muted) mt-1 font-medium">No pending reservations or active sessions found for this filter.</p>
            </motion.div>
          ) : (
            filteredBookings.map((booking, i) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                key={booking._id} 
                className="bg-white rounded-2xl border border-(--brand-border)/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 right-0 h-[3px] opacity-80 ${
                  booking.status === 'Pending' ? 'bg-gradient-to-r from-[#f4b740] to-[#f4b740]/80' : 
                  booking.status === 'Confirmed' ? 'bg-gradient-to-r from-(--brand-blue) to-(--brand-green)' : 
                  'bg-gradient-to-r from-(--brand-green) to-(--brand-green-deep)'
                }`} />

                <div className="flex justify-between items-start mb-5 mt-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-[12px] shrink-0 ${
                      booking.status === 'Pending' ? 'bg-[#f4b740]' : 
                      booking.status === 'Confirmed' ? 'bg-(--brand-blue)' : 
                      'bg-(--brand-green)'
                    }`}>
                      {(booking.driver?.name || 'G')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-(--brand-ink) text-[15px] tracking-tight">{booking.driver?.name || 'Guest Driver'}</h3>
                      <p className="text-[11px] font-bold text-(--brand-muted) truncate max-w-[150px]">{booking.station?.stationName}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-md border flex items-center gap-1.5 shrink-0 ${
                    booking.status === 'Pending' ? 'bg-[#f4b740]/10 text-[#d09d2e] border-[#f4b740]/20' : 
                    booking.status === 'Confirmed' ? 'bg-(--brand-blue)/10 text-(--brand-blue) border-(--brand-blue)/20' : 
                    'bg-(--brand-green)/10 text-(--brand-green-deep) border-(--brand-green)/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      booking.status === 'Pending' ? 'bg-[#f4b740]' : 
                      booking.status === 'Confirmed' ? 'bg-(--brand-blue)' : 
                      'bg-(--brand-green) animate-pulse'
                    }`} />
                    {booking.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 flex-1">
                  <div className="bg-(--surface-soft)/40 p-3 rounded-xl border border-(--brand-border)/50 flex flex-col justify-center">
                    <p className="text-[9px] text-(--brand-muted) font-extrabold uppercase tracking-wider mb-0.5">Time Slot</p>
                    <p className="font-black text-(--brand-ink) text-[13px]">{booking.startTime}</p>
                  </div>
                  <div className="bg-(--surface-soft)/40 p-3 rounded-xl border border-(--brand-border)/50 flex flex-col justify-center">
                    <p className="text-[9px] text-(--brand-muted) font-extrabold uppercase tracking-wider mb-0.5">Locked Rate</p>
                    <p className="font-black text-(--brand-ink) text-[13px]">LKR {booking.lockedPricePerKwh}</p>
                  </div>
                </div>

                {/* ACTION BUTTONS (The POS Logic) */}
                <div className="mt-auto">
                  {booking.status === 'Pending' && (
                    <button 
                      onClick={() => updateBookingStatus(booking._id, 'Confirmed')}
                      className="w-full py-3 bg-(--brand-ink) hover:bg-black text-white text-[12px] font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Accept Reservation
                    </button>
                  )}
                  
                  {booking.status === 'Confirmed' && (
                    <button 
                      onClick={() => updateBookingStatus(booking._id, 'Active_Charging')}
                      className="w-full py-3 bg-(--brand-blue) hover:bg-(--brand-blue-deep) text-white text-[12px] font-bold rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 cursor-pointer"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                      Start Charging Session
                    </button>
                  )}

                  {booking.status === 'Active_Charging' && (
                    <div className="space-y-2">
                      <button 
                        onClick={() => updateBookingStatus(booking._id, 'Completed')}
                        className="w-full py-3 bg-white border border-(--ui-error) text-(--ui-error) hover:bg-(--ui-error) hover:text-white text-[12px] font-bold rounded-xl transition-all shadow-sm cursor-pointer flex justify-center items-center gap-2 group"
                      >
                        <span className="w-2 h-2 rounded-full bg-(--ui-error) group-hover:bg-white animate-pulse" />
                        Stop Charge & Check Out
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => extendSession(booking._id, 15)} className="py-2.5 bg-(--surface-soft)/40 border border-(--brand-border)/80 text-(--brand-ink) hover:bg-(--surface-tint) text-[11px] font-bold rounded-lg transition-colors cursor-pointer">+15 Min</button>
                        <button onClick={() => extendSession(booking._id, 30)} className="py-2.5 bg-(--surface-soft)/40 border border-(--brand-border)/80 text-(--brand-ink) hover:bg-(--surface-tint) text-[11px] font-bold rounded-lg transition-colors cursor-pointer">+30 Min</button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <AdminBookingModal
        isOpen={showAdminBooking}
        onClose={() => setShowAdminBooking(false)}
        onCreated={fetchBookings}
      />
    </div>
  );
}
