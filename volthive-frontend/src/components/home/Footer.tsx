'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-(--brand-border) bg-(--brand-card) pt-16 pb-12 text-(--brand-ink) font-sans">
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-16 border-b border-(--brand-border)">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-block">
              <Image
                src="/brand/logo-with-slogan.png"
                alt="VoltHive Platform"
                width={190}
                height={55}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-(--brand-muted) max-w-sm leading-relaxed font-medium">
              Enterprise Aggregator EV Network & Station Controller Platform. Stream active connectors, reserve 1-hour windows, and settle checkouts instantly via POS kiosks.
            </p>
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-(--brand-blue)">
              <span>PROTOCOL v2.1 STANDARD</span>
              <span>● FIDO2 NATIVE</span>
            </div>
          </div>

          {/* COL 1: ARCHITECTURE */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-[0.2em] uppercase text-(--brand-ink)">System</h4>
            <ul className="space-y-2.5 text-sm font-medium text-(--brand-muted)">
              <li><Link href="/#about-us" className="hover:text-(--brand-blue) transition-colors">Grid Architecture</Link></li>
              <li><Link href="/#services" className="hover:text-(--brand-blue) transition-colors">Core Capabilities</Link></li>
              <li><Link href="/#news" className="hover:text-(--brand-blue) transition-colors">Live Telemetry</Link></li>
              <li><Link href="/#partners" className="hover:text-(--brand-blue) transition-colors">Hardware Handshake</Link></li>
            </ul>
          </div>

          {/* COL 2: SURFACES */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-[0.2em] uppercase text-(--brand-ink)">Portals</h4>
            <ul className="space-y-2.5 text-sm font-medium text-(--brand-muted)">
              <li><Link href="/driver-login" className="hover:text-(--brand-blue) transition-colors">Driver Dashboard</Link></li>
              <li><Link href="/owner-login" className="hover:text-(--brand-blue) transition-colors">Admin Center</Link></li>
              <li><Link href="/download-app" className="hover:text-(--brand-blue) transition-colors">Standalone PWA</Link></li>
              <li><Link href="/driver-login" className="hover:text-(--brand-blue) transition-colors">WebAuthn Biometrics</Link></li>
            </ul>
          </div>

          {/* COL 3: SPECIFICATIONS */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-[0.2em] uppercase text-(--brand-ink)">Compliance</h4>
            <ul className="space-y-2.5 text-sm font-medium text-(--brand-muted)">
              <li><span className="text-(--brand-ink)">0% Gateway Fee</span></li>
              <li><span className="text-(--brand-ink)">99.8% Network Uptime</span></li>
              <li><span className="text-(--brand-ink)">Hourly AI Cycle Sync</span></li>
              <li><span className="text-(--brand-ink)">ISO 15118 Ready</span></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT ROW */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-(--brand-muted)">
          <p>© {new Date().getFullYear()} VoltHive Technologies Inc. All enterprise rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/#about-us" className="hover:underline">Privacy Architecture</Link>
            <Link href="/#services" className="hover:underline">Terms of Execution</Link>
            <Link href="/#news" className="hover:underline">Telemetry Security</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}