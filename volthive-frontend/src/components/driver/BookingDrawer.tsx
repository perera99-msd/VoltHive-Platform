'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from '../../lib/api';
import { auth } from '../../lib/firebase';
import BookingConfirmModal from './BookingConfirmModal';

interface Station {
  _id: string;
  name?: string;
  stationName?: string;
  address?: string;
  pricePerKWh?: number;
  basePricePerKwh?: number;
  location: { coordinates: [number, number] };
  chargers?: { _id: string; plugType: string; powerKW: number; status: string }[];
}

interface BookingDrawerProps {
  station: Station | null;
  onClose: () => void;
}

type MatchedStation = Station & {
  currentDynamicPrice?: number;
  routeData?: {
    distanceKm?: string;
    driveTimeMins?: number;
  };
};

interface ExistingBooking {
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  driverName?: string;
}

export default function BookingDrawer({ station, onClose }: BookingDrawerProps) {
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null);

  // Fetch existing bookings when station changes
  useEffect(() => {
    const fetchExistingBookings = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch(apiUrl(`/api/bookings/station/${station?._id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success && data.data) {
          setExistingBookings(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch existing bookings:', error);
      }
    };

    if (station?._id) {
      fetchExistingBookings();
    }
  }, [station?._id]);

  if (!station) return null;

  const stationData = station as MatchedStation;

  // --- DATA EXTRACTION ---
  const chargersList = station.chargers || [];
  const availableChargersList = chargersList.filter(
    c => c.status === 'Available' || c.status === 'AVAILABLE'
  );
  const availableChargers = availableChargersList.length;
  const totalChargers = chargersList.length;

  const displayName = station.name || station.stationName || 'VoltHive Station';
  const displayPrice = stationData.currentDynamicPrice ?? station.pricePerKWh ?? 85;
  const routeDistance = stationData.routeData?.distanceKm ?? null;
  const driveTime = stationData.routeData?.driveTimeMins ?? null;

  // --- BOOKING LOGIC ---
  const handleSecureReservation = async (bookingData: {
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    if (!station || !station.chargers || station.chargers.length === 0) {
      return alert("No hardware found.");
    }

    if (!selectedChargerId) {
      return alert("Please select a charger to proceed.");
    }

    const selectedCharger = station.chargers.find(c => c._id === selectedChargerId);
    if (!selectedCharger) {
      return alert("Selected charger not found.");
    }

    setIsBooking(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const payload = {
        stationId: station._id,
        chargerId: selectedCharger._id,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        lockedPricePerKwh: displayPrice
      };

      const response = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setBookingSuccess(true);
        setShowBookingModal(false);
        
        // Auto-cancel after 3 minutes if owner doesn't respond
        const bookingId = data.data?._id;
        setTimeout(async () => {
          try {
            await fetch(apiUrl(`/api/bookings/${bookingId}/auto-cancel`), {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (error) {
            console.error('Failed to auto-cancel booking:', error);
          }
        }, 3 * 60 * 1000); // 3 minutes

        setTimeout(() => {
          setBookingSuccess(false);
          onClose();
        }, 2500);
      } else {
        alert(data.message || "Failed to book");
      }
    } catch (err) {
      console.error(err);
      alert("System Error. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 font-sans">
      
      {/* 1. ATMOSPHERIC BACKGROUND DIMMER */}
      <div 
        className="absolute inset-0 bg-(--brand-ink)/30 backdrop-blur-md transition-opacity duration-500 ease-(--ease-premium)"
        onClick={onClose}
      />

      {/* 2. THE 9:16 PREMIUM GLASS CARD */}
      <div 
        className="relative w-full max-w-105 bg-linear-to-br from-(--brand-card)/95 to-(--brand-card)/60 backdrop-blur-3xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.2)] border border-(--brand-border)/60 flex flex-col h-[90dvh] md:h-[85dvh] max-h-212.5 overflow-hidden vh-rise-in"
      >
        
        {/* Header / Close Button Area */}
        <div className="flex justify-center md:justify-end items-center p-5 pb-0 shrink-0 z-10 relative">
          <div className="w-12 h-1.5 bg-(--brand-muted)/30 rounded-full md:hidden absolute left-1/2 -translate-x-1/2 top-4" />
          <button 
            onClick={onClose}
            className="w-9 h-9 bg-(--background)/50 backdrop-blur-md hover:bg-(--brand-border) text-(--brand-muted) hover:text-(--ui-error) rounded-full flex items-center justify-center ml-auto border border-(--brand-border)/50 shadow-sm hover:scale-105 transition-all"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* SCROLLABLE GLASS CONTENT */}
        <div className="flex-1 overflow-y-auto px-7 pb-36 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative z-0">
          
          <div className="mb-6 relative">
            <div className="flex items-center gap-2.5 mb-5">
              {availableChargers > 0 ? (
                <span className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-linear-to-r from-(--ui-success)/20 to-(--ui-success)/10 text-(--ui-success) text-[10px] font-bold uppercase tracking-widest border border-(--ui-success)/30 backdrop-blur-sm shadow-[0_2px_8px_rgba(16,185,129,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-(--ui-success) animate-pulse shadow-[0_0_6px_var(--ui-success)]" />
                  {availableChargers} of {totalChargers} Ready
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-linear-to-r from-(--ui-error)/20 to-(--ui-error)/10 text-(--ui-error) text-[10px] font-bold uppercase tracking-widest border border-(--ui-error)/30 backdrop-blur-sm shadow-[0_2px_8px_rgba(239,68,68,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-(--ui-error)" />
                  Station Full
                </span>
              )}
            </div>
            
            <h2 className="text-3xl md:text-[36px] font-bold text-(--brand-ink) tracking-tight leading-tight mb-2.5">
              {displayName}
            </h2>
            
            <p className="text-(--brand-muted) text-[14px] flex items-start gap-2 leading-relaxed font-medium">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 shrink-0 text-(--brand-blue) opacity-70 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {station.address || 'Location provided on map'}
            </p>

            {(routeDistance || driveTime) && (
              <div className="flex items-center gap-3 mt-3 text-sm">
                {routeDistance && <span className="font-bold text-(--brand-blue)">{routeDistance} km</span>}
                {routeDistance && driveTime && <span className="text-(--brand-muted)/40">•</span>}
                {driveTime && <span className="text-(--brand-muted)">{driveTime} min drive</span>}
              </div>
            )}

            <div className="flex items-center gap-3 mt-6">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${station.location.coordinates[1]},${station.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-linear-to-br from-(--brand-blue)/15 to-(--brand-green)/5 hover:from-(--brand-blue)/25 hover:to-(--brand-green)/15 text-(--brand-blue) rounded-xl text-[13px] font-bold border border-(--brand-blue)/20 transition-all shadow-sm backdrop-blur-md"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Directions
              </a>

              <a 
                href="tel:0112345678" 
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-(--brand-border)/50 text-(--brand-ink) hover:text-(--brand-blue) rounded-xl text-[13px] font-bold border border-(--brand-border)/60 transition-all shadow-sm backdrop-blur-md"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.041l-3.286-.47a1.125 1.125 0 00-1.073.436l-2.276 3.034c-2.126-1.01-3.951-2.835-4.96-4.96l3.034-2.276a1.125 1.125 0 00.436-1.073l-.47-3.286c-.075-.512-.525-.864-1.041-.864H4.5a2.25 2.25 0 00-2.25 2.25z" />
                </svg>
                Contact
              </a>
            </div>

            {/* Status Confidence Warning */}
            <div className="mt-5 p-3.5 bg-(--ui-warning)/8 border border-(--ui-warning)/20 rounded-xl backdrop-blur-sm">
              <p className="text-[11px] text-(--brand-muted) leading-relaxed">
                <span className="font-bold text-(--ui-warning)">⚠️ Tip:</span> Charger status updates every minute. For confirmation, tap <span className="font-semibold">Contact</span> to connect directly with the station owner.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8 relative">
            <div className="col-span-2 bg-white/70 backdrop-blur-lg p-5 rounded-2xl border border-(--brand-border)/80 shadow-sm flex items-end justify-between transition-all hover:shadow-[0_8px_20px_rgba(74,144,164,0.12)]">
              <div>
                <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-80">Current Rate</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black tracking-tighter bg-linear-to-r from-(--brand-blue) to-(--brand-green) bg-clip-text text-transparent">{displayPrice}</span>
                  <span className="text-sm font-bold text-(--brand-muted)">LKR/kWh</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-(--brand-blue)/20 to-(--brand-green)/10 flex items-center justify-center text-(--brand-blue) shadow-sm">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-lg p-5 rounded-2xl border border-(--brand-border)/70 transition-all hover:shadow-[0_8px_20px_rgba(74,144,164,0.12)] col-span-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-(--brand-green)/15 to-(--brand-blue)/5 flex items-center justify-center mb-3">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-(--brand-green)">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </div>
              <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-2">Available Charger Types & Power</p>
              <div className="flex flex-wrap gap-2">
                {availableChargersList.length > 0 ? availableChargersList.map((charger, idx) => (
                  <span key={charger._id || `${charger.plugType}-${charger.powerKW}-${idx}`} className="px-3 py-1.5 bg-linear-to-br from-(--brand-green)/15 to-(--brand-blue)/5 text-(--brand-green) text-[11px] font-bold rounded-lg border border-(--brand-green)/30">
                    {charger.plugType} • {charger.powerKW}kW
                  </span>
                )) : <span className="text-xs text-(--brand-muted)">No available chargers</span>}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest mb-3 ml-1 opacity-80">Select a Charger</h3>
            <div className="grid grid-cols-1 gap-2.5">
              {chargersList.length > 0 ? chargersList.map((charger, idx) => {
                const isAvailable = charger.status === 'Available' || charger.status === 'AVAILABLE';
                const isSelected = selectedChargerId === charger._id;
                return (
                  <button
                    key={idx}
                    onClick={() => isAvailable && setSelectedChargerId(charger._id)}
                    disabled={!isAvailable}
                    className={`p-4 rounded-2xl border transition-all duration-300 backdrop-blur-lg text-left relative ${
                      isAvailable
                        ? isSelected
                          ? 'bg-linear-to-br from-(--brand-blue)/20 to-(--brand-green)/10 border-2 border-(--brand-blue) shadow-[0_8px_24px_rgba(74,144,164,0.2)]'
                          : 'bg-linear-to-br from-white/80 to-white/50 border border-(--brand-border)/60 shadow-sm hover:shadow-[0_8px_20px_rgba(74,144,164,0.15)] hover:border-(--brand-blue)/40 cursor-pointer'
                        : 'bg-(--background)/50 border border-(--brand-border)/30 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                                            {/* Selection Indicator */}
                                            {isAvailable && (
                                              <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                isSelected
                                                  ? 'bg-linear-to-br from-(--brand-blue) to-(--brand-green) border-(--brand-blue)'
                                                  : 'border-(--brand-border)/40 hover:border-(--brand-blue)/60'
                                              }`}>
                                                {isSelected && (
                                                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 text-white">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                  </svg>
                                                )}
                                              </div>
                                            )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            isAvailable
                              ? 'bg-linear-to-br from-(--brand-blue)/20 to-(--brand-green)/10 text-(--brand-blue)'
                              : 'bg-(--background)/50 text-(--brand-muted)/50'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className={`font-bold text-sm ${isAvailable ? 'text-(--brand-ink)' : 'text-(--brand-muted)'}`}>
                              {charger.plugType || 'Charger'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-10 mt-1">
                          <div>
                            <p className="text-xs text-(--brand-muted) font-semibold uppercase tracking-wider mb-0.5">Power</p>
                            <p className={`text-lg font-black ${isAvailable ? 'text-(--brand-green)' : 'text-(--brand-muted)/50'}`}>
                              {charger.powerKW}<span className="text-xs ml-0.5 font-bold">kW</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 whitespace-nowrap ${
                        isAvailable
                          ? 'bg-(--ui-success)/15 text-(--ui-success) border-(--ui-success)/30'
                          : 'bg-(--ui-error)/10 text-(--ui-error)/70 border-(--ui-error)/20'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-(--ui-success)' : 'bg-(--ui-error)/50'}`} />
                        {isAvailable ? 'Ready' : 'In Use'}
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="bg-(--background)/30 backdrop-blur-lg p-6 rounded-2xl text-center border border-(--brand-border)/40">
                  <p className="text-sm text-(--brand-muted) font-medium">No charger details available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. FIXED BOTTOM ACTION BAR (Gradient Glow) */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pt-8 bg-linear-to-t from-(--brand-card) via-(--brand-card)/95 to-transparent rounded-b-[2.5rem] z-20 backdrop-blur-sm">
          <button 
            onClick={() => setShowBookingModal(true)}
            disabled={isBooking || bookingSuccess || availableChargers === 0 || !selectedChargerId}
            className={`group w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] shadow-lg flex justify-center items-center gap-2 border relative overflow-hidden transition-all duration-300 ${
              bookingSuccess 
                ? 'bg-linear-to-br from-(--ui-success) to-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.35)]' 
                : availableChargers === 0 || !selectedChargerId
                ? 'bg-(--background)/60 text-(--brand-muted) cursor-not-allowed shadow-none border-(--brand-border)/40'
                : 'bg-linear-to-br from-(--brand-blue) to-(--brand-green) text-white hover:shadow-[0_16px_40px_rgba(74,144,164,0.4)] shadow-[0_8px_28px_rgba(74,144,164,0.25)] border-(--brand-blue)/30 hover:-translate-y-0.5'
            }`}
          >
            {!bookingSuccess && availableChargers > 0 && selectedChargerId && (
              <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            )}
            
            <span className="relative z-10 font-bold">
              {isBooking ? 'Securing Slot...' : bookingSuccess ? 'Slot Confirmed!' : availableChargers === 0 ? 'Station Full' : !selectedChargerId ? 'Select a Charger' : 'Secure Slot'}
            </span>
            
            {!isBooking && !bookingSuccess && availableChargers > 0 && selectedChargerId && (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            )}
            {bookingSuccess && (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 relative z-10 animate-pulse">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Booking Confirm Modal */}
      {showBookingModal && (
        <BookingConfirmModal
          stationName={displayName}
          address={station.address || 'Location provided on map'}
          pricePerKwh={displayPrice}
          onConfirmBooking={handleSecureReservation}
          onCancel={() => setShowBookingModal(false)}
          existingBookings={existingBookings}
          isLoading={isBooking}
        />
      )}
    </div>
  );
}