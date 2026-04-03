'use client';
import { useState, useEffect } from 'react';
import AddChargerForm from '../AddChargerForm';
import { apiUrl } from '../../../lib/api';

interface Charger {
  plugType: string;
  powerKW: number;
  status: string;
}

interface Station {
  _id: string;
  name: string;
  address: string;
  location: { coordinates: [number, number] };
  pricePerKWh: number;
  chargers: Charger[];
}

export default function StationsView() {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(apiUrl('/api/stations'));
      if (res.ok) {
        const data = await res.json();
        setStations(data);
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStation = async (stationId: string) => {
    if (confirm('Are you sure you want to delete this station? This action cannot be undone.')) {
      try {
        const res = await fetch(apiUrl(`/api/stations/${stationId}`), {
          method: 'DELETE',
        });
        if (res.ok) {
          setStations(stations.filter(s => s._id !== stationId));
          if (selectedStation?._id === stationId) setSelectedStation(null);
        }
      } catch (error) {
        console.error('Failed to delete station:', error);
      }
    }
  };

  const filteredStations = stations.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAddingNew) {
    return <AddChargerForm onSuccess={() => { fetchStations(); setIsAddingNew(false); }} onCancel={() => setIsAddingNew(false)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* === HEADER === */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-(--brand-ink) tracking-tight">Hardware Stations</h1>
          <p className="text-(--brand-muted) text-sm mt-1">Manage all your charging stations and hardware</p>
        </div>
        <button 
          onClick={() => setIsAddingNew(true)}
          className="px-6 py-3 bg-(--brand-blue) text-white font-semibold rounded-xl hover:bg-(--brand-blue-deep) transition-colors flex items-center gap-2 shadow-lg"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add New Station
        </button>
      </div>

      {/* === SEARCH BAR === */}
      <div className="flex items-center bg-white border border-(--brand-border) rounded-xl px-4 py-3 w-full shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-(--brand-muted)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input 
          type="text" 
          placeholder="Search by station name or address..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none ml-3 text-sm w-full text-(--brand-ink) placeholder:text-(--brand-muted)"
        />
      </div>

      {/* === LOADING STATE === */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-(--brand-border) p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-(--brand-border) border-t-(--brand-blue) rounded-full animate-spin" />
            <p className="text-(--brand-muted) font-medium">Loading stations...</p>
          </div>
        </div>
      )}

      {/* === EMPTY STATE === */}
      {!isLoading && filteredStations.length === 0 && (
        <div className="bg-white rounded-2xl border border-(--brand-border) p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-(--accent-blue)/10 flex items-center justify-center text-(--accent-blue) mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h3 className="text-lg font-semibold text-(--brand-ink) mb-2">No stations yet</h3>
          <p className="text-(--brand-muted) mb-6 max-w-xs">Create your first charging station to get started</p>
          <button 
            onClick={() => setIsAddingNew(true)}
            className="px-5 py-2.5 bg-(--brand-blue) text-white font-semibold rounded-lg hover:bg-(--brand-blue-deep) transition-colors"
          >
            Create Station
          </button>
        </div>
      )}

      {/* === STATIONS GRID === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStations.map((station) => (
          <div 
            key={station._id} 
            className="bg-white rounded-2xl border border-(--brand-border) shadow-sm hover:shadow-md transition-all overflow-hidden group"
          >
            {/* Card Header with Badge */}
            <div className="p-6 pb-4 border-b border-(--brand-border)">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-(--brand-ink) group-hover:text-(--brand-blue) transition-colors">{station.name}</h3>
                <span className="px-3 py-1 bg-(--accent-blue)/10 text-(--accent-blue) text-[10px] font-bold uppercase tracking-wider rounded-lg">
                  {station.chargers.length} Chargers
                </span>
              </div>
              <p className="text-(--brand-muted) text-sm flex items-start gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mt-0.5 shrink-0"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                <span className="line-clamp-2">{station.address}</span>
              </p>
            </div>

            {/* Stats */}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-(--brand-muted) text-sm font-medium">Charging Rate</span>
                <span className="text-(--brand-ink) font-semibold">{station.pricePerKWh} LKR/kWh</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-(--brand-muted) text-sm font-medium">Available</span>
                <span className="text-(--ui-success) font-semibold">{station.chargers.filter(c => c.status === 'Available').length} / {station.chargers.length}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 pt-3 flex gap-2">
              <button 
                onClick={() => setSelectedStation(station)}
                className="flex-1 px-3 py-2.5 bg-(--accent-blue)/10 hover:bg-(--accent-blue)/20 text-(--brand-blue) font-semibold text-sm rounded-lg transition-colors"
              >
                View Details
              </button>
              <button 
                onClick={() => deleteStation(station._id)}
                className="flex-1 px-3 py-2.5 bg-(--ui-error)/10 hover:bg-(--ui-error)/20 text-(--ui-error) font-semibold text-sm rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* === STATION DETAIL MODAL === */}
      {selectedStation && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedStation(null)}>
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl p-8 animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-(--brand-ink)">{selectedStation.name}</h2>
              <button 
                onClick={() => setSelectedStation(null)}
                className="w-8 h-8 rounded-full bg-(--brand-border)/50 hover:bg-(--brand-border) transition-colors flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-(--brand-muted)"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-(--brand-muted) text-sm font-bold uppercase tracking-wider mb-2">Location</p>
                <p className="text-(--brand-ink) text-base">{selectedStation.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-(--brand-muted) text-sm font-bold uppercase tracking-wider mb-2">Rate</p>
                  <p className="text-2xl font-semibold text-(--brand-ink)">{selectedStation.pricePerKWh} <span className="text-sm font-medium text-(--brand-muted)">LKR/kWh</span></p>
                </div>
                <div>
                  <p className="text-(--brand-muted) text-sm font-bold uppercase tracking-wider mb-2">Total Chargers</p>
                  <p className="text-2xl font-semibold text-(--brand-ink)">{selectedStation.chargers.length}</p>
                </div>
              </div>

              <div>
                <p className="text-(--brand-muted) text-sm font-bold uppercase tracking-wider mb-3">Charger Details</p>
                <div className="space-y-2">
                  {selectedStation.chargers.map((charger, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-(--background)/50 rounded-lg border border-(--brand-border)">
                      <div>
                        <p className="font-medium text-(--brand-ink)">{charger.plugType}</p>
                        <p className="text-xs text-(--brand-muted)">{charger.powerKW} kW</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${charger.status === 'Available' ? 'bg-(--ui-success)/10 text-(--ui-success)' : 'bg-(--brand-border)/50 text-(--brand-muted)'}`}>
                        {charger.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-(--brand-border)">
                <button 
                  onClick={() => setSelectedStation(null)}
                  className="flex-1 px-4 py-3 bg-(--brand-border)/50 hover:bg-(--brand-border) text-(--brand-ink) font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => deleteStation(selectedStation._id)}
                  className="flex-1 px-4 py-3 bg-(--ui-error) hover:bg-(--ui-error)/90 text-white font-semibold rounded-lg transition-colors"
                >
                  Delete Station
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}