export default function Features() {
  return (
    <section id="services" className="relative z-10 px-4 sm:px-6 py-16 sm:py-24 max-w-7xl mx-auto overflow-x-hidden">
      <div className="rounded-4xl sm:rounded-[2.4rem] border border-(--brand-border) bg-(--brand-card)/85 backdrop-blur-sm shadow-[0_20px_60px_-30px_rgba(9,32,52,0.3)] px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-(--brand-muted) font-semibold mb-2 sm:mb-3">Why VoltHive</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-3 sm:mb-4 text-(--brand-ink)">Services built for modern mobility.</h2>
          <p className="text-base sm:text-lg text-(--brand-muted) font-medium max-w-2xl mx-auto leading-relaxed">A professional control layer for charging discovery, dynamic pricing, and reservation confidence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="bg-linear-to-br from-(--brand-card) to-background p-6 sm:p-8 rounded-3xl border border-(--brand-border) hover:shadow-xl hover:shadow-(color:--accent-blue)/20 transition-all duration-300 group">
            <div className="w-12 h-12 bg-(--accent-blue)/12 text-(--brand-blue) rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 text-(--brand-ink) tracking-tight">Live Network Intelligence</h3>
            <p className="text-[14px] sm:text-[15px] text-(--brand-muted) font-medium leading-relaxed">
              Access real-time availability, charger status, and pricing signals before you start your journey.
            </p>
          </div>

          <div className="bg-linear-to-br from-(--brand-blue) to-(--brand-green) p-6 sm:p-8 rounded-3xl shadow-xl sm:shadow-2xl shadow-(color:--accent-blue)/30 text-(--brand-card) relative overflow-hidden group md:-translate-y-3">
            <div className="absolute -top-14 -right-10 w-40 h-40 sm:w-52 sm:h-52 bg-(--brand-card)/20 rounded-full blur-3xl" />
            <div className="w-12 h-12 bg-(--brand-card)/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-5 sm:mb-6 border border-(--brand-card)/25 group-hover:scale-105 transition-transform relative z-10">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H7" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 tracking-tight relative z-10">AI Price Optimization</h3>
            <p className="text-[14px] sm:text-[15px] text-(--brand-card)/90 font-medium leading-relaxed relative z-10">
              Dynamic tariff recommendations balance station demand, grid behavior, and owner revenue in real time.
            </p>
          </div>

          <div className="bg-linear-to-br from-(--brand-card) to-background p-6 sm:p-8 rounded-3xl border border-(--brand-border) hover:shadow-xl hover:shadow-(color:--accent-green)/25 transition-all duration-300 group">
            <div className="w-12 h-12 bg-(--accent-green)/18 text-(--brand-green-deep) rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 text-(--brand-ink) tracking-tight">Reservation Confidence</h3>
            <p className="text-[14px] sm:text-[15px] text-(--brand-muted) font-medium leading-relaxed">
              Reserve in seconds with reliable scheduling designed for both high-volume drivers and station owners.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}