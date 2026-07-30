'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer id="footer" className="relative z-10 bg-(--brand-card) text-(--brand-ink) font-sans border-t border-(--brand-border) overflow-hidden">
      
      {/* Brand Gradient Top CTA Banner */}
      <div className="relative py-24 px-6 sm:px-10 bg-linear-to-r from-(--brand-blue-deep) via-(--brand-blue) to-(--brand-green) text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-[1500px] mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              Ready to electrify your fleet?
            </h2>
            <p className="text-base sm:text-xl text-white/90 font-medium leading-relaxed">
              Join the largest decentralized AI-powered EV charging network. Stream direct hardware settlements with zero gateway fees.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Link 
              href="/driver-login" 
              className="px-9 py-4.5 rounded-full text-xs font-black uppercase tracking-[0.18em] bg-white text-(--brand-ink) hover:bg-white/90 transition-all shadow-xl flex items-center justify-center"
            >
              Driver Portal →
            </Link>
            <Link 
              href="/owner-login" 
              className="px-9 py-4.5 rounded-full text-xs font-black uppercase tracking-[0.18em] bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/30 transition-all flex items-center justify-center"
            >
              Admin Center
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 pt-20 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-5 space-y-6 pr-6">
            <Link href="/" className="inline-block">
              <Image
                src="/brand/logo-with-slogan.png"
                alt="VoltHive Platform"
                width={200}
                height={60}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm sm:text-base text-(--brand-muted) leading-relaxed font-medium max-w-sm">
              The enterprise aggregator EV network and station controller platform. AI-powered dynamic pricing, zero gateway fees, and instant reservations.
            </p>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-(--brand-green) animate-pulse" />
              <span className="font-mono text-xs font-bold text-(--brand-blue-deep) tracking-widest uppercase">
                SYSTEMS OPERATIONAL ● PROTOCOL v2.4
              </span>
            </div>
          </div>

          {/* COL 1: PRODUCT */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black tracking-[0.18em] uppercase text-(--brand-ink)">Product</h4>
            <ul className="space-y-3 text-sm font-semibold text-(--brand-muted)">
              <li><Link href="/driver-login" className="hover:text-(--brand-blue) transition-colors">Driver App (PWA)</Link></li>
              <li><Link href="/owner-login" className="hover:text-(--brand-blue) transition-colors">Station Admin Center</Link></li>
              <li><Link href="#services" className="hover:text-(--brand-blue) transition-colors">Dynamic Pricing AI</Link></li>
              <li><Link href="#hero" className="hover:text-(--brand-blue) transition-colors">Live Telemetry</Link></li>
            </ul>
          </div>

          {/* COL 2: RESOURCES */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black tracking-[0.18em] uppercase text-(--brand-ink)">Resources</h4>
            <ul className="space-y-3 text-sm font-semibold text-(--brand-muted)">
              <li><Link href="#pwa-guide" className="hover:text-(--brand-blue) transition-colors">PWA Installation</Link></li>
              <li><Link href="#services" className="hover:text-(--brand-blue) transition-colors">Hardware Handshake</Link></li>
              <li><Link href="#hero" className="hover:text-(--brand-blue) transition-colors">Grid Architecture</Link></li>
              <li><Link href="/driver-login" className="hover:text-(--brand-blue) transition-colors">Biometric FIDO2</Link></li>
            </ul>
          </div>

          {/* COL 3: SPECIFICATIONS */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black tracking-[0.18em] uppercase text-(--brand-ink)">Compliance & Specs</h4>
            <ul className="space-y-3 text-sm font-medium text-(--brand-muted)">
              <li><span className="text-(--brand-ink) font-bold">0% Gateway Fee</span> — Direct Settlements</li>
              <li><span className="text-(--brand-ink) font-bold">99.9% Telemetry Uptime</span></li>
              <li><span className="text-(--brand-ink) font-bold">ISO 15118</span> Plug & Charge Ready</li>
              <li><span className="text-(--brand-ink) font-bold">Python Predictor</span> Engine v2.4</li>
            </ul>
          </div>

        </div>
      </div>

      {/* BOTTOM COPYRIGHT ROW */}
      <div className="border-t border-(--brand-border) bg-(--surface-soft)/30">
        <div className="max-w-[1500px] mx-auto px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-(--brand-muted)">
          <p>© {new Date().getFullYear()} VoltHive Technologies Inc. All enterprise rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            <Link href="#hero" className="hover:text-(--brand-ink) transition-colors">Privacy Architecture</Link>
            <Link href="#services" className="hover:text-(--brand-ink) transition-colors">Terms of Execution</Link>
            <Link href="#hero" className="hover:text-(--brand-ink) transition-colors">Telemetry Security</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}