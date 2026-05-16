'use client';
import { useState, useEffect } from 'react';
import { apiUrl } from '../../../lib/api';
import { auth } from '../../../lib/firebase';

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
    // In a real app, you'd use WebSockets for live updates. 
    // For now, we poll every 15 seconds to simulate a live POS.
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
        fetchBookings(); // Refresh the list instantly
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const filteredBookings = bookings.filter(b => activeFilter === 'All' ? b.status !== 'Completed' && b.status !== 'Cancelled' : b.status === activeFilter);

  if (isLoading) return <div className="flex justify-center items-center h-64"><span className="vh-loader-soft w-8 h-8 rounded-full border-4 border-(--brand-blue) border-t-transparent animate-spin"></span></div>;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-(--brand-ink)">Live Operations (POS)</h1>
          <p className="text-(--brand-muted) text-sm mt-1">Manage incoming reservations and active charging sessions.</p>
        </div>
        <button onClick={fetchBookings} className="px-4 py-2 bg-white border border-(--brand-border) rounded-xl text-sm font-bold text-(--brand-ink) hover:bg-(--background) shadow-sm flex items-center gap-2">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          Refresh Live
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-(--brand-border) w-fit">
        {(['All', 'Pending', 'Confirmed', 'Active_Charging'] as const).map((filter) => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeFilter === filter ? 'bg-(--brand-blue) text-white shadow-md' : 'text-(--brand-muted) hover:bg-(--background)'}`}
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Queue Grid */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-(--brand-muted) bg-white rounded-2xl border border-(--brand-border)">
            <p className="font-bold">No active vehicles in queue.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-2xl border border-(--brand-border) p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden">
              
              {/* Status Indicator Bar */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                booking.status === 'Pending' ? 'bg-(--ui-warning)' : 
                booking.status === 'Confirmed' ? 'bg-(--brand-blue)' : 
                'bg-(--ui-success) animate-pulse'
              }`} />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-(--brand-ink) text-lg">{booking.driver?.name || 'Guest Driver'}</h3>
                  <p className="text-sm font-semibold text-(--brand-blue)">{booking.station?.stationName}</p>
                </div>
                <div className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border ${
                  booking.status === 'Pending' ? 'bg-(--ui-warning)/10 text-(--ui-warning) border-(--ui-warning)/20' : 
                  booking.status === 'Confirmed' ? 'bg-(--brand-blue)/10 text-(--brand-blue) border-(--brand-blue)/20' : 
                  'bg-(--ui-success)/10 text-(--ui-success) border-(--ui-success)/20'
                }`}>
                  {booking.status.replace('_', ' ')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                <div className="bg-(--background) p-3 rounded-xl border border-(--brand-border)">
                  <p className="text-[10px] text-(--brand-muted) font-bold uppercase">Time Slot</p>
                  <p className="font-black text-(--brand-ink)">{booking.startTime}</p>
                </div>
                <div className="bg-(--background) p-3 rounded-xl border border-(--brand-border)">
                  <p className="text-[10px] text-(--brand-muted) font-bold uppercase">Locked Rate</p>
                  <p className="font-black text-(--ui-success)">Rs. {booking.lockedPricePerKwh}</p>
                </div>
              </div>

              {/* ACTION BUTTONS (The POS Logic) */}
              <div className="mt-auto">
                {booking.status === 'Pending' && (
                  <button 
                    onClick={() => updateBookingStatus(booking._id, 'Confirmed')}
                    className="w-full py-3 bg-(--brand-ink) hover:bg-black text-white font-bold rounded-xl transition-all shadow-md"
                  >
                    Accept Reservation
                  </button>
                )}
                
                {booking.status === 'Confirmed' && (
                  <button 
                    onClick={() => updateBookingStatus(booking._id, 'Active_Charging')}
                    className="w-full py-3 bg-(--brand-blue) hover:bg-(--brand-blue-deep) text-white font-bold rounded-xl transition-all shadow-md shadow-(--brand-blue)/25 flex justify-center items-center gap-2"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                    Start Charging Session
                  </button>
                )}

                {booking.status === 'Active_Charging' && (
                  <button 
                    onClick={() => updateBookingStatus(booking._id, 'Completed')}
                    className="w-full py-3 bg-(--ui-error) hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/25 animate-pulse hover:animate-none"
                  >
                    Stop Charge & Generate Bill
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}