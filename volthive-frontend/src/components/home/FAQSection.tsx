'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal from '../common/Reveal';

interface FAQItem {
  q: string;
  a: string;
  category: 'drivers' | 'hosts' | 'technical';
}

const FAQS: FAQItem[] = [
  {
    category: 'drivers',
    q: 'How does pre-arrival slot reservation work?',
    a: 'You can select any participating charging station up to 24 hours in advance and reserve an ultra-fast charging bay. Once booked, your selected bay is locked for you. When you arrive, authenticate with 1-touch Face ID / Fingerprint on your phone or scan the QR code to start charging immediately without waiting in queues.',
  },
  {
    category: 'drivers',
    q: 'What if I am running late due to highway traffic?',
    a: 'Every reservation includes an automated 15-minute grace period buffer. If you get delayed, you can tap "Extend 10 Mins" in the Driver Cockpit app without losing your reserved slot.',
  },
  {
    category: 'drivers',
    q: 'How do I pay for my charging session?',
    a: 'VoltHive supports seamless digital payments via Apple Pay, Google Pay, Visa, Mastercard, and local bank debit cards. Invoicing is automated, itemized with exact kWh delivered, duration, and tax receipts.',
  },
  {
    category: 'drivers',
    q: 'Is VoltHive compatible with my vehicle connector?',
    a: 'Yes. VoltHive stations feature international standards including CCS2, Type 2, CHAdeMO, GB/T, and Tesla NACS. You can filter the live map specifically by your vehicle’s connector type.',
  },
  {
    category: 'hosts',
    q: 'How does VoltHive charge zero gateway fees?',
    a: 'VoltHive directly routes telemetry between your physical EVSE hardware and Stripe Connect or local direct merchant accounts. Unlike legacy aggregators who take 15%–30% of energy sales, 100% of your tariff settles into your bank account.',
  },
  {
    category: 'hosts',
    q: 'What hardware brands can I connect to VoltHive?',
    a: 'VoltHive supports any EV charger compliant with OCPP 1.6J or OCPP 2.0.1 protocols, including ABB, Schneider Electric, Delta, Tritium, Wallbox, Circontrol, and StarCharge.',
  },
  {
    category: 'hosts',
    q: 'How does the Dynamic Pricing AI optimize my revenue?',
    a: 'The AI engine forecasts hourly local demand based on weather, commuter traffic, and utility peak tariffs. It automatically adjusts per-kWh rates to attract drivers during quiet solar hours and maximize yield during high-demand rush hours.',
  },
  {
    category: 'technical',
    q: 'Does VoltHive support ISO 15118 Plug & Charge?',
    a: 'Yes. For vehicles and hardware supporting ISO 15118, drivers can simply plug in the cable and the station will cryptographically authenticate and bill the session automatically without opening an app.',
  },
  {
    category: 'technical',
    q: 'How does the PWA standalone app operate without app stores?',
    a: 'VoltHive is built as a progressive web app (PWA) with hardware WebAuthn biometric security. It takes 0 MB storage footprint on iOS and Android while offering fullscreen native responsiveness and instant updates.',
  },
];

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'drivers' | 'hosts' | 'technical'>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = activeCategory === 'all' ? FAQS : FAQS.filter((f) => f.category === activeCategory);

  return (
    <section id="faq" className="relative z-10 w-full bg-(--background) py-18 sm:py-28 px-5 sm:px-10 overflow-hidden font-sans border-t border-(--brand-border)">
      
      {/* Background Soft Glow */}
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-(--brand-blue)/8 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-[1200px] mx-auto">
        
        {/* Section Header */}
        <Reveal direction="up" className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-(--surface-soft) border border-(--brand-border) font-mono text-[11px] font-black tracking-[0.16em] uppercase text-(--brand-blue-deep) mb-4 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>KNOWLEDGE BASE & GUIDANCE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-(--brand-ink) leading-[1.06] mb-4">
            Frequently Asked Questions.
          </h2>
          <p className="text-sm sm:text-lg text-(--brand-muted) font-medium leading-relaxed">
            Everything you need to know about charging, hosting, dynamic pricing, and enterprise grid operations.
          </p>
        </Reveal>

        {/* Category Pill Filters */}
        <Reveal direction="up" delay={0.1} className="flex justify-center gap-2 mb-10 flex-wrap">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'drivers', label: 'For EV Drivers' },
            { id: 'hosts', label: 'For Station Hosts' },
            { id: 'technical', label: 'Grid & Technology' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id as 'all' | 'drivers' | 'hosts' | 'technical');
                setOpenIndex(null);
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-(--brand-ink) text-white shadow-md'
                  : 'bg-white border border-(--brand-border) text-(--brand-muted) hover:text-(--brand-ink) hover:bg-(--surface-soft)'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </Reveal>

        {/* Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <Reveal key={idx} direction="up" delay={idx * 0.05} className="w-full">
                <div className="rounded-2xl sm:rounded-3xl border border-(--brand-border) bg-white overflow-hidden shadow-xs hover:border-(--brand-blue)/40 transition-all">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-6 sm:p-7 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-bold text-(--brand-ink) tracking-tight">
                      {faq.q}
                    </span>
                    <span className={`w-8 h-8 rounded-full bg-(--surface-soft) text-(--brand-blue-deep) flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-(--brand-blue) text-white' : ''}`}>
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="px-6 sm:px-7 pb-6 sm:pb-7 pt-1 text-sm sm:text-base text-(--brand-muted) font-medium leading-relaxed border-t border-(--brand-border)/60">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom Help CTA Banner */}
        <Reveal direction="up" delay={0.2} className="mt-12 text-center p-8 rounded-3xl bg-(--surface-soft) border border-(--brand-border) flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-base font-black text-(--brand-ink)">Still have questions?</h4>
            <p className="text-xs text-(--brand-muted) mt-0.5 font-medium">Explore our comprehensive guide or chat directly with our technical team.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/guide"
              className="px-6 py-3 rounded-full bg-white border border-(--brand-border) text-(--brand-ink) hover:bg-(--surface-soft) text-xs font-black uppercase tracking-wider shadow-2xs transition-all"
            >
              Driver Guide →
            </Link>
            <Link
              href="/hosts"
              className="px-6 py-3 rounded-full bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white text-xs font-black uppercase tracking-wider shadow-md hover:brightness-105 transition-all"
            >
              Host Guide →
            </Link>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
