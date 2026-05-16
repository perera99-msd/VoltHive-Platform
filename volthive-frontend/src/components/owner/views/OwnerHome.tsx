'use client';
import { useAuth } from '../../../context/AuthContext';

export default function OwnerHome() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || 'Partner';

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-semibold text-(--brand-ink) tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-(--brand-muted) text-sm mt-1 font-medium">Welcome back, {firstName}. Here is what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-(--brand-border) rounded-lg text-sm font-semibold text-(--brand-ink) shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Report
          </button>
        </div>
      </header>

      {/* TOP METRICS (4 Columns on Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-(--brand-border) shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-(--accent-green)/10 flex items-center justify-center text-(--brand-green-deep)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-(--ui-success) bg-(--ui-success)/10 px-2 py-1 rounded-md">+14.2%</span>
          </div>
          <p className="text-(--brand-muted) text-xs font-bold uppercase tracking-widest mb-1">Today&apos;s Revenue</p>
          <p className="text-3xl font-semibold text-(--brand-ink)">LKR 42.5k</p>
        </div>

        {/* Energy Dispensed */}
        <div className="bg-white p-6 rounded-2xl border border-(--brand-border) shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-(--accent-blue)/10 flex items-center justify-center text-(--brand-blue)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-(--ui-success) bg-(--ui-success)/10 px-2 py-1 rounded-md">+5.1%</span>
          </div>
          <p className="text-(--brand-muted) text-xs font-bold uppercase tracking-widest mb-1">Energy Dispensed</p>
          <p className="text-3xl font-semibold text-(--brand-ink)">342 <span className="text-sm font-semibold text-(--brand-muted)">kWh</span></p>
        </div>

        {/* Active Sessions */}
        <div className="bg-white p-6 rounded-2xl border border-(--brand-border) shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-(--accent-blue)/10 flex items-center justify-center text-(--accent-blue)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-(--brand-muted) bg-slate-100 px-2 py-1 rounded-md">Live</span>
          </div>
          <p className="text-(--brand-muted) text-xs font-bold uppercase tracking-widest mb-1">Active Sessions</p>
          <p className="text-3xl font-semibold text-(--brand-ink)">8 <span className="text-sm font-semibold text-(--brand-muted)">/ 12 Plugs</span></p>
        </div>

        {/* Utilization */}
        <div className="bg-white p-6 rounded-2xl border border-(--brand-border) shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-(--ui-warning)/10 flex items-center justify-center text-(--ui-warning)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-(--ui-error) bg-(--ui-error)/10 px-2 py-1 rounded-md">-2.4%</span>
          </div>
          <p className="text-(--brand-muted) text-xs font-bold uppercase tracking-widest mb-1">Avg Utilization</p>
          <p className="text-3xl font-semibold text-(--brand-ink)">64<span className="text-xl">%</span></p>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT (Chart & AI Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-(--brand-border) shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6 min-h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[15px] font-bold text-(--brand-ink)">Revenue Overview</h2>
            <select className="bg-slate-50 border border-(--brand-border) text-xs font-semibold text-(--brand-ink) rounded-lg px-3 py-1.5 outline-none cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex-1 w-full bg-slate-50/50 border border-dashed border-(--brand-border) rounded-xl flex items-center justify-center text-(--brand-muted) text-sm font-medium">
            [ Interactive Chart Component Renders Here ]
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-b from-(--brand-ink) to-slate-900 rounded-2xl shadow-xl shadow-(--brand-ink)/10 p-6 text-white relative overflow-hidden flex flex-col">
           <div className="absolute top-0 right-0 w-40 h-40 bg-(--brand-blue)/30 rounded-full blur-3xl pointer-events-none" />
           <div className="flex items-center gap-2 mb-6 relative z-10">
             <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-(--brand-blue) border border-white/10">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
             </div>
             <h2 className="text-[15px] font-bold">VoltHive AI Analyst</h2>
           </div>

           <div className="space-y-4 relative z-10 flex-1">
             <div className="p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
               <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Peak Demand Alert</p>
               <p className="text-sm font-medium leading-snug">High volume predicted at Colombo Hub between 4 PM - 7 PM. Suggest increasing tariff to 155 LKR.</p>
               <button className="mt-3 text-xs font-bold bg-white text-(--brand-ink) px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">Apply Rate</button>
             </div>
             <div className="p-4 bg-white/5 rounded-xl border border-white/5">
               <p className="text-[11px] text-amber-400 font-bold uppercase tracking-widest mb-1">Maintenance Warning</p>
               <p className="text-sm font-medium leading-snug text-white/80">Plug 2 at Galle Road shows anomalous voltage drops. Inspect soon.</p>
             </div>
           </div>
        </div>

      </div>

      {/* DATA TABLE (Recent Transactions) */}
      <div className="bg-white rounded-2xl border border-(--brand-border) shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 border-b border-(--brand-border) flex justify-between items-center">
          <h2 className="text-[15px] font-bold text-(--brand-ink)">Recent Charging Sessions</h2>
          <button className="text-sm font-semibold text-(--brand-blue) hover:text-(--brand-blue-deep)">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-(--brand-muted) text-xs uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">Station</th>
                <th className="px-6 py-4">Connector</th>
                <th className="px-6 py-4">Energy</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 rounded-tr-xl">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--brand-border)">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-(--brand-ink)">Colombo Fast Hub</td>
                <td className="px-6 py-4 text-(--brand-muted)">CCS2 (Port 1)</td>
                <td className="px-6 py-4 font-medium">42 kWh</td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-bold uppercase tracking-wider">Completed</span></td>
                <td className="px-6 py-4 font-bold text-(--brand-ink)">LKR 6,300</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-(--brand-ink)">Galle Port</td>
                <td className="px-6 py-4 text-(--brand-muted)">CHAdeMO</td>
                <td className="px-6 py-4 font-medium">18 kWh</td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-[11px] font-bold uppercase tracking-wider">Charging</span></td>
                <td className="px-6 py-4 font-bold text-(--brand-ink)">--</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}