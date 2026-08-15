'use client';

import Reveal from '../common/Reveal';

const DRIVER_STEPS = [
  { n: '01', title: 'Find your station', text: 'Browse the live map and compare real-time prices, connector types, and availability nearby.' },
  { n: '02', title: 'Reserve a slot', text: 'Lock an ultra-fast charger up to 24 hours ahead so it is guaranteed and waiting when you arrive.' },
  { n: '03', title: 'Charge & pay', text: 'Plug in, track the session live, and settle transparently — no queues, no surprise fees.' },
];

const OWNER_STEPS = [
  { n: '01', title: 'Deploy chargers', text: 'Register your hardware and go live on the VoltHive network with guided onboarding in minutes.' },
  { n: '02', title: 'Set dynamic pricing', text: 'Let the AI engine adjust tariffs to demand, weather, and grid load to maximize your yield.' },
  { n: '03', title: 'Track revenue', text: 'Watch live occupancy, sessions, and settlements from a clean real-time operations dashboard.' },
];

function StepCard({ n, title, text, accent }: { n: string; title: string; text: string; accent: 'driver' | 'owner' }) {
  return (
    <div className="group relative rounded-3xl border border-(--brand-border) bg-(--brand-card) p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-(--brand-blue)/40 transition-all duration-500 overflow-hidden">
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${accent === 'driver' ? 'bg-(--brand-blue)/12' : 'bg-(--brand-green)/14'}`} />
      <div className={`font-mono text-4xl sm:text-5xl font-black tracking-tight ${accent === 'driver' ? 'text-(--brand-blue)/25' : 'text-(--brand-green)/30'} mb-4`}>{n}</div>
      <h3 className="text-lg sm:text-xl font-bold text-(--brand-ink) tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-(--brand-muted) leading-relaxed font-medium">{text}</p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative z-10 w-full bg-(--surface-soft)/40 py-16 sm:py-24 px-5 sm:px-10 overflow-hidden font-sans border-t border-(--brand-border)">
      <div className="max-w-[1500px] mx-auto">
        <Reveal className="max-w-3xl mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-(--brand-border) font-mono text-[11px] font-black tracking-[0.16em] uppercase text-(--brand-blue-deep) mb-4 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>How it works</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-(--brand-ink) leading-[1.06] mb-4">
            Two simple journeys. One smart grid.
          </h2>
          <p className="text-sm sm:text-lg text-(--brand-muted) font-medium leading-relaxed max-w-2xl">
            Whether you drive or own the hardware, VoltHive removes the friction between finding power and selling it.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          <Reveal direction="left">
            <div className="mb-5 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-(--brand-blue)/12 text-(--brand-blue-deep) border border-(--brand-blue)/20 flex items-center justify-center text-sm font-bold">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-blue-deep)"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
              </span>
              <h3 className="text-sm font-black uppercase tracking-widest text-(--brand-ink)">For Drivers</h3>
            </div>
            <div className="space-y-4">
              {DRIVER_STEPS.map((s) => <StepCard key={s.n} {...s} accent="driver" />)}
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.1}>
            <div className="mb-5 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-(--brand-green)/14 text-(--brand-green-deep) border border-(--brand-green)/20 flex items-center justify-center text-sm font-bold">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-green-deep)"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
              </span>
              <h3 className="text-sm font-black uppercase tracking-widest text-(--brand-ink)">For Station Hosts</h3>
            </div>
            <div className="space-y-4">
              {OWNER_STEPS.map((s) => <StepCard key={s.n} {...s} accent="owner" />)}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
