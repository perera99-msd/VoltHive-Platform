'use client';

import Link from 'next/link';
import HomeNavbar from '../../components/home/HomeNavbar';
import Footer from '../../components/home/Footer';
import Reveal from '../../components/common/Reveal';

const HOST_BENEFITS = [
  {
    title: 'Zero Gateway Commission',
    desc: 'VoltHive charges 0% transaction cut on standard charging sessions. Keep 100% of your energy revenue deposited directly to your bank account via Stripe Connect.',
    tag: '100% Retained',
  },
  {
    title: 'Dynamic AI Pricing Engine',
    desc: 'Let our machine learning engine automatically optimize per-kWh rates based on grid tariffs, solar output, and commuter demand to maximize utilization.',
    tag: 'Automated Yield',
  },
  {
    title: 'Universal Hardware Protocol',
    desc: 'Native OCPP 1.6J and OCPP 2.0.1 controller support. Compatible with ABB, Schneider Electric, Delta, Tritium, Wallbox, and Circontrol.',
    tag: 'Open Standard',
  },
  {
    title: 'Real-Time Remote Control',
    desc: 'Monitor bay occupancy, electrical power metrics, error codes, and remote reboot hardware straight from the VoltHive Station Admin Center.',
    tag: 'Full Observability',
  },
];

const COMPATIBLE_BRANDS = [
  { name: 'ABB Terra', types: '50 kW – 350 kW DC Fast', protocols: 'OCPP 1.6J / 2.0.1' },
  { name: 'Schneider EVlink', types: '7 kW – 22 kW AC Commercial', protocols: 'OCPP 1.6J' },
  { name: 'Delta Ultra Fast', types: '100 kW – 200 kW Hypercharger', protocols: 'OCPP 1.6J / 2.0.1' },
  { name: 'Tritium PKM', types: '75 kW – 150 kW Liquid Cooled', protocols: 'OCPP 2.0.1 / ISO 15118' },
  { name: 'Wallbox Supernova', types: '60 kW – 150 kW Compact DC', protocols: 'OCPP 1.6J' },
  { name: 'Circontrol Raption', types: '50 kW – 150 kW Modular DC', protocols: 'OCPP 1.6J / 2.0.1' },
];

const ONBOARDING_STEPS = [
  { step: '01', title: 'Register Account', desc: 'Create your Host profile in the Admin Center and link your direct bank settlement account.' },
  { step: '02', title: 'Connect Hardware', desc: 'Point your charger’s OCPP WebSocket endpoint to `wss://ocpp.volthive.com/v2`.' },
  { step: '03', title: 'Set Tariffs & Rules', desc: 'Configure baseline LKR rates, enable AI dynamic peak pricing, and define slot reservation windows.' },
  { step: '04', title: 'Go Live & Earn', desc: 'Your station appears on thousands of driver navigation maps across Sri Lanka immediately.' },
];

export default function HostsPage() {
  return (
    <div className="min-h-screen bg-(--background) text-(--brand-ink) font-sans flex flex-col selection:bg-(--accent-blue)/30">
      
      {/* Navbar */}
      <HomeNavbar />

      {/* Main Content */}
      <main className="flex-1 pt-32 sm:pt-40 pb-24 px-5 sm:px-10 max-w-[1500px] mx-auto w-full relative z-10">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-(--brand-border) shadow-2xs font-mono text-xs font-black uppercase tracking-widest text-(--brand-blue-deep) mb-6">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>FOR PROPERTY &amp; HARDWARE OWNERS</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-(--brand-ink) mb-6 leading-[1.08]">
            Turn Every Parking Bay Into an Automated Yield Engine.
          </h1>
          <p className="text-base sm:text-xl text-(--brand-muted) font-medium leading-relaxed">
            Connect your commercial properties, hotels, malls, and fuel stations to Sri Lanka’s premier open EV aggregation network with 0% gateway commission.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/owner-login"
              className="px-8 py-4 rounded-full bg-(--brand-ink) hover:bg-(--brand-blue-deep) text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all"
            >
              Open Host Admin Center →
            </Link>
            <Link
              href="/technology"
              className="px-8 py-4 rounded-full bg-white border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-soft) font-black text-xs uppercase tracking-[0.2em] shadow-xs transition-all"
            >
              Explore Architecture
            </Link>
          </div>
        </div>

        {/* 4 Key Benefits */}
        <div className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOST_BENEFITS.map((b, idx) => (
              <Reveal key={b.title} direction="up" delay={idx * 0.08}>
                <div className="h-full rounded-[2rem] bg-white border border-(--brand-border) p-7 shadow-xs hover:shadow-xl hover:border-(--brand-blue)/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="w-10 h-10 rounded-xl bg-(--surface-soft) text-(--brand-blue-deep) flex items-center justify-center font-bold text-sm border border-(--brand-border)">
                        0{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-(--brand-green-deep) bg-(--surface-tint) px-2.5 py-1 rounded-full border border-(--brand-border)">
                        {b.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-(--brand-ink) tracking-tight mb-2">
                      {b.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-(--brand-muted) font-medium leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Hardware Compatibility Matrix */}
        <div className="mb-24">
          <Reveal direction="left" className="mb-10 max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-(--brand-blue-deep) bg-(--surface-soft) px-3 py-1 rounded-full">
              HARDWARE ECOSYSTEM
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-(--brand-ink) tracking-tight mt-3">
              Certified Compatible Hardware Brands
            </h2>
            <p className="text-sm text-(--brand-muted) font-medium mt-1">
              VoltHive supports any charger that speaks the standard open OCPP communication protocol.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMPATIBLE_BRANDS.map((brand, idx) => (
              <Reveal key={brand.name} direction="up" delay={idx * 0.08}>
                <div className="rounded-[2rem] bg-white border border-(--brand-border) p-7 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-(--brand-ink)">{brand.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-(--surface-tint) text-(--brand-green-deep) text-[10px] font-mono font-bold">
                      ✓ Certified
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-(--brand-muted)">
                    <div><strong className="text-(--brand-ink)">Hardware Range:</strong> {brand.types}</div>
                    <div><strong className="text-(--brand-ink)">Protocol:</strong> {brand.protocols}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* 4-Step Onboarding Roadmap */}
        <div className="mb-24">
          <Reveal direction="up" className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-(--brand-ink) tracking-tight">
              Get Your Station Live in Under 10 Minutes
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ONBOARDING_STEPS.map((s, idx) => (
              <Reveal key={s.step} direction="up" delay={idx * 0.08}>
                <div className="rounded-[2rem] bg-white border border-(--brand-border) p-6 shadow-xs flex flex-col justify-between h-full">
                  <div>
                    <span className="font-mono text-3xl font-black text-(--brand-blue-deep) block mb-4">
                      {s.step}
                    </span>
                    <h3 className="text-base font-black text-(--brand-ink) mb-2">{s.title}</h3>
                    <p className="text-xs text-(--brand-muted) font-medium leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Bottom CTA Card */}
        <Reveal direction="up" className="rounded-[2.5rem] bg-linear-to-r from-(--brand-blue-deep) via-(--brand-blue) to-(--brand-green) text-white p-8 sm:p-14 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Ready to deploy your charging station?
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-medium">
              Start with zero upfront software license fees. Streamlined direct settlements and real-time operations dashboard.
            </p>
          </div>
          <Link
            href="/owner-login"
            className="px-9 py-4.5 rounded-full bg-white text-(--brand-ink) font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-white/90 transition-all shrink-0"
          >
            Launch Host Admin →
          </Link>
        </Reveal>

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
