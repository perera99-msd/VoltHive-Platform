'use client';

import Link from 'next/link';
import Image from 'next/image';
import HomeNavbar from '../../components/home/HomeNavbar';
import Footer from '../../components/home/Footer';
import Reveal from '../../components/common/Reveal';

const GUIDE_STEPS = [
  {
    step: '01',
    title: 'Find & Match Your Vehicle',
    tagline: 'Instant Smart Filter',
    desc: 'Open the VoltHive Live Map or PWA cockpit. Filter by your vehicle’s socket standard (CCS2, Type 2, CHAdeMO) and minimum power speed (60 kW to 150 kW). See real-time availability and live pricing in LKR.',
  },
  {
    step: '02',
    title: 'Reserve Before You Drive',
    tagline: '24-Hour Advance Slot Hold',
    desc: 'Never arrive with low battery to find a full queue. Select your preferred 1-hour time window. VoltHive locks the charging bay and holds it with an automatic 15-minute traffic buffer.',
  },
  {
    step: '03',
    title: 'Arrive & Plug In',
    tagline: 'Biometric 1-Touch Unlock',
    desc: 'Park in your assigned bay. Authenticate using Face ID, Fingerprint, or scan the on-station QR code. The hardware unlocks the socket and begins energy delivery automatically.',
  },
  {
    step: '04',
    title: 'Live Telemetry & Auto-Invoice',
    tagline: 'Real-Time Power Curve',
    desc: 'Track voltage, current, power kW, and State of Charge (SOC) live from your smartphone. When finished, payment settles automatically with an itemized PDF receipt sent to your email.',
  },
];

const CONNECTOR_STANDARDS = [
  {
    name: 'CCS2 (Combo 2)',
    type: 'DC Fast & Ultra-Fast',
    power: '50 kW to 350 kW',
    compatibility: 'BYD, MG, Hyundai, Audi, Porsche, BMW, Mercedes-Benz, Tesla (EU)',
    speedDescription: '10% to 80% in 18–30 minutes',
    badge: 'Universal Standard',
  },
  {
    name: 'Type 2 (Mennekes)',
    type: 'AC Slow & Fast',
    power: '7 kW to 22 kW',
    compatibility: 'All European & Asian modern plug-in electric vehicles',
    speedDescription: 'Full charge in 3–6 hours (Ideal for overnight & office parking)',
    badge: 'AC Destination',
  },
  {
    name: 'CHAdeMO',
    type: 'DC Fast',
    power: '50 kW to 100 kW',
    compatibility: 'Nissan Leaf, Mitsubishi Outlander PHEV',
    speedDescription: '10% to 80% in 35–45 minutes',
    badge: 'Japanese Standard',
  },
  {
    name: 'Tesla NACS / CCS',
    type: 'DC Hypercharger',
    power: '120 kW to 250 kW',
    compatibility: 'Tesla Model 3, Model Y, Model S, Model X',
    speedDescription: '10% to 80% in 20–25 minutes',
    badge: 'High Power DC',
  },
  {
    name: 'GB/T',
    type: 'DC & AC Standards',
    power: '30 kW to 90 kW',
    compatibility: 'Chinese domestic market imported vehicles',
    speedDescription: '10% to 80% in 30–50 minutes',
    badge: 'China Standard',
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-(--background) text-(--brand-ink) font-sans flex flex-col selection:bg-(--accent-blue)/30">
      
      {/* Top Navbar */}
      <HomeNavbar />

      {/* Main Content */}
      <main className="flex-1 pt-32 sm:pt-40 pb-24 px-5 sm:px-10 max-w-[1500px] mx-auto w-full relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-(--brand-border) shadow-2xs font-mono text-xs font-black uppercase tracking-widest text-(--brand-blue-deep) mb-6">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>EV DRIVER KNOWLEDGE CENTER</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-(--brand-ink) mb-6 leading-[1.08]">
            The Complete EV Charging Guide.
          </h1>
          <p className="text-base sm:text-xl text-(--brand-muted) font-medium leading-relaxed">
            Master pre-arrival slot reservations, connector standards, battery health optimization, and charging etiquette on the VoltHive network.
          </p>
        </div>

        {/* 4-Step Visual Journey */}
        <div className="mb-24">
          <Reveal direction="up" className="mb-10 text-center">
            <h2 className="text-2xl sm:text-4xl font-black text-(--brand-ink) tracking-tight">
              4 Simple Steps to Guaranteed Power
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {GUIDE_STEPS.map((s, idx) => (
              <Reveal key={s.step} direction="up" delay={idx * 0.1}>
                <div className="h-full rounded-[2rem] bg-white border border-(--brand-border) p-7 shadow-xs hover:shadow-xl hover:border-(--brand-blue)/40 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="w-11 h-11 rounded-2xl bg-(--surface-soft) text-(--brand-blue-deep) flex items-center justify-center font-mono font-bold text-sm border border-(--brand-border)">
                        {s.step}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-(--brand-muted) bg-(--background) px-2.5 py-1 rounded-full border border-(--brand-border)">
                        Phase {idx + 1}
                      </span>
                    </div>
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-(--surface-tint) text-(--brand-green-deep) font-mono text-[10px] font-bold uppercase mb-2">
                      {s.tagline}
                    </span>
                    <h3 className="text-lg font-bold text-(--brand-ink) tracking-tight mb-2">
                      {s.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-(--brand-muted) font-medium leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Connector Standards Directory */}
        <div className="mb-24">
          <Reveal direction="left" className="mb-10 max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-(--brand-blue-deep) bg-(--surface-soft) px-3 py-1 rounded-full">
              HARDWARE DIRECTORY
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-(--brand-ink) tracking-tight mt-3">
              Charging Connector Types Explained
            </h2>
            <p className="text-sm text-(--brand-muted) font-medium mt-1">
              Know your plug type and optimal power speed before reserving.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CONNECTOR_STANDARDS.map((conn, idx) => (
              <Reveal key={conn.name} direction="up" delay={idx * 0.08}>
                <div className="rounded-[2rem] bg-white border border-(--brand-border) p-7 shadow-xs hover:border-(--brand-blue)/40 transition-all flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-black text-(--brand-ink)">{conn.name}</h3>
                      <span className="px-2.5 py-1 rounded-full bg-(--surface-soft) text-(--brand-blue-deep) text-[10px] font-mono font-bold">
                        {conn.badge}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-(--brand-border)/70">
                        <span className="text-(--brand-muted) font-medium">Power Capability:</span>
                        <span className="font-mono font-bold text-(--brand-ink)">{conn.power}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-(--brand-border)/70">
                        <span className="text-(--brand-muted) font-medium">Standard Speed:</span>
                        <span className="font-mono font-bold text-(--brand-green-deep)">{conn.speedDescription}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-(--brand-muted) block mb-1">Compatible Vehicles:</span>
                        <p className="text-xs text-(--brand-ink) font-medium leading-relaxed bg-(--background) p-3 rounded-xl border border-(--brand-border)/60">
                          {conn.compatibility}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Battery Health Best Practices */}
        <Reveal direction="up" className="rounded-[2.5rem] bg-linear-to-r from-(--brand-ink) via-[#1b2528] to-[#121c1f] text-white p-8 sm:p-14 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl space-y-4">
            <span className="px-3.5 py-1 rounded-full bg-white/10 text-(--accent-green) font-mono text-xs font-bold uppercase tracking-wider">
              BATTERY HEALTH TIPS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Optimize Lithium Battery Lifespan: The 20% to 80% Rule
            </h2>
            <p className="text-sm sm:text-base text-[#9baab0] leading-relaxed font-medium">
              DC Fast charging is fastest between 10% and 80% State of Charge. The final 80%–100% slows down automatically to protect battery chemistry. Unplug at 80% on long trips to save time and money!
            </p>
          </div>
          <Link
            href="/driver-login"
            className="w-full lg:w-auto px-10 py-4.5 rounded-full bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-extrabold text-xs uppercase tracking-[0.2em] text-center shadow-lg hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            Launch Driver App →
          </Link>
        </Reveal>

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
