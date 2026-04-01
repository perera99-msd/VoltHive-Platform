'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';

// Define types for our data
interface Station {
  _id: string;
  name: string;
  address: string;
  pricePerKWh: number;
  chargers: { plugType: string; powerKW: number; status: string }[];
}

interface Booking {
  _id: string;
  driver: { name: string; email: string };
  station: { name: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

export default function OwnerDashboard() {
  const { user, logout } = useAuth(); 
  const [status, setStatus] = useState('');
  const [myStations, setMyStations] = useState<Station[]>([]);
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [form, setForm] = useState({
    name: '', address: '', latitude: '', longitude: '',
    plugType: 'Type 2', powerKW: '', pricePerKWh: ''
  });

  // Fetch stations owned by this user
  const fetchMyStations = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('http://localhost:5000/api/stations/my-stations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyStations(data);
      }
    } catch (error) {
      console.error('Failed to fetch stations', error);
    }
  }, [user]);

  // Fetch bookings made at this owner's stations
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('http://localhost:5000/api/bookings/owner', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIncomingBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    }
  }, [user]);

  // Load data on mount
  useEffect(() => {
    fetchMyStations();
    fetchBookings();
  }, [fetchMyStations, fetchBookings]);

  // Handle station registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await user?.getIdToken();
    const res = await fetch('http://localhost:5000/api/stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        powerKW: Number(form.powerKW),
        pricePerKWh: Number(form.pricePerKWh)
      })
    });

    if (res.ok) {
      setStatus('Station registered successfully! ⚡');
      setForm({ name: '', address: '', latitude: '', longitude: '', plugType: 'Type 2', powerKW: '', pricePerKWh: '' });
      fetchMyStations(); 
      setTimeout(() => setStatus(''), 3000);
    } else {
      setStatus('Error registering station.');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  // Handle booking status updates (Confirm, Complete, Cancel)
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchBookings(); // Refresh the table after update
      }
    } catch (error) {
      console.error('Failed to update booking status', error);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Owner Dashboard</h1>
              <p className="text-gray-500 text-sm">Manage your infrastructure and incoming reservations.</p>
            </div>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
            >
              Sign Out
            </button>
          </header>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Registration Form */}
            <div className="md:col-span-1 space-y-8">
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">Register Station</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input placeholder="Station Name" className="w-full p-2 border rounded text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  <input placeholder="Address" className="w-full p-2 border rounded text-sm" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required />
                  <div className="flex gap-2">
                    <input type="number" step="any" placeholder="Latitude" className="w-full p-2 border rounded text-sm" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} required />
                    <input type="number" step="any" placeholder="Longitude" className="w-full p-2 border rounded text-sm" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} required />
                  </div>
                  <select className="w-full p-2 border rounded text-sm bg-white" value={form.plugType} onChange={e => setForm({...form, plugType: e.target.value})}>
                    <option>Type 2</option><option>CCS</option><option>CHAdeMO</option>
                  </select>
                  <input type="number" placeholder="Power (kW)" className="w-full p-2 border rounded text-sm" value={form.powerKW} onChange={e => setForm({...form, powerKW: e.target.value})} required />
                  <input type="number" step="0.01" placeholder="Price per kWh (LKR)" className="w-full p-2 border rounded text-sm" value={form.pricePerKWh} onChange={e => setForm({...form, pricePerKWh: e.target.value})} required />
                  <button className="w-full bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition text-sm font-medium">Add to Network</button>
                  {status && <p className={`mt-2 text-center text-xs font-medium ${status.includes('Error') ? 'text-red-600' : 'text-blue-600'}`}>{status}</p>}
                </form>
              </section>
            </div>

            {/* RIGHT COLUMN: Bookings & Active Stations */}
            <div className="md:col-span-2 space-y-8">
              
              {/* Incoming Bookings Table */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  Incoming Reservations
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{incomingBookings.length}</span>
                </h2>
                
                {incomingBookings.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">No incoming bookings yet. Your schedule is clear.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="p-3 font-medium rounded-tl-lg">Driver</th>
                          <th className="p-3 font-medium">Station</th>
                          <th className="p-3 font-medium">Time Slot</th>
                          <th className="p-3 font-medium">Status</th>
                          <th className="p-3 font-medium rounded-tr-lg">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {incomingBookings.map((b) => (
                          <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-medium text-gray-900">{b.driver?.name}</td>
                            <td className="p-3 text-gray-600">{b.station?.name}</td>
                            <td className="p-3 text-gray-600">
                              <div className="font-medium text-gray-900">{b.date}</div>
                              <div className="text-xs">{b.startTime} - {b.endTime}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                b.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                                b.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                {b.status === 'Pending' && (
                                  <button onClick={() => updateBookingStatus(b._id, 'Confirmed')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition">Confirm</button>
                                )}
                                {b.status === 'Confirmed' && (
                                  <button onClick={() => updateBookingStatus(b._id, 'Completed')} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition">Complete</button>
                                )}
                                {(b.status === 'Pending' || b.status === 'Confirmed') && (
                                  <button onClick={() => updateBookingStatus(b._id, 'Cancelled')} className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-50 transition">Cancel</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* My Active Stations Grid */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">My Network</h2>
                {myStations.length === 0 ? (
                  <p className="text-gray-500 text-sm">You haven't registered any stations yet.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {myStations.map((station) => (
                      <div key={station._id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900">{station.name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${station.chargers[0].status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {station.chargers[0].status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mb-3">{station.address}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] font-medium">
                          <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded">
                            {station.chargers[0].plugType} ({station.chargers[0].powerKW}kW)
                          </span>
                          <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-1 rounded">
                            {station.pricePerKWh} LKR / kWh
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}