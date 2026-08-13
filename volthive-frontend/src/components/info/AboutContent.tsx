'use client';

export default function AboutContent() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-(--brand-ink)/90">
      <p className="text-[15px] text-(--brand-muted) leading-relaxed">
        VoltHive is an EV charging platform that connects drivers with nearby charging stations, using AI-driven demand forecasting and smart, transparent pricing.
      </p>

      <section>
        <h2 className="text-lg font-bold mb-1.5 text-(--brand-ink)">What it does</h2>
        <p>Drivers find the best-value stations within a 10 km radius, compare live prices, reserve a charging slot, and chat directly with the station. Station owners manage their stations, set rates, approve bookings, and reply to drivers — all in one place.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1.5 text-(--brand-ink)">How AI helps</h2>
        <p>Our machine-learning model forecasts charger demand hour by hour using weather, local events, and station hardware. It then suggests fair prices that scale smoothly with demand — so you pay less in quiet hours and stations stay profitable in busy ones.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1.5 text-(--brand-ink)">Version</h2>
        <p>VoltHive 1.0 · Academic project build.</p>
      </section>
    </div>
  );
}
