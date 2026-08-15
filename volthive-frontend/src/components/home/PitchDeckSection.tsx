'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal from '../common/Reveal';

const DECK_TABS = [
  {
    id: 'zero-cut',
    tabNumber: '01',
    tabTitle: 'Direct Settlement',
    badge: 'POINT-OF-SALE NATIVE',
    headline: 'Zero Middleman Commission. 100% of Revenue to the Host.',
    subhead: 'Traditional charging aggregators retain 15%–30% per kilowatt-hour. VoltHive eliminates all middleman cuts.',
    content: 'VoltHive directly connects EVSE chargers to Stripe Connect and local direct banking rails. Drivers pay with Apple Pay, Google Pay, or debit cards, and funds settle automatically to the station host bank account with zero intermediate haircuts.',
    stats: [
      { big: '0%', label: 'Gateway Take', desc: 'Zero percent commission on standard charging sessions.' },
      { big: '< 1s', label: 'Telemetry Sync', desc: 'Real-time WebSocket heartbeat between charger and cloud.' },
      { big: '100%', label: 'Host Ownership', desc: 'Full sovereignty over pricing tariffs and access policies.' },
    ],
    features: [
      'Direct Stripe Connect & LKR Bank Settlement',
      'Automated Itemized Tax Invoicing for Fleets',
      'Native OCPP 1.6J / 2.0.1 Hardware Integration',
    ],
  },
  {
    id: 'ai-engine',
    tabNumber: '02',
    tabTitle: 'Dynamic Yield AI',
    badge: 'PREDICTIVE TARIFF DISPATCH',
    headline: 'Automated Peak Shaving. Higher Utilization. Maximized Station Yield.',
    subhead: 'Our ML telemetry engine evaluates local utility tariffs, weather forecasts, and commuter traffic continuously.',
    content: 'By optimizing prices during off-peak solar generation windows (10:00–14:00) and managing capacity during peak evening commuter hours (17:00–21:00), VoltHive increases average station utilization by 42% while keeping electricity affordable.',
    stats: [
      { big: '+42%', label: 'Utilization Lift', desc: 'Higher off-peak volume through smart price incentives.' },
      { big: '-28%', label: 'Driver Savings', desc: 'Substantial savings during scheduled green solar surplus.' },
      { big: '15m', label: 'Tariff Interval', desc: 'Smooth price transitions preventing sudden price shocks.' },
    ],
    features: [
      'Multi-Variate Load Curve Forecasting',
      'Solar Rooftop & Battery Storage Integration',
      'Automated Demand-Response Grid Balancing',
    ],
  },
  {
    id: 'pre-booking',
    tabNumber: '03',
    tabTitle: 'Pre-Arrival Holding',
    badge: 'SLOT RESERVATION PROTOCOL',
    headline: 'Zero Queue Anxiety. Guaranteed Bay on Arrival.',
    subhead: 'Reserve your dedicated hypercharger up to 24 hours in advance with an automatic 15-minute traffic buffer.',
    content: 'Eliminate arriving with 8% battery to find all chargers occupied. VoltHive reserves your assigned bay and holds it until you authenticate via 1-touch Face ID / Fingerprint or QR code.',
    stats: [
      { big: '24h', label: 'Advance Hold', desc: 'Lock in charging stops before starting expressway journeys.' },
      { big: '0m', label: 'Queue Waiting', desc: 'Drive straight into your assigned bay with zero queue time.' },
      { big: '15m', label: 'Traffic Buffer', desc: 'Automatic grace period cushion before bay re-release.' },
    ],
    features: [
      '1-Touch Biometric Authentication (WebAuthn / FIDO2)',
      'Live Turn-by-Turn Navigation with SOC Estimates',
      'Automated Overstay Deterrence Management',
    ],
  },
  {
    id: 'enterprise-fleet',
    tabNumber: '04',
    tabTitle: 'Fleet & Host Portal',
    badge: 'MULTI-TENANT ORCHESTRATION',
    headline: 'Manage 5 or 5,000 Charging Bays with Single-Pane Observability.',
    subhead: 'Enterprise Role-Based Access Control (RBAC), multi-station grouping, and live electrical telemetry monitoring.',
    content: 'Whether you operate 2 chargers at a private hotel or manage a nationwide network of 100 fast-charging plazas, VoltHive provides unified health monitoring, error alerts, fault detection, and consolidated monthly financial reporting.',
    stats: [
      { big: '99.9%', label: 'Hardware Uptime', desc: 'Instant alerts on connector faults or grid voltage drops.' },
      { big: '100+', label: 'Supported Brands', desc: 'Compatible with ABB, Schneider, Delta, Tritium, Wallbox.' },
      { big: 'RBAC', label: 'Enterprise Security', desc: 'Granular permissions for operators and auditors.' },
    ],
    features: [
      'Live OCPP Diagnostics & Remote Hardware Reboot',
      'Corporate Fleet Invoicing & Driver Allowances',
      'Automated Energy Dispatch to Minimize Demand Peaks',
    ],
  },
];

export default function PitchDeckSection() {
  const [activeTabId, setActiveTabId] = useState(DECK_TABS[0].id);

  // Slow auto-advance every 9 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTabId((prev) => {
        const currentIndex = DECK_TABS.findIndex((t) => t.id === prev);
        const nextIndex = (currentIndex + 1) % DECK_TABS.length;
        return DECK_TABS[nextIndex].id;
      });
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const activeTab = DECK_TABS.find((t) => t.id === activeTabId) || DECK_TABS[0];

  return (
    <section id="pitch-deck" className="relative z-10 w-full bg-[#111618] text-white py-20 sm:py-32 px-5 sm:px-10 overflow-hidden font-sans border-t border-[#222c30]">
      
      {/* Ambient glows */}
      <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-(--brand-blue)/12 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-[500px] h-[500px] bg-(--brand-green)/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-[1500px] mx-auto relative z-10">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16 border-b border-[#253238] pb-8">
          <Reveal direction="left" className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1c262a] border border-[#2e3e44] font-mono text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-(--accent-blue) mb-4">
              <span className="w-2 h-2 rounded-full bg-(--accent-green) animate-pulse" />
              <span>THE VOLTHIVE ADVANTAGE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              The Future of Decentralized EV Infrastructure.
            </h2>
          </Reveal>

          <Reveal direction="right" delay={0.15} className="text-right">
            <p className="text-xs sm:text-sm font-mono text-[#8a999e] uppercase tracking-widest">
              Protocol v2.4 Overview
            </p>
            <p className="text-xs sm:text-sm text-[#8a999e] mt-1 font-medium">
              Click tabs to explore technical pillars
            </p>
          </Reveal>
        </div>

        {/* Tab Navigation Pill Bar */}
        <Reveal direction="up" delay={0.1} className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-1.5 rounded-2xl bg-[#192226] border border-[#2a3a40]">
            {DECK_TABS.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`py-3.5 px-4 rounded-xl text-left transition-all duration-300 cursor-pointer flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-blue-deep) text-white shadow-md'
                      : 'text-[#8a999e] hover:text-white hover:bg-[#202c32]'
                  }`}
                >
                  <div>
                    <span className="block font-mono text-[10px] opacity-75 font-bold uppercase tracking-wider">
                      {tab.tabNumber}
                    </span>
                    <span className="block text-xs sm:text-sm font-extrabold tracking-tight mt-0.5">
                      {tab.tabTitle}
                    </span>
                  </div>
                  <span className={`text-sm transition-transform ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`}>
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Tab Content Body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch"
          >
            {/* Left Col */}
            <div className="lg:col-span-7 flex flex-col justify-between p-8 sm:p-12 rounded-4xl bg-[#161e22] border border-[#28383f]">
              <div className="space-y-5">
                <span className="inline-block px-3.5 py-1 rounded-full bg-[#202d33] border border-[#2e4048] font-mono text-[10px] font-bold tracking-[0.16em] uppercase text-(--accent-green)">
                  {activeTab.badge}
                </span>

                <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {activeTab.headline}
                </h3>

                <p className="text-base sm:text-lg text-(--accent-blue) font-semibold leading-relaxed">
                  {activeTab.subhead}
                </p>

                <p className="text-sm sm:text-base text-[#9baab0] font-medium leading-relaxed">
                  {activeTab.content}
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="mt-8 pt-6 border-t border-[#25353c] space-y-2.5">
                {activeTab.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-white/90">
                    <span className="w-4 h-4 rounded-full bg-(--brand-green)/20 text-(--accent-green) flex items-center justify-center text-[10px] font-bold shrink-0">
                      ✓
                    </span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              {activeTab.stats.map((st, idx) => (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-3xl bg-[#161e22] border border-[#28383f] flex flex-col justify-between hover:border-(--brand-blue)/50 transition-all duration-300"
                >
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                      {st.big}
                    </span>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-(--accent-green) bg-[#1f2d33] px-3 py-1 rounded-full border border-[#2d3e46]">
                      {st.label}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#8f9fa5] font-medium leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  href="/technology"
                  className="w-full py-4 rounded-2xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-extrabold text-xs uppercase tracking-[0.2em] text-center flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-98 transition-all"
                >
                  <span>Explore Technical Specifications →</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
