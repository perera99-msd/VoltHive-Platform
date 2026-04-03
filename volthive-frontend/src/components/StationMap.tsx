'use client';
import { useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

interface Station {
  _id: string;
  name: string;
  address: string;
  pricePerKWh: number;
  location: { coordinates: [number, number] };
  chargers: { plugType: string; powerKW: number; status: string }[];
}

interface StationMapProps {
  stations: Station[];
  onMarkerClick: (station: Station) => void;
  bestValueId?: string | null;
  userLocation: { lat: number, lng: number } | null;
}

// --- NEW: INVISIBLE CAMERA CONTROLLER ---
// This listens for the GPS to load, then smoothly flies the camera to the user
function CameraHandler({ location }: { location: { lat: number, lng: number } | null }) {
  const map = useMap(); // Hooks into the Google Map instance

  useEffect(() => {
    if (map && location) {
      // Smoothly pans to the user and zooms in to a comfortable city/street level
      map.panTo(location);
      map.setZoom(14); 
    }
  }, [map, location]);

  return null; // Renders nothing on the screen
}

export default function StationMap({ stations, onMarkerClick, bestValueId, userLocation }: StationMapProps) {
  // Fallback center: Sri Lanka, used for the split-second before GPS loads
  const defaultCenter = { lat: 7.8731, lng: 80.7718 }; 

  return (
    <div className="w-full h-full relative bg-[#F5F7F6]">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
        <Map 
          defaultZoom={7.3} 
          defaultCenter={defaultCenter} 
          mapId="VOLTHIVE_MAP_ID" 
          disableDefaultUI={true} 
          gestureHandling="greedy"
          // Completely removed minZoom, maxZoom, and restrictions!
        >
          
          {/* This triggers the fly-to-user animation */}
          <CameraHandler location={userLocation} />
          
          {/* 1. USER LOCATION MARKER (Custom Car Image) */}
          {userLocation && (
            <AdvancedMarker position={userLocation} zIndex={100}>
              <div className="relative flex items-center justify-center">
                {/* Pulsing GPS Radar Effect */}
                <div className="absolute w-24 h-24 bg-[#5FAFC0]/24 rounded-full animate-ping pointer-events-none" />
                <div className="absolute w-12 h-12 bg-[#5FAFC0]/32 rounded-full pointer-events-none" />
                
                {/* Custom Car Image */}
                <img 
                  src="/icons/car.png" 
                  alt="My Car" 
                  className="w-14 h-14 object-contain drop-shadow-2xl relative z-10" 
                />
              </div>
            </AdvancedMarker>
          )}

          {/* 2. STATION MARKERS (Custom Charging Station Image) */}
          {stations.map((station) => {
            const isBestValue = station._id === bestValueId;

            return (
              <AdvancedMarker 
                key={station._id} 
                position={{ lat: station.location.coordinates[1], lng: station.location.coordinates[0] }}
                onClick={() => onMarkerClick(station)}
                zIndex={isBestValue ? 50 : 10}
              >
                <div className={`relative flex flex-col items-center group cursor-pointer transition-transform ${isBestValue ? 'scale-125' : 'hover:scale-110'}`}>
                  
                  {/* Floating Price Tag */}
                  <div className={`absolute -top-8 px-3 py-1 rounded-full shadow-lg text-[11px] font-bold border transition-colors whitespace-nowrap ${isBestValue ? 'bg-(--ui-success) border-(--brand-green-deep) text-white shadow-[0_8px_20px_rgba(108,181,103,0.45)]' : 'bg-white border-(--brand-border) text-(--brand-ink) shadow-black/10 group-hover:border-(--accent-blue) group-hover:text-(--brand-blue)'}`}>
                    {station.pricePerKWh} LKR
                  </div>

                  {/* Custom Station Image */}
                  <img 
                    src="/icons/station.png" 
                    alt="Charging Station" 
                    className={`w-12 h-12 object-contain transition-all ${isBestValue ? 'drop-shadow-[0_10px_20px_rgba(108,181,103,0.5)]' : 'drop-shadow-md group-hover:drop-shadow-xl'}`} 
                  />
                  
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
}