'use client';

interface Station {
  _id: string;
  name?: string;
  stationName?: string;
  address?: string;
  pricePerKWh?: number;
  location: { coordinates: [number, number] };
  chargers?: { plugType: string; powerKW: number; status: string }[];
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

export default function BookingDrawer({ station, onClose }: BookingDrawerProps) {
  if (!station) return null;

  const stationData = station as MatchedStation;

  // --- 100% UNTOUCHED LOGIC & DATA EXTRACTION ---
  const chargersList = station.chargers || [];
  const availableChargers = chargersList.filter(c => c.status === 'Available').length;
  const totalChargers = chargersList.length;
  const maxPower = chargersList.length > 0 ? Math.max(...chargersList.map(c => c.powerKW)) : 0;
  const plugTypes = Array.from(new Set(chargersList.map(c => c.plugType)));

  const displayName = station.name || station.stationName || 'VoltHive Station';
  const displayPrice = stationData.currentDynamicPrice ?? station.pricePerKWh ?? 85;
  const routeDistance = stationData.routeData?.distanceKm ?? null;
  const driveTime = stationData.routeData?.driveTimeMins ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 font-sans">
      
      {/* 1. ATMOSPHERIC BACKGROUND DIMMER */}
      <div 
        className="absolute inset-0 bg-(--brand-ink)/30 backdrop-blur-md transition-opacity duration-500 ease-[var(--ease-premium)]"
        onClick={onClose}
      />

      {/* 2. THE 9:16 PREMIUM GLASS CARD */}
      <div 
        className="relative w-full max-w-[420px] bg-gradient-to-br from-(--brand-card)/95 to-(--brand-card)/60 backdrop-blur-3xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.2)] border border-(--brand-border)/60 flex flex-col h-[90dvh] md:h-[85dvh] max-h-[850px] overflow-hidden vh-rise-in"
      >
        
        {/* Header / Close Button Area */}
        <div className="flex justify-center md:justify-end items-center p-5 pb-0 shrink-0 z-10 relative">
          <div className="w-12 h-1.5 bg-(--brand-muted)/30 rounded-full md:hidden absolute left-1/2 -translate-x-1/2 top-4" />
          <button 
            onClick={onClose}
            style={{ transition: 'all var(--motion-base) var(--ease-premium)' }}
            className="w-9 h-9 bg-(--background)/50 backdrop-blur-md hover:bg-(--brand-border) text-(--brand-muted) hover:text-(--ui-error) rounded-full flex items-center justify-center ml-auto border border-(--brand-border)/50 shadow-sm hover:scale-105"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* SCROLLABLE GLASS CONTENT */}
        <div className="flex-1 overflow-y-auto px-7 pb-36 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative z-0">
          
          {/* Station Identity */}
          <div className="mb-6 relative">
            <div className="flex items-center gap-2 mb-4">
              {availableChargers > 0 ? (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-(--ui-success)/20 to-(--ui-success)/5 text-(--ui-success) text-[11px] font-bold uppercase tracking-widest border border-(--ui-success)/20 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-(--ui-success) animate-pulse shadow-[0_0_8px_var(--ui-success)]" />
                  {availableChargers} of {totalChargers} Available
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-(--ui-error)/20 to-(--ui-error)/5 text-(--ui-error) text-[11px] font-bold uppercase tracking-widest border border-(--ui-error)/20 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-(--ui-error) shadow-[0_0_8px_var(--ui-error)]" />
                  Currently Full
                </span>
              )}
            </div>
            
            <h2 className="text-3xl md:text-[34px] font-bold text-(--brand-ink) tracking-tight leading-tight mb-2">
              {displayName}
            </h2>
            
            <p className="text-(--brand-muted) text-[14px] flex items-start gap-2 leading-relaxed font-medium">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0 text-(--brand-blue) opacity-80 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {station.address || 'Location provided on map'}
            </p>

            {(routeDistance || driveTime) && (
              <div className="flex items-center gap-3 mt-2 text-sm text-(--brand-muted)">
                {routeDistance && <span className="font-bold text-(--brand-blue)">{routeDistance} km</span>}
                {routeDistance && driveTime && <span className="text-(--brand-muted)">•</span>}
                {driveTime && <span>{driveTime} min</span>}
              </div>
            )}

            {/* QUICK ACTIONS ROW (Floating Glass Buttons) */}
            <div className="flex items-center gap-3 mt-6">
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${station.location.coordinates[1]},${station.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ transition: 'all var(--motion-base) var(--ease-premium)' }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-(--brand-blue)/10 hover:bg-(--brand-blue)/20 text-(--brand-blue) rounded-2xl text-[13px] font-bold border border-(--brand-blue)/20 hover:-translate-y-1 hover:shadow-lg shadow-sm backdrop-blur-md"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Directions
              </a>

              <a 
                href="tel:0112345678" 
                style={{ transition: 'all var(--motion-base) var(--ease-premium)' }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-(--background)/50 hover:bg-(--brand-border)/80 text-(--brand-ink) rounded-2xl text-[13px] font-bold border border-(--brand-border)/50 hover:-translate-y-1 hover:shadow-lg shadow-sm backdrop-blur-md"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.041l-3.286-.47a1.125 1.125 0 00-1.073.436l-2.276 3.034c-2.126-1.01-3.951-2.835-4.96-4.96l3.034-2.276a1.125 1.125 0 00.436-1.073l-.47-3.286c-.075-.512-.525-.864-1.041-.864H4.5a2.25 2.25 0 00-2.25 2.25z" />
                </svg>
                Contact
              </a>
            </div>
          </div>

          {/* Premium Glass Bento Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8 relative">
            
            {/* Charging Rate - Hero Panel */}
            <div 
               style={{ transition: 'all var(--motion-base) var(--ease-premium)' }}
               className="col-span-2 bg-(--background)/40 backdrop-blur-lg p-5 rounded-3xl border border-(--brand-border)/60 shadow-sm flex items-end justify-between hover:-translate-y-1 hover:shadow-xl hover:shadow-(--brand-blue)/5"
            >
              <div>
                <p className="text-(--brand-muted) text-[11px] font-bold uppercase tracking-widest mb-1 opacity-80">Charging Rate</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black tracking-tighter text-(--brand-ink) bg-clip-text text-transparent bg-gradient-to-br from-(--brand-ink) to-(--brand-muted)">{displayPrice}</span>
                  <span className="text-sm font-bold text-(--brand-muted)">LKR / kWh</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-(--accent-blue)/20 to-(--brand-blue)/5 flex items-center justify-center text-(--brand-blue) shadow-inner border border-(--brand-blue)/10">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>

            {/* Max Power Card */}
            <div 
               style={{ transition: 'all var(--motion-base) var(--ease-premium)' }}
               className="bg-(--background)/40 backdrop-blur-lg p-5 rounded-3xl border border-(--brand-border)/60 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-(--brand-blue)/5"
            >
              <div className="w-8 h-8 rounded-full bg-(--brand-border)/50 flex items-center justify-center mb-3">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-ink) opacity-70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-0.5 opacity-80">Max Output</p>
              <p className="text-2xl font-black text-(--brand-ink)">
                {maxPower} <span className="text-sm font-bold text-(--brand-muted)">kW</span>
              </p>
            </div>

            {/* Connectors Card */}
            <div 
               style={{ transition: 'all var(--motion-base) var(--ease-premium)' }}
               className="bg-(--background)/40 backdrop-blur-lg p-5 rounded-3xl border border-(--brand-border)/60 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-(--brand-blue)/5"
            >
              <div className="w-8 h-8 rounded-full bg-(--brand-border)/50 flex items-center justify-center mb-3">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-ink) opacity-70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </div>
              <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">Connectors</p>
              <div className="flex flex-wrap gap-1.5">
                {plugTypes.length > 0 ? plugTypes.map(plug => (
                  <span key={plug} className="px-2 py-1 bg-(--brand-card)/80 text-(--brand-ink) text-[11px] font-bold rounded-lg border border-(--brand-border) shadow-sm">
                    {plug}
                  </span>
                )) : <span className="text-xs text-(--brand-muted)">N/A</span>}
              </div>
            </div>
          </div>

          {/* Hardware Network List (Frosted Layout) */}
          <div className="mb-4">
            <h3 className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest mb-3 ml-2 opacity-80">Hardware Network</h3>
            <div className="bg-(--background)/30 backdrop-blur-xl rounded-3xl border border-(--brand-border)/60 shadow-sm overflow-hidden flex flex-col gap-[1px] bg-(--brand-border)/30">
              {chargersList.length > 0 ? chargersList.map((charger, idx) => (
                <div key={idx} className="bg-(--brand-card)/60 flex items-center justify-between p-4 hover:bg-(--brand-card)/80 transition-colors duration-300">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-(--brand-muted)/60 w-5">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-(--brand-ink) text-[14px]">{charger.plugType}</p>
                      <p className="text-[11px] font-semibold text-(--brand-muted) mt-0.5">{charger.powerKW} kW Fast Charge</p>
                    </div>
                  </div>
                  {charger.status === 'Available' ? (
                     <div className="flex items-center gap-1.5 bg-(--ui-success)/10 px-2.5 py-1 rounded-full border border-(--ui-success)/10">
                       <div className="w-1.5 h-1.5 rounded-full bg-(--ui-success)" />
                       <span className="text-(--ui-success) font-bold text-[11px] uppercase tracking-wider">Available</span>
                     </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-(--ui-error)/10 px-2.5 py-1 rounded-full border border-(--ui-error)/10">
                       <div className="w-1.5 h-1.5 rounded-full bg-(--ui-error)" />
                       <span className="text-(--ui-error) font-bold text-[11px] uppercase tracking-wider">Occupied</span>
                     </div>
                  )}
                </div>
              )) : (
                <div className="bg-(--brand-card)/60 p-5 text-sm text-(--brand-muted) font-medium text-center">No hardware details available.</div>
              )}
            </div>
          </div>

        </div>

        {/* 3. FIXED BOTTOM ACTION BAR (Gradient Glow) */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pt-8 bg-gradient-to-t from-(--brand-card) via-(--brand-card)/90 to-transparent rounded-b-[2.5rem] z-20">
          <button 
            style={{ transition: 'all var(--motion-base) var(--ease-premium)' }}
            className="group w-full py-4 rounded-2xl bg-gradient-to-r from-(--brand-blue) to-(--accent-blue) text-(--brand-card) font-bold text-[16px] active:scale-[0.98] shadow-[0_10px_25px_rgba(74,144,164,0.35)] hover:shadow-[0_15px_35px_rgba(74,144,164,0.45)] hover:-translate-y-0.5 flex justify-center items-center gap-2 border border-white/20 relative overflow-hidden"
          >
            {/* Subtle light sweep effect */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            
            <span className="relative z-10">Secure Reservation</span>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}