'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const workSteps = [
  {
    step: '01',
    title: 'Universal Plug Connect',
    desc: 'Connect your EV instantly at any station stall across our open network. Full hardware handshake compatibility with CCS2, CHAdeMO, and Type 2 standard connectors.',
    img: '/brand/banner.jpg',
    fallback: '/brand/banner.jpg',
    badge: 'PROTOCOL HANDSHAKE'
  },
  {
    step: '02',
    title: 'AI Tariff Forecasting',
    desc: 'Our predictive Python forecast engine continuously computes optimal 6-hour spot tariff multipliers to optimize fleet energy yields during off-peak windows.',
    img: 'https://i.pinimg.com/1200x/9a/2a/d8/9a2ad8a1a7a5af3471cdbfd276327d4a.jpg',
    fallback: '/owner login/owner login.jpg',
    badge: 'DEMAND TELEMETRY'
  },
  {
    step: '03',
    title: 'Direct POS Settlement',
    desc: 'Zero touchscreen drag friction. Reserve guaranteed 1-hour time windows and stream zero-fee instant checkouts directly via station POS hardware kiosks.',
    img: '/owner login/owner login.jpg',
    fallback: '/brand/banner.jpg',
    badge: 'ZERO GATEWAY FEE'
  }
];

export default function Features() {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  return (
    <section id="services" className="relative z-10 px-6 sm:px-10 py-16 sm:py-24 max-w-[1500px] mx-auto font-sans">
      
      {/* SECTION 1: KEY BENEFITS (Inspired by Volvo EX30 & Volté Hyper widescreen interfaces) */}
      <div className="rounded-3xl sm:rounded-[3rem] border border-(--brand-border) bg-(--brand-card) p-8 sm:p-14 lg:p-18 shadow-[0_30px_90px_-25px_rgba(74,144,164,0.22)] mb-16">
        <div className="text-center mb-14 sm:mb-20">
          <p className="text-[11px] uppercase tracking-[0.28em] text-(--brand-blue) font-black mb-3">Enterprise Capabilities</p>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-(--brand-ink) mb-5">
            Engineered for speed, intelligence & direct sync.
          </h2>
          <p className="text-base sm:text-xl text-(--brand-muted) font-medium max-w-3xl mx-auto leading-relaxed text-balance">
            Unlock the foundational architectural advantages of the VoltHive Aggregator platform — built to eliminate third-party payment gateway friction and guarantee station booking yields.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          
          {/* Benefit 1 */}
          <div className="rounded-3xl border border-(--brand-border) bg-(--surface-soft)/40 p-9 flex flex-col justify-between hover:border-(--brand-blue) transition-all group">
            <div>
              <div className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-(--brand-card) border border-(--brand-border) font-mono font-black text-xs text-(--brand-blue) mb-8 shadow-2xs">
                SPEC ● 01
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-(--brand-ink) mb-3 tracking-tight">Fast & Reliable Grid</h3>
              <p className="text-sm sm:text-base text-(--brand-muted) leading-relaxed font-medium">
                Real-time availability sensors and active plug status monitoring ensure mobility fleets never arrive at broken, offline, or occupied charging stalls.
              </p>
            </div>
            <div className="mt-10 pt-7 border-t border-(--brand-border) flex items-center justify-between font-black text-xs tracking-wider uppercase text-(--brand-blue)">
              <span>Uptime Standard</span>
              <span className="font-mono">99.8% LIVE</span>
            </div>
          </div>

          {/* Benefit 2 (Signature Flagship Widescreen Gradient Card) */}
          <div className="rounded-3xl bg-linear-to-br from-(--brand-blue-deep) via-(--brand-blue) to-(--brand-green) text-white p-9 shadow-xl shadow-(--brand-blue)/25 flex flex-col justify-between relative overflow-hidden group md:-translate-y-3">
            <div className="absolute -top-16 -right-16 w-60 h-60 bg-white/12 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/25 font-mono font-black text-xs text-white mb-8">
                AI ENGINE ● 02
              </div>
              <h3 className="text-2xl lg:text-3xl font-black mb-3 tracking-tight">Predictive AI Tariffs</h3>
              <p className="text-sm sm:text-base text-white/95 leading-relaxed font-medium">
                Our autonomous Python telemetry engine executes automated hourly cycles to forecast 6-hour spot pricing multipliers based on live local weather and grid load datasets.
              </p>
            </div>
            <div className="mt-10 pt-7 border-t border-white/20 flex items-center justify-between font-black text-xs tracking-wider uppercase text-white/90 relative z-10">
              <span>Telemetry Cycle</span>
              <span className="font-mono">HOURLY SYNC</span>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="rounded-3xl border border-(--brand-border) bg-(--surface-soft)/40 p-9 flex flex-col justify-between hover:border-(--brand-green) transition-all group">
            <div>
              <div className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-(--brand-card) border border-(--brand-border) font-mono font-black text-xs text-(--brand-green-deep) mb-8 shadow-2xs">
                SECURITY ● 03
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-(--brand-ink) mb-3 tracking-tight">Direct POS & Biometrics</h3>
              <p className="text-sm sm:text-base text-(--brand-muted) leading-relaxed font-medium">
                Device-scoped Face ID & Fingerprint verification locks driver accounts securely. Station operators settle hardware checkouts directly with zero aggregator gateway cut.
              </p>
            </div>
            <div className="mt-10 pt-7 border-t border-(--brand-border) flex items-center justify-between font-black text-xs tracking-wider uppercase text-(--brand-green-deep)">
              <span>WebAuthn Spec</span>
              <span className="font-mono">FIDO2 NATIVE</span>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: HOW IT WORKS (Inspired directly by Tesla Model S & Volté Hyper visual cards) */}
      <div id="how-to-join" className="rounded-3xl sm:rounded-[3rem] border border-(--brand-border) bg-(--surface-soft)/40 p-8 sm:p-14 lg:p-18">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-(--brand-blue) font-black mb-2.5">Workflow Lifecycle</p>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-(--brand-ink)">
              Effortless execution in three stages.
            </h2>
          </div>
          <Link
            href="/driver-login"
            className="px-8 py-4 rounded-full bg-(--brand-ink) text-white font-extrabold text-xs uppercase tracking-[0.18em] hover:bg-(--brand-blue) transition-all shadow-md self-start md:self-auto shrink-0"
          >
            LAUNCH DRIVER PORTAL →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {workSteps.map((item) => (
            <div key={item.step} className="rounded-3xl border border-(--brand-border) bg-(--brand-card) p-7 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                {/* Widescreen Thumbnail Image Container */}
                <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden mb-7 bg-(--surface-soft) border border-(--brand-border)/80">
                  <Image
                    src={imgErrors[item.step] ? item.fallback : item.img}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-104 transition-transform duration-500"
                    unoptimized
                    onError={() => setImgErrors(prev => ({ ...prev, [item.step]: true }))}
                  />
                  <div className="absolute top-4 left-4 px-3.5 py-1 rounded-xl bg-(--brand-card)/92 backdrop-blur-md border border-(--brand-border) font-mono text-xs font-black text-(--brand-ink)">
                    {item.step}
                  </div>
                  <div className="absolute bottom-4 right-4 px-3 py-1 rounded-lg bg-(--brand-ink)/85 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white">
                    {item.badge}
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-(--brand-ink) mb-3 tracking-tight">{item.title}</h3>
                <p className="text-sm sm:text-base text-(--brand-muted) leading-relaxed font-medium">{item.desc}</p>
              </div>

              <div className="mt-8 pt-5 border-t border-(--brand-border) flex items-center justify-between text-xs font-black tracking-wider uppercase text-(--brand-blue)">
                <span>Explore Lifecycle</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}