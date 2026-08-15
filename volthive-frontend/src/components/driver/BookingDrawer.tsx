'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { apiUrl } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { useLiveEvents } from '../../context/LiveEventsContext';
import BookingConfirmModal from './BookingConfirmModal';
import Toast from '../common/Toast';

interface Station {
  _id: string;
  name?: string;
  stationName?: string;
  address?: string;
  phone?: string;
  pricePerKWh?: number;
  basePricePerKwh?: number;
  location: { coordinates: [number, number] };
  chargers?: { _id: string; plugType: string; powerKW: number; status: string }[];
}

interface BookingDrawerProps {
  station: Station | null;
  onClose: () => void;
  onMessageClick?: (stationId: string) => void;
  isGuest?: boolean;
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

// Map a charger DB status to a read-only status badge (driver station card).
const getChargerStatusInfo = (status: string) => {
  const s = String(status || '').toUpperCase();
  if (s === 'AVAILABLE') return { label: 'Ready', cls: 'bg-(--ui-success)/15 text-(--ui-success) border-(--ui-success)/30', dot: 'bg-(--ui-success)' };
  if (s === 'PENDING_APPROVAL' || s === 'RESERVED') return { label: 'Booked', cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30', dot: 'bg-amber-500' };
  if (s === 'CHARGING') return { label: 'Charging', cls: 'bg-(--brand-blue)/15 text-(--brand-blue) border-(--brand-blue)/30', dot: 'bg-(--brand-blue) animate-pulse' };
  if (s === 'OFFLINE') return { label: 'Offline', cls: 'bg-(--ui-error)/10 text-(--ui-error) border-(--ui-error)/20', dot: 'bg-(--ui-error)' };
  return { label: status || 'Unknown', cls: 'bg-(--surface-soft) text-(--brand-muted) border-(--brand-border)', dot: 'bg-(--brand-muted)' };
};

export default function BookingDrawer({ station, onClose, onMessageClick, isGuest = false }: BookingDrawerProps) {
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'error' | 'success' | 'info' } | null>(null);

  // Prefill the driver's contact details from their profile (mandatory for booking)
  useEffect(() => {
    if (isGuest) return;
    const prefill = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch(apiUrl('/api/users/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const profile = await res.json();
          setContactPhone(profile.telephone || profile.mobile || '');
          setContactName(profile.name || auth.currentUser?.displayName || '');
        }
      } catch (err) {
        console.warn('Could not prefill contact details:', err);
      }
    };
    prefill();
  }, [isGuest]);

  const fetchExistingBookings = useCallback(async () => {
    if (isGuest || !station?._id) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(apiUrl(`/api/bookings/station/${station._id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setExistingBookings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch existing bookings:', error);
    }
  }, [isGuest, station?._id]);

  // Refresh slot availability while the drawer is open so bookings made by
  // other drivers are reflected (real DB data stays current).
  // Live path: follow the station and refresh instantly on availability events.
  // Fallback: slow 60s poll as a self-healing safety net.
  const { subscribe, followStation, unfollowStation } = useLiveEvents();

  useEffect(() => {
    if (isGuest || !station?._id) return;
    fetchExistingBookings();
    const interval = setInterval(fetchExistingBookings, 60000);
    return () => clearInterval(interval);
  }, [fetchExistingBookings, isGuest, station?._id]);

  // Follow the open station for instant availability updates (and unfollow on
  // close / station switch). Only active for authenticated (non-guest) users.
  useEffect(() => {
    if (isGuest || !station?._id) return;
    let cancelled = false;
    followStation(station._id);
    const unsub = subscribe('availability.updated', (_event, data) => {
      if (cancelled) return;
      if (data && String(data.stationId) === String(station?._id)) {
        fetchExistingBookings();
      }
    });
    return () => {
      cancelled = true;
      unsub();
      unfollowStation(station._id);
    };
  }, [station?._id, isGuest, subscribe, followStation, unfollowStation, fetchExistingBookings]);

  // Reset the per-station booking flow when switching stations so the previous
  // station's wizard/success flash/pending auto-close never leaks into the next.
  useEffect(() => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    setIsBooking(false);
    setBookingSuccess(false);
    setShowBookingModal(false);
  }, [station?._id]);

  if (!station) return null;

  const stationData = station as MatchedStation;

  const chargersList = station.chargers || [];
  const availableChargersList = chargersList.filter(
    c => c.status === 'Available' || c.status === 'AVAILABLE'
  );
  const availableChargers = availableChargersList.length;
  const totalChargers = chargersList.length;

  const displayName = station.name || station.stationName || 'VoltHive Station';
  // Prefer the server-provided LIVE per-charger rate (AI + TOU aware).
  const chargerLiveRate = (c: unknown): number => {
    const rec = (c as Record<string, unknown>) || {};
    const currentRate = Number(rec.currentRate);
    const pricePerKWh = Number(rec.pricePerKWh);
    const rate = Number(rec.rate);
    if (currentRate > 0) return currentRate;
    if (pricePerKWh > 0) return pricePerKWh;
    if (rate > 0) return rate;
    return 0;
  };

  const displayPrice = Number(station.pricePerKWh) > 0 ? Number(station.pricePerKWh) : (stationData.currentDynamicPrice ?? station.basePricePerKwh ?? 85);
  const chargerRates = chargersList.map(c => chargerLiveRate(c) || displayPrice);
  const avgRate = chargerRates.length > 0
    ? Math.round(chargerRates.reduce((a, b) => a + b, 0) / chargerRates.length)
    : displayPrice;
  const routeDistance = stationData.routeData?.distanceKm ?? null;
  const driveTime = stationData.routeData?.driveTimeMins ?? null;

  const handleSecureReservation = async (bookingData: {
    date: string;
    startTime: string;
    endTime: string;
    chargerId: string;
  }) => {
    if (!station || !station.chargers || station.chargers.length === 0) {
      setToastMessage({ msg: "No hardware found.", type: 'error' });
      return;
    }

    if (!bookingData.chargerId) {
      setToastMessage({ msg: "Please select a charger to proceed.", type: 'error' });
      return;
    }

    // Contact phone is mandatory so the station can reach the driver
    const phone = contactPhone.trim();
    if (!phone) {
      setToastMessage({ msg: "A contact phone number is required so the station can confirm your booking.", type: 'error' });
      return;
    }

    const selectedCharger = station.chargers.find(c => c._id === bookingData.chargerId);
    if (!selectedCharger) {
      setToastMessage({ msg: "Selected charger not found.", type: 'error' });
      return;
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
        lockedPricePerKwh: chargerLiveRate(selectedCharger) || avgRate,
        customerName: contactName.trim() || auth.currentUser?.displayName || '',
        customerPhone: phone
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

      if (data.success) {
        setBookingSuccess(true);
        setShowBookingModal(false);
        setToastMessage({ msg: "Reservation request submitted to station!", type: 'success' });

        // No client auto-cancel: the station owner must approve within 15 minutes,
        // otherwise the server marks the booking as Expired (record is kept).
        if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
        autoCloseTimer.current = setTimeout(() => {
          setBookingSuccess(false);
          onClose();
        }, 2500);
      } else {
        setToastMessage({ msg: data.message || "Failed to book slot.", type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToastMessage({ msg: "System Error. Please try again.", type: 'error' });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom))] md:inset-0 z-40 flex items-end md:items-center justify-center p-3 md:p-6 font-sans pointer-events-none">
      
      {/* Click outside overlay without dark background or blur on map */}
      <div 
        className="absolute inset-0 pointer-events-auto cursor-pointer"
        onClick={onClose}
      />

      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative pointer-events-auto w-full max-w-[420px] bg-(--brand-card)/95 backdrop-blur-3xl rounded-3xl shadow-[0_24px_60px_-15px_rgba(9,32,52,0.5)] border border-(--brand-border) flex flex-col max-h-[68dvh] md:max-h-[82dvh] overflow-hidden vh-rise-in text-(--brand-ink)"
      >
        
        <div className="flex justify-between items-center p-4 pb-2 shrink-0 z-10 relative border-b border-(--brand-border)/30">
          <div className="w-10 h-1 bg-(--brand-muted)/30 rounded-full md:hidden absolute left-1/2 -translate-x-1/2 top-2.5" />
          <div className="flex items-center gap-2">
            {availableChargers > 0 ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-(--ui-success)/15 text-(--ui-success) text-[10px] font-extrabold uppercase tracking-widest border border-(--ui-success)/30">
                <span className="w-1.5 h-1.5 rounded-full bg-(--ui-success) animate-pulse" />
                {availableChargers} / {totalChargers} Ready
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-(--ui-error)/15 text-(--ui-error) text-[10px] font-extrabold uppercase tracking-widest border border-(--ui-error)/30">
                <span className="w-1.5 h-1.5 rounded-full bg-(--ui-error)" />
                Station Full
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-(--surface-soft) hover:bg-(--surface-tint) text-(--brand-muted) hover:text-(--ui-error) rounded-full flex items-center justify-center ml-auto border border-(--brand-border) transition-all cursor-pointer"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative z-0">
          
          <div className="mb-4 relative">
            <h2 className="text-xl md:text-2xl font-bold text-(--brand-ink) tracking-tight leading-tight mb-1.5">
              {displayName}
            </h2>
            
            <p className="text-(--brand-muted) text-xs flex items-start gap-1.5 leading-relaxed font-medium">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0 text-(--brand-blue) opacity-80 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {station.address || 'Location provided on map'}
            </p>

            {(routeDistance || driveTime) && (
              <div className="flex items-center gap-2.5 mt-2.5 text-[11px] font-bold">
                {routeDistance && <span className="text-(--brand-blue) bg-(--brand-blue)/10 px-2 py-0.5 rounded-lg border border-(--brand-blue)/20">{routeDistance} km away</span>}
                {driveTime && <span className="text-(--brand-muted) bg-(--surface-soft) px-2 py-0.5 rounded-lg border border-(--brand-border)">~{driveTime} min drive</span>}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${station.location.coordinates[1]},${station.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-(--brand-blue)/12 hover:bg-(--brand-blue)/20 text-(--brand-blue) rounded-xl text-xs font-bold border border-(--brand-blue)/25 transition-all"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Directions
              </a>

              <button
                type="button"
                onClick={() => {
                  if (onMessageClick) {
                    onMessageClick(station._id);
                    onClose();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-(--brand-green)/12 hover:bg-(--brand-green)/20 text-(--brand-green-deep) rounded-xl text-xs font-bold border border-(--brand-green)/25 transition-all cursor-pointer"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Message
              </button>

              <a 
                href={station.phone ? `tel:${station.phone}` : '#'}
                onClick={station.phone ? undefined : (e) => e.preventDefault()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-(--surface-soft) hover:bg-(--surface-tint) text-(--brand-ink) rounded-xl text-xs font-bold border border-(--brand-border) transition-all"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.041l-3.286-.47a1.125 1.125 0 00-1.073.436l-2.276 3.034c-2.126-1.01-3.951-2.835-4.96-4.96l3.034-2.276a1.125 1.125 0 00.436-1.073l-.47-3.286c-.075-.512-.525-.864-1.041-.864H4.5a2.25 2.25 0 00-2.25 2.25z" />
                </svg>
                {station.phone ? 'Call' : 'No Contact'}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="col-span-2 bg-(--brand-card) p-3.5 rounded-xl border border-(--brand-border) flex items-center justify-between">
              <div>
                <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-0.5">Average Rate</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tighter text-(--brand-ink)">{avgRate > 0 ? avgRate : '—'}</span>
                  <span className="text-xs font-bold text-(--brand-muted)">{avgRate > 0 ? 'LKR / kWh' : ''}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-(--accent-blue)/14 flex items-center justify-center text-(--brand-blue)">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-widest mb-2 ml-1">Select a Charger</h3>
            <div className="grid grid-cols-1 gap-2">
              {chargersList.length > 0 ? chargersList.map((charger, idx) => {
                const statusInfo = getChargerStatusInfo(charger.status);
                const chargerRate = chargerLiveRate(charger) || avgRate;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border bg-(--brand-card) border-(--brand-border) text-left relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold bg-(--accent-blue)/16 text-(--brand-blue)">
                          0{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-(--brand-ink)">
                            {charger.plugType || 'Charger'} • <span className="font-extrabold text-(--brand-green-deep)">{charger.powerKW} kW</span> • <span className="font-bold text-(--brand-blue)">LKR {chargerRate}/kWh</span>
                          </p>
                        </div>
                      </div>

                      <div className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${statusInfo.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="bg-(--surface-soft) p-4 rounded-xl text-center border border-(--brand-border)">
                  <p className="text-xs text-(--brand-muted) font-medium">No charger details available for this station.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating action bar inside card */}
        <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-(--brand-border)/40 bg-(--brand-card) z-20">
          {isGuest ? (
            <Link 
              href="/driver-login"
              className="w-full py-3 rounded-xl font-bold text-xs shadow-sm flex justify-center items-center gap-2 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white hover:brightness-105 transition-all cursor-pointer"
            >
              <span>Sign in to Reserve Slot</span>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </Link>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-(--surface-soft) border border-(--brand-border)">
                <span className="text-(--brand-muted) text-xs shrink-0">📞</span>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Contact phone (required for booking)"
                  className="w-full bg-transparent text-xs font-semibold text-(--brand-ink) outline-none placeholder:text-(--brand-muted)/60"
                />
              </div>
              <button 
                onClick={() => setShowBookingModal(true)}
                disabled={isBooking || bookingSuccess || availableChargers === 0}
                className={`w-full py-3 rounded-xl font-bold text-xs shadow-sm flex justify-center items-center gap-2 transition-all cursor-pointer ${
                  bookingSuccess 
                    ? 'bg-(--ui-success) text-white' 
                    : availableChargers === 0
                    ? 'bg-(--surface-soft) text-(--brand-muted) cursor-not-allowed border border-(--brand-border)'
                    : 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white hover:brightness-105 active:scale-[0.98]'
                }`}
              >
                <span className="font-bold">
                  {isBooking ? 'Securing Slot...' : bookingSuccess ? 'Slot Confirmed!' : availableChargers === 0 ? 'Station Full' : 'Reserve Slot'}
                </span>
                
                {!isBooking && !bookingSuccess && availableChargers > 0 && (
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

      </div>

      {showBookingModal && !isGuest && (
        <BookingConfirmModal
          stationName={displayName}
          address={station.address || 'Location provided on map'}
          chargers={station.chargers || []}
          existingBookings={existingBookings}
          onConfirmBooking={handleSecureReservation}
          onCancel={() => setShowBookingModal(false)}
          isLoading={isBooking}
        />
      )}
      <Toast
        message={toastMessage?.msg || null}
        type={toastMessage?.type || 'error'}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}