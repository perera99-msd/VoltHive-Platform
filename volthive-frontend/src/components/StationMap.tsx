'use client';

import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useAuth } from '../context/AuthContext';

interface Station {
  _id: string;
  name: string;
  address: string;
  pricePerKWh: number;
  location: { coordinates: [number, number] };
  chargers: { plugType: string; powerKW: number; status: string }[];
}

export default function StationMap() {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  
  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('');
  const [bookingForm, setBookingForm] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });

  const defaultCenter = { lat: 7.8731, lng: 80.7718 }; // Sri Lanka Center

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stations');
        if (response.ok) {
          const data = await response.json();
          setStations(data);
        }
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      }
    };
    fetchStations();
  }, []);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStation) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stationId: selectedStation._id,
          ...bookingForm
        })
      });

      if (response.ok) {
        setBookingStatus('Booking confirmed! ✅');
        setTimeout(() => {
          setIsModalOpen(false);
          setBookingStatus('');
          setSelectedStation(null); // Close info window too
        }, 2000);
      } else {
        const err = await response.json();
        setBookingStatus(`Error: ${err.message}`);
      }
    } catch (error) {
      setBookingStatus('Failed to connect to server.');
    }
  };

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-md border border-gray-200 relative">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
        <Map defaultZoom={8} defaultCenter={defaultCenter} mapId="VOLTHIVE_MAP_ID" disableDefaultUI={true} zoomControl={true}>
          
          {/* Render all station markers */}
          {stations.map((station) => (
            <AdvancedMarker 
              key={station._id} 
              position={{ lat: station.location.coordinates[1], lng: station.location.coordinates[0] }}
              onClick={() => setSelectedStation(station)}
            >
              <Pin background={'#2563eb'} borderColor={'#ffffff'} glyphColor={'#ffffff'}>
                <span className="text-[10px] font-bold text-white">⚡</span>
              </Pin>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-[10px] font-bold border border-blue-100">
                {station.pricePerKWh} LKR
              </div>
            </AdvancedMarker>
          ))}

          {/* Render InfoWindow if a station is clicked */}
          {selectedStation && (
            <InfoWindow
              position={{ lat: selectedStation.location.coordinates[1], lng: selectedStation.location.coordinates[0] }}
              onCloseClick={() => setSelectedStation(null)}
            >
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg mb-1">{selectedStation.name}</h3>
                <p className="text-gray-500 text-xs mb-3">{selectedStation.address}</p>
                <div className="flex justify-between items-center mb-4 text-sm">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                    {selectedStation.chargers[0].powerKW}kW {selectedStation.chargers[0].plugType}
                  </span>
                  <span className="font-bold text-green-700">{selectedStation.pricePerKWh} LKR/kWh</span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-black text-white py-2 rounded text-sm font-medium hover:bg-gray-800 transition"
                >
                  Book a Slot
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* The Booking Modal Overlay */}
      {isModalOpen && selectedStation && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Reserve Charger</h2>
                <p className="text-sm text-gray-500">{selectedStation.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleBookSlot} className="p-6 space-y-4 bg-gray-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  required 
                  className="w-full p-2 border rounded bg-white"
                  value={bookingForm.date}
                  onChange={e => setBookingForm({...bookingForm, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input 
                    type="time" 
                    required 
                    className="w-full p-2 border rounded bg-white"
                    value={bookingForm.startTime}
                    onChange={e => setBookingForm({...bookingForm, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input 
                    type="time" 
                    required 
                    className="w-full p-2 border rounded bg-white"
                    value={bookingForm.endTime}
                    onChange={e => setBookingForm({...bookingForm, endTime: e.target.value})}
                  />
                </div>
              </div>

              {bookingStatus && (
                <div className={`p-3 rounded text-sm font-medium text-center ${bookingStatus.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {bookingStatus}
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition mt-4 shadow-sm">
                Confirm Reservation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}