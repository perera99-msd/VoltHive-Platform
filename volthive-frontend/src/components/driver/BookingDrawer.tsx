'use client';

interface Station {
  _id: string;
  name: string;
  address: string;
  pricePerKWh: number;
  location: { coordinates: [number, number] }; // GeoJSON uses [Longitude, Latitude]
  chargers: { plugType: string; powerKW: number; status: string }[];
}

interface BookingDrawerProps {
  station: Station | null;
  onClose: () => void;
}

export default function BookingDrawer({ station, onClose }: BookingDrawerProps) {
  if (!station) return null;

  // Smart metrics extraction
  const availableChargers = station.chargers.filter(c => c.status === 'Available').length;
  const totalChargers = station.chargers.length;
  const maxPower = Math.max(...station.chargers.map(c => c.powerKW));
  const plugTypes = Array.from(new Set(station.chargers.map(c => c.plugType)));

  return (
    <>
      {/* BACKGROUND DIMMER */}
      <div 
        className="fixed inset-0 bg-(--accent-blue)/12 backdrop-blur-[2px] z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* THE SMART DRAWER */}
      <div className="fixed z-50 flex flex-col bg-white/85 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.12)] transition-transform duration-500 ease-out animate-in
                      /* --- MOBILE: Bottom Sheet --- */
                      bottom-0 left-0 right-0 h-[85dvh] rounded-t-[2.5rem] slide-in-from-bottom-full
                      /* --- DESKTOP: Right Edge Panel --- */
                      md:top-0 md:bottom-0 md:right-0 md:left-auto md:w-[440px] md:h-[100dvh] md:rounded-l-[2.5rem] md:rounded-tr-none md:border-l md:border-white/50 md:slide-in-from-right-full">
        
        {/* Header / Drag Handle & Close Button */}
        <div className="flex justify-center md:justify-between items-center p-6 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-(--brand-border) rounded-full md:hidden" />
          <div className="hidden md:block" /> 
          
          <button 
            onClick={onClose}
            className="hidden md:flex w-8 h-8 bg-(--accent-blue)/12 hover:bg-(--accent-blue)/20 text-(--brand-muted) rounded-full items-center justify-center transition-colors"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-40 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          
          {/* Station Identity */}
          <div className="mb-8 mt-2">
            <div className="flex items-center gap-2 mb-3">
              {availableChargers > 0 ? (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-widest border border-emerald-100/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {availableChargers} of {totalChargers} Available
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--accent-blue)/10 text-(--brand-muted) text-[11px] font-bold uppercase tracking-widest border border-(--brand-border)">
                  <span className="w-1.5 h-1.5 rounded-full bg-(--brand-muted)" />
                  Currently Full
                </span>
              )}
            </div>
            
            <h2 className="text-[32px] font-semibold text-(--brand-ink) tracking-tight leading-tight mb-3">
              {station.name}
            </h2>
            
            <p className="text-(--brand-muted) text-[15px] flex items-start gap-2 leading-relaxed">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0 text-(--brand-muted) mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {station.address}
            </p>

            {/* --- NEW: QUICK ACTIONS ROW --- */}
            <div className="flex items-center gap-3 mt-6">
              
              {/* 1. Get Directions (Dynamically builds a Google Maps URL using Lat/Lng) */}
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${station.location.coordinates[1]},${station.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-(--accent-blue)/14 hover:bg-(--accent-blue)/24 text-(--brand-blue) rounded-2xl text-[13px] font-bold transition-all border border-(--accent-blue)/28"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Directions
              </a>

              {/* 2. Contact Owner (Opens phone dialer) */}
              <a 
                href="tel:0112345678" // You can replace this with actual DB data later like station.owner.phone
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white hover:bg-(--accent-blue)/8 text-(--brand-muted) rounded-2xl text-[13px] font-bold transition-all border border-(--brand-border) shadow-sm"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-muted)">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.041l-3.286-.47a1.125 1.125 0 00-1.073.436l-2.276 3.034c-2.126-1.01-3.951-2.835-4.96-4.96l3.034-2.276a1.125 1.125 0 00.436-1.073l-.47-3.286c-.075-.512-.525-.864-1.041-.864H4.5a2.25 2.25 0 00-2.25 2.25z" />
                </svg>
                Contact
              </a>
            </div>

          </div>

          {/* Premium Bento Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            
            {/* Price - Full Width Hero Card */}
            <div className="col-span-2 bg-white/60 p-5 rounded-3xl border border-(--brand-border) shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-end justify-between">
              <div>
                <p className="text-(--brand-muted) text-[11px] font-bold uppercase tracking-widest mb-1">Charging Rate</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-light tracking-tighter text-(--brand-ink)">{station.pricePerKWh}</span>
                  <span className="text-sm font-semibold text-(--brand-muted)">LKR / kWh</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#5FAFC0]/14 flex items-center justify-center text-(--brand-blue) mb-1">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Max Power Card */}
            <div className="bg-white/60 p-5 rounded-3xl border border-(--brand-border) shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-(--brand-muted) mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-0.5">Max Output</p>
              <p className="text-2xl font-light text-(--brand-ink)">{maxPower} <span className="text-sm font-semibold text-(--brand-muted)">kW</span></p>
            </div>

            {/* Connectors Card */}
            <div className="bg-white/60 p-5 rounded-3xl border border-(--brand-border) shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-(--brand-muted) mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
              <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-2">Connectors</p>
              <div className="flex flex-wrap gap-1.5">
                {plugTypes.map(plug => (
                  <span key={plug} className="px-2 py-1 bg-[#5FAFC0]/10 text-(--brand-muted) text-xs font-semibold rounded border border-(--brand-border)">
                    {plug}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Hardware Network (Minimalist List) */}
          <div className="mb-8">
            <h3 className="text-[11px] font-bold text-(--brand-muted) uppercase tracking-widest mb-3 ml-1">Hardware Status</h3>
            <div className="bg-white/60 rounded-3xl border border-(--brand-border) shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              {station.chargers.map((charger, idx) => (
                <div key={idx} className={`flex items-center justify-between p-4 ${idx !== station.chargers.length - 1 ? 'border-b border-(--brand-border)' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold text-(--brand-muted) w-6">
                      0{idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-(--brand-ink) text-[15px]">{charger.plugType}</p>
                      <p className="text-xs font-medium text-(--brand-muted)">{charger.powerKW} kW Fast Charge</p>
                    </div>
                  </div>
                  {charger.status === 'Available' ? (
                     <span className="text-emerald-600 font-semibold text-sm">
                       Available
                     </span>
                  ) : (
                    <span className="text-(--brand-muted) font-medium text-sm">
                      In Use
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* FIXED BOTTOM ACTION BAR */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-white via-white/95 to-transparent rounded-b-[2.5rem]">
          <button 
            className="w-full py-4 rounded-2xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-semibold text-[15px] hover:brightness-105 transition-all active:scale-[0.98] shadow-lg shadow-[color:var(--accent-blue)]/25 flex justify-center items-center gap-2"
          >
            Reserve Slot
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

      </div>
    </>
  );
}