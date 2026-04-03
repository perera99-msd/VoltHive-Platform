'use client';

export default function MyGarage() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-(--brand-ink) tracking-tight">My Garage</h1>
        <p className="text-(--brand-muted) text-sm mt-2">Manage your vehicles to filter compatible stations automatically.</p>
      </header>

      {/* Vehicle Card */}
      <div className="bg-white rounded-[2rem] p-6 border border-(--brand-border) shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center gap-6">
        <div className="w-32 h-20 bg-[#5FAFC0]/8 rounded-xl border border-(--brand-border) flex items-center justify-center shrink-0">
          <img src="/icons/car.png" alt="Car" className="w-16 h-16 object-contain opacity-80" />
        </div>
        <div className="flex-1 w-full text-center md:text-left">
          <div className="inline-block px-2.5 py-1 rounded-md bg-[#5FAFC0]/16 text-(--brand-blue) text-[10px] font-bold uppercase tracking-widest border border-[color:var(--accent-blue)]/30 mb-2">Primary</div>
          <h3 className="text-xl font-semibold text-(--brand-ink)">Nissan Leaf (2020)</h3>
          <p className="text-sm text-(--brand-muted) font-medium">40 kWh Battery Capacity</p>
        </div>
        <div className="w-full md:w-auto bg-[#7BC96F]/10 px-5 py-4 rounded-2xl border border-(--brand-border) flex items-center justify-between md:justify-center gap-4">
           <div>
             <p className="text-[10px] font-bold text-(--brand-muted) uppercase tracking-widest mb-0.5">Plug Type</p>
             <p className="text-(--brand-ink) font-semibold text-sm">CHAdeMO</p>
           </div>
        </div>
      </div>

      {/* Add Vehicle Button */}
      <button className="w-full py-6 rounded-[2rem] border-2 border-dashed border-(--brand-border) text-(--brand-muted) font-semibold hover:border-(--accent-blue) hover:text-(--brand-blue) hover:bg-[#5FAFC0]/8 transition-all flex flex-col items-center gap-2">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Add Another Vehicle
      </button>
    </div>
  );
}