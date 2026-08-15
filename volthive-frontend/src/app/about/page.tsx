'use client';

import Link from 'next/link';
import Image from 'next/image';
import HomeNavbar from '../../components/home/HomeNavbar';
import Footer from '../../components/home/Footer';
import Reveal from '../../components/common/Reveal';

const MISSION_PILLARS = [
  {
    title: 'Zero Friction Mobility',
    desc: 'Eliminating the anxiety of queuing with unreserved chargers. Pre-arrival slot holds give drivers complete certainty on cross-island expressway journeys.',
    tag: 'Driver Freedom',
  },
  {
    title: 'Open Hardware Democracy',
    desc: 'Empowering local station owners, hotels, and fuel retailers with 100% direct revenue retention and zero predatory middleman aggregator commission haircuts.',
    tag: 'Host Sovereignty',
  },
  {
    title: 'Renewable Grid Balancing',
    desc: 'Aligning vehicle charging windows with rooftop solar and wind generation curves through automated dynamic machine learning demand response tariffs.',
    tag: 'Grid Health',
  },
];

const TIMELINE = [
  { year: '2024', title: 'Protocol Genesis', desc: 'Conceived as an academic high-performance aggregator protocol to solve Sri Lanka’s fragmented EV charging landscape.' },
  { year: '2025', title: 'Python ML Engine v2.0', desc: 'Integrated predictive demand forecasting algorithms and biometric WebAuthn cryptographic standalone app.' },
  { year: '2026', title: 'Island-Wide Deployment', desc: 'Connecting 100+ active charging hubs across Colombo, Kandy, Galle, and major national expressways.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-(--background) text-(--brand-ink) font-sans flex flex-col selection:bg-(--accent-blue)/30">
      
      {/* Top Navbar */}
      <HomeNavbar />

      {/* Main Content */}
      <main className="flex-1 pt-32 sm:pt-40 pb-24 px-5 sm:px-10 max-w-[1500px] mx-auto w-full relative z-10">
        
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-(--brand-border) shadow-2xs font-mono text-xs font-black uppercase tracking-widest text-(--brand-blue-deep) mb-6">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>OUR MISSION &amp; VISION</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-(--brand-ink) mb-6 leading-[1.08]">
            Accelerating the Future of Clean Electric Mobility.
          </h1>
          <p className="text-base sm:text-xl text-(--brand-muted) font-medium leading-relaxed">
            VoltHive is building South Asia’s most intelligent, decentralized EV aggregation network — bridging drivers, station hosts, and the national power grid seamlessly.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MISSION_PILLARS.map((m, idx) => (
              <Reveal key={m.title} direction="up" delay={idx * 0.1}>
                <div className="h-full rounded-[2.25rem] bg-white border border-(--brand-border) p-8 sm:p-10 shadow-xs hover:shadow-xl hover:border-(--brand-blue)/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="w-12 h-12 rounded-2xl bg-(--surface-soft) text-(--brand-blue-deep) flex items-center justify-center font-bold text-sm border border-(--brand-border)">
                        0{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-(--brand-green-deep) bg-(--surface-tint) px-3 py-1 rounded-full border border-(--brand-border)">
                        {m.tag}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-(--brand-ink) tracking-tight mb-3">
                      {m.title}
                    </h3>
                    <p className="text-sm text-(--brand-muted) font-medium leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Evolution Timeline */}
        <div className="mb-24">
          <Reveal direction="left" className="mb-12 max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-(--brand-blue-deep) bg-(--surface-soft) px-3 py-1 rounded-full">
              OUR JOURNEY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-(--brand-ink) tracking-tight mt-3">
              From Academic Innovation to National Grid Scale.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIMELINE.map((t, idx) => (
              <Reveal key={t.year} direction="up" delay={idx * 0.1}>
                <div className="rounded-[2rem] bg-white border border-(--brand-border) p-8 shadow-xs flex flex-col justify-between h-full space-y-4">
                  <div className="font-mono text-3xl font-black text-(--brand-blue-deep)">
                    {t.year}
                  </div>
                  <h3 className="text-lg font-black text-(--brand-ink)">{t.title}</h3>
                  <p className="text-xs sm:text-sm text-(--brand-muted) font-medium leading-relaxed">{t.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <Reveal direction="up" className="rounded-[2.5rem] bg-linear-to-r from-(--brand-blue-deep) via-(--brand-blue) to-(--brand-green) text-white p-8 sm:p-14 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Join the VoltHive Network Today.
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-medium">
              Whether you drive an EV or own a commercial parking property, experience the new standard of electric charging.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/driver-login"
              className="px-8 py-4 rounded-full bg-white text-(--brand-ink) font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-white/90 transition-all"
            >
              Driver App →
            </Link>
            <Link
              href="/owner-login"
              className="px-8 py-4 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 font-black text-xs uppercase tracking-[0.2em] hover:bg-white/30 transition-all"
            >
              Host Portal
            </Link>
          </div>
        </Reveal>

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
