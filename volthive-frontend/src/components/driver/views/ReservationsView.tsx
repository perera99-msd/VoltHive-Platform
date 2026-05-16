'use client';

export default function ReservationsView() {
  return (
    <section className="space-y-7 vh-rise-in">
      <header className="rounded-[2rem] border border-(--brand-border) bg-(--brand-card)/82 backdrop-blur-2xl p-6 md:p-7">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-(--brand-ink)">Reservations</h1>
        <p className="text-(--brand-muted) text-sm mt-2">Track upcoming charging windows, route ETA, and manage changes quickly.</p>
      </header>

      <div className="flex p-1 rounded-xl bg-(--accent-blue)/12 border border-(--brand-border) w-full max-w-sm">
        <button className="flex-1 py-2.5 rounded-lg bg-(--brand-card) text-(--brand-ink) text-sm font-semibold shadow-sm">Upcoming</button>
        <button className="flex-1 py-2.5 rounded-lg text-(--brand-muted) text-sm font-medium hover:text-(--brand-ink)">Past</button>
      </div>

      <article className="rounded-[1.75rem] border border-(--brand-border) bg-(--brand-card)/86 backdrop-blur-2xl p-5 md:p-6 shadow-[0_18px_38px_-26px_rgba(9,32,52,0.45)]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b border-(--brand-border)">
          <div>
            <span className="px-3 py-1 rounded-full bg-(--ui-success)/14 text-(--ui-success) text-[11px] font-semibold tracking-[0.14em] uppercase border border-(--ui-success)/30">Confirmed</span>
            <h2 className="text-2xl font-semibold text-(--brand-ink) mt-3">Colombo Fast Charge 19</h2>
            <p className="text-sm text-(--brand-muted) mt-1">Random Street 19, Colombo</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-3xl font-semibold tracking-tight text-(--brand-ink)">2:00 PM</p>
            <p className="text-xs uppercase tracking-[0.14em] font-bold text-(--brand-muted) mt-1">Today</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-(--brand-border) bg-(--background) p-3">
            <p className="text-[11px] uppercase tracking-widest font-bold text-(--brand-muted)">Connector</p>
            <p className="text-sm font-semibold text-(--brand-ink) mt-1">CCS2 Fast</p>
          </div>
          <div className="rounded-xl border border-(--brand-border) bg-(--background) p-3">
            <p className="text-[11px] uppercase tracking-widest font-bold text-(--brand-muted)">Slot Length</p>
            <p className="text-sm font-semibold text-(--brand-ink) mt-1">30 minutes</p>
          </div>
          <div className="rounded-xl border border-(--brand-border) bg-(--background) p-3">
            <p className="text-[11px] uppercase tracking-widest font-bold text-(--brand-muted)">ETA</p>
            <p className="text-sm font-semibold text-(--brand-ink) mt-1">17 min drive</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button className="flex-1 py-3 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-(--brand-card) text-sm font-semibold hover:brightness-105 transition-all">Get Directions</button>
          <button className="flex-1 py-3 rounded-xl border border-(--brand-border) bg-(--background) text-(--ui-error) text-sm font-semibold hover:border-(--ui-error)/40 transition-colors">Cancel Slot</button>
        </div>
      </article>
    </section>
  );
}