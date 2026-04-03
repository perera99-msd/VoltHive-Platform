'use client';

import React, { useState } from 'react';
import { apiUrl } from '../../lib/api';

// Define the TypeScript interface matching your backend response
interface RankedStation {
  _id: string;
  stationName: string;
  network: string;
  chargerType: string;
  powerOutputKW: number;
  isBookingEnabled: boolean;
  basePricePerKwh: number;
  currentDynamicPrice: number;
  demandStatus: string;
  routeData: {
    distanceKm: string;
    driveTimeMins: number;
  };
  valueScore: number;
}

export default function SmartMatchPanel() {
  const [batteryLevel, setBatteryLevel] = useState<number>(50);
  const [plugType, setPlugType] = useState<string>('CCS2');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<RankedStation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSmartMatch = async () => {
    setIsLoading(true);
    setError(null);

    // 1. Get User's Current Location via Browser Geolocation
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const payload = {
          userLat: position.coords.latitude,
          userLng: position.coords.longitude,
          plugType: plugType,
          currentBatteryLevel: batteryLevel
        };

        try {
          // 2. Call our newly built Node.js Smart Match API
          // Replace 5000 with your actual backend port if different
          const response = await fetch(apiUrl('/api/stations/smart-match'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          if (data.success) {
            setResults(data.data); // Set the Top 3 stations
          } else {
            setError(data.message || 'Failed to fetch stations');
          }
        } catch {
          setError('Server connection error. Is the backend running?');
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setError('Unable to retrieve your location. Please allow location access.');
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="bg-gradient-to-br from-(--brand-card)/95 to-(--background)/90 p-6 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.14)] border border-(--brand-border) max-w-md w-full backdrop-blur-2xl">
      <h2 className="text-2xl font-bold text-(--brand-ink) mb-2">Smart Match</h2>
      <p className="text-sm text-(--brand-muted) mb-6">Find the best value stations based on distance, traffic, and dynamic pricing.</p>

      {/* Input Controls */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-(--brand-muted) mb-1">
            Current Battery: {batteryLevel}%
          </label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={batteryLevel}
            onChange={(e) => setBatteryLevel(Number(e.target.value))}
            className="w-full h-2 bg-(--brand-border) rounded-lg appearance-none cursor-pointer accent-(--brand-blue)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-(--brand-muted) mb-1">Plug Type</label>
          <select 
            value={plugType}
            onChange={(e) => setPlugType(e.target.value)}
            className="w-full border border-(--brand-border) rounded-xl p-2.5 text-(--brand-ink) bg-(--brand-card) focus:ring-(--brand-blue) focus:border-(--brand-blue)"
          >
            <option value="CCS2">CCS2 (DC Fast)</option>
            <option value="Type 2">Type 2 (AC Slow)</option>
            <option value="CHAdeMO">CHAdeMO</option>
          </select>
        </div>
      </div>

      <button 
        onClick={handleSmartMatch}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-(--brand-blue) to-(--accent-blue) text-(--brand-card) font-semibold py-3 px-4 rounded-xl transition-opacity flex justify-center items-center shadow-lg shadow-(--brand-blue)/25"
      >
        {isLoading ? 'Calculating Best Routes...' : 'Find Best Value Stations'}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-(--ui-error)/10 text-(--ui-error) rounded-lg text-sm border border-(--ui-error)/20">
          {error}
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold text-(--brand-ink) border-b border-(--brand-border) pb-2">Top 3 Recommendations</h3>
          {results.map((station, index) => (
            <div key={station._id} className="p-4 rounded-2xl border border-(--brand-border) transition-all bg-(--background)/70 relative overflow-hidden">
              
              {/* Rank Badge */}
              <div className="absolute top-0 right-0 bg-(--brand-blue) text-(--brand-card) text-xs font-bold px-2 py-1 rounded-bl-lg">
                #{index + 1}
              </div>

              <h4 className="font-bold text-(--brand-ink) text-lg">{station.stationName}</h4>
              <p className="text-sm text-(--brand-muted) mb-2">{station.network} • {station.powerOutputKW}kW {station.chargerType}</p>
              
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs text-(--brand-muted) uppercase tracking-wider font-semibold">Live Price</p>
                  <p className="text-lg font-bold text-(--ui-success)">Rs. {station.currentDynamicPrice.toFixed(2)} / kWh</p>
                  <p className="text-xs text-(--ui-warning)">{station.demandStatus}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-(--brand-muted) uppercase tracking-wider font-semibold">Drive Time</p>
                  <p className="font-semibold text-(--brand-ink)">{station.routeData.driveTimeMins} mins</p>
                  <p className="text-xs text-(--brand-muted)">{station.routeData.distanceKm} km away</p>
                </div>
              </div>

              {/* Action Buttons based on Owner's Settings */}
              {station.isBookingEnabled ? (
                <button className="w-full bg-gradient-to-r from-(--brand-blue) to-(--accent-blue) text-(--brand-card) font-medium py-2 rounded-md transition-opacity text-sm">
                  Book Guaranteed Slot
                </button>
              ) : (
                <div className="flex gap-2">
                  <button className="flex-1 bg-(--brand-ink) text-(--brand-card) font-medium py-2 rounded-md transition-opacity text-sm">
                    Get Directions
                  </button>
                  <button className="flex-1 bg-(--brand-card) border border-(--brand-border) text-(--brand-ink) font-medium py-2 rounded-md transition-opacity text-sm">
                    Call Station
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}