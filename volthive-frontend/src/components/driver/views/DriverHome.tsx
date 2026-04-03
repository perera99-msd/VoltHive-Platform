'use client';
import { useAuth } from '../../../context/AuthContext';

export default function DriverHome({ onBookNow }: { onBookNow: () => void }) {
  const { user } = useAuth();
  
  // Extract first name
  const firstName = user?.displayName?.split(' ')[0] || 'Driver';

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <header className="flex items-end justify-between">
        <div>
          <p className="text-(--brand-muted) font-bold tracking-widest text-[11px] mb-1.5 uppercase">Overview</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-(--brand-ink) tracking-tight">
            Good morning, {firstName}.
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/60 border border-(--brand-border) rounded-lg shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-(--brand-ink) uppercase tracking-wide">Network Online</span>
        </div>
      </header>

      {/* --- PRIORITY 1: UPCOMING RESERVATION (Smart Context) --- */}
      {/* In a real app, this only renders if they have a pending booking today */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-(--brand-green)/30 shadow-[0_8px_30px_rgba(108,181,103,0.12)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group cursor-pointer transition-all hover:shadow-[0_8px_30px_rgba(108,181,103,0.2)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-(--brand-green)/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-(--brand-green)/10 flex items-center justify-center text-(--brand-green) border border-(--brand-green)/20 shrink-0">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-(--brand-green) text-white">Upcoming</span>
              <span className="text-sm font-semibold text-(--brand-ink)">Today, 2:30 PM</span>
            </div>
            <h3 className="text-[15px] font-semibold text-(--brand-ink)">Colombo Fast Charge 19</h3>
            <p className="text-xs font-medium text-(--brand-muted)">Random Street 19, Colombo</p>
          </div>
        </div>

        <button className="w-full sm:w-auto px-5 py-2.5 bg-white border border-(--brand-border) text-(--brand-ink) text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors relative z-10">
          View Details
        </button>
      </div>

      {/* --- PRIORITY 2: HERO ACTION --- */}
      <div className="bg-gradient-to-br from-(--brand-blue-deep) to-(--brand-green) rounded-[2rem] p-8 sm:p-10 text-white shadow-xl shadow-[color:var(--accent-blue)]/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-light mb-3">Need a charge?</h2>
          <p className="text-white/80 mb-8 max-w-sm text-[15px] leading-relaxed">
            There are currently 12 fast chargers available within a 5km radius of your location.
          </p>
          <button onClick={onBookNow} className="bg-white text-(--brand-ink) px-6 py-3.5 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center sm:justify-start gap-2 shadow-lg w-full sm:w-auto">
            Open Live Map
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </button>
        </div>
      </div>

      {/* --- PRIORITY 3: EXPANDED STATS GRID (Gamification) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Energy */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-(--brand-border) shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-(--brand-blue) mb-3"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-1">Energy Drawn</p>
          <p className="text-2xl font-light text-(--brand-ink)">142 <span className="text-xs font-semibold text-(--brand-muted)">kWh</span></p>
        </div>

        {/* Charging Sessions */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-(--brand-border) shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-(--brand-muted) mb-3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" /></svg>
          <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-1">Sessions</p>
          <p className="text-2xl font-light text-(--brand-ink)">12</p>
        </div>

        {/* Money Saved (vs Gas) */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-(--brand-border) shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-(--brand-green)/10 rounded-full blur-xl" />
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-(--brand-green) mb-3"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V4.22c0-.756-.728-1.294-1.453-1.096a59.769 59.769 0 01-15.797 2.101c-.727.198-1.453-.342-1.453-1.096v14.522c0 .756.728 1.294 1.453 1.096z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11.25v.75" /></svg>
          <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-1">Est. Savings</p>
          <p className="text-2xl font-light text-(--brand-ink)"><span className="text-[13px] font-semibold text-(--brand-muted)">Rs.</span> 14.5<span className="text-[13px] font-semibold text-(--brand-muted)">k</span></p>
        </div>

        {/* CO2 Offset */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-(--brand-border) shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-500 mb-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67m0 0a9 9 0 01-10.275-4.831M7.5 14.25v-2.5m6 5.75v-1.5" /></svg>
          <p className="text-(--brand-muted) text-[10px] font-bold uppercase tracking-widest mb-1">CO₂ Reduced</p>
          <p className="text-2xl font-light text-(--brand-ink)">86 <span className="text-xs font-semibold text-(--brand-muted)">kg</span></p>
        </div>

      </div>

      {/* --- PRIORITY 4: RECENT STATIONS --- */}
      <div>
        <h3 className="text-xs font-bold text-(--brand-muted) uppercase tracking-[0.15em] mb-4 ml-2">Jump Back In</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Recent Card 1 */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-(--brand-border) shadow-sm flex items-center justify-between group hover:bg-white transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-(--brand-muted) border border-slate-200">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
              </div>
              <div>
                <p className="font-semibold text-[14px] text-(--brand-ink)">Bambalapitiya Charge Hub</p>
                <p className="text-[12px] text-(--brand-muted)">Used 3 days ago</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-(--brand-ink) group-hover:bg-(--brand-ink) group-hover:text-white transition-colors">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </div>
          </div>

          {/* Recent Card 2 */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-(--brand-border) shadow-sm flex items-center justify-between group hover:bg-white transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-(--brand-muted) border border-slate-200">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
              </div>
              <div>
                <p className="font-semibold text-[14px] text-(--brand-ink)">Galle Road Fast Port</p>
                <p className="text-[12px] text-(--brand-muted)">Used last week</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-(--brand-ink) group-hover:bg-(--brand-ink) group-hover:text-white transition-colors">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}