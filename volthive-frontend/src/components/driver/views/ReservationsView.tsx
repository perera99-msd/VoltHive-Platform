'use client';

export default function ReservationsView() {
  return (
    <div className="space-y-6">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-(--brand-ink) tracking-tight">Reservations</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-[#5FAFC0]/12 rounded-xl mb-6 w-full max-w-sm">
        <button className="flex-1 py-2 bg-white rounded-lg shadow-sm text-sm font-semibold text-(--brand-ink)">Upcoming</button>
        <button className="flex-1 py-2 text-sm font-medium text-(--brand-muted) hover:text-(--brand-ink)">Past</button>
      </div>

      {/* Booking Card */}
      <div className="bg-white rounded-3xl p-6 border border-(--brand-border) shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-start mb-6 border-b border-(--brand-border) pb-6">
          <div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">Confirmed</span>
            <h3 className="text-xl font-semibold text-(--brand-ink) mt-3">Colombo Fast Charge 19</h3>
            <p className="text-sm text-(--brand-muted) mt-1">Random Street 19, Colombo</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-light text-(--brand-ink)">2:00 <span className="text-sm font-semibold">PM</span></p>
            <p className="text-xs font-medium text-(--brand-muted) uppercase tracking-widest mt-1">Today</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white rounded-xl text-sm font-semibold hover:brightness-105 transition-colors">Get Directions</button>
          <button className="flex-1 py-3 bg-white border border-(--brand-border) text-(--ui-error) rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">Cancel Slot</button>
        </div>
      </div>
    </div>
  );
}