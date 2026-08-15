'use client';

import Link from 'next/link';
import HomeNavbar from '../../components/home/HomeNavbar';
import Footer from '../../components/home/Footer';
import Reveal from '../../components/common/Reveal';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-(--background) text-(--brand-ink) font-sans flex flex-col selection:bg-(--accent-blue)/30">
      
      {/* Top Navbar */}
      <HomeNavbar />

      {/* Main Content */}
      <main className="flex-1 pt-32 sm:pt-40 pb-24 px-5 sm:px-10 max-w-[1100px] mx-auto w-full relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-(--brand-border) shadow-2xs font-mono text-xs font-black uppercase tracking-widest text-(--brand-blue-deep) mb-6">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>LEGAL &amp; COMPLIANCE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-(--brand-ink) mb-6 leading-[1.1]">
            Terms of Execution &amp; Service SLAs.
          </h1>
          <p className="text-sm sm:text-base text-(--brand-muted) font-medium leading-relaxed">
            Effective Date: January 1, 2026 · Standard Operating Protocol v2.4
          </p>
        </div>

        {/* Legal Sections Box */}
        <Reveal direction="up" className="rounded-[2.25rem] bg-white border border-(--brand-border) p-8 sm:p-14 shadow-sm space-y-8 text-sm sm:text-base leading-relaxed text-(--brand-ink)/90">
          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-(--brand-ink)">1. Platform Overview &amp; Agreement</h2>
            <p className="text-(--brand-muted)">
              VoltHive Technologies Inc. provides an aggregator protocol connecting independent EV station hardware hosts with electric vehicle drivers. By using the platform or booking a charging session, you agree to comply with these terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-(--brand-ink)">2. Pre-Arrival Slot Reservations &amp; Grace Buffers</h2>
            <p className="text-(--brand-muted)">
              When you reserve a slot, the physical charger is reserved exclusively for your vehicle. Each booking includes an automated <strong>15-minute grace period buffer</strong>. If a driver does not arrive or initiate a charging session within 15 minutes of the scheduled start time, the bay may be re-released to public queue.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-(--brand-ink)">3. Dynamic Tariffs &amp; Payment Settlement</h2>
            <p className="text-(--brand-muted)">
              All prices shown on the live map and checkout drawers are in Sri Lankan Rupees (LKR) per kilowatt-hour (kWh). Prices are transparent with zero hidden aggregator surcharges. Payment is authorized prior to socket unlock and captured immediately upon physical session completion.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-(--brand-ink)">4. Host Hardware Responsibility &amp; Safety</h2>
            <p className="text-(--brand-muted)">
              Station hosts are responsible for maintaining hardware in compliance with local electrical grid safety standards (CEB/LECO). VoltHive monitors live telemetry and will automatically mark chargers as OFFLINE if critical isolation or ground fault errors are detected.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-(--brand-ink)">5. Overstay &amp; Etiquette Policy</h2>
            <p className="text-(--brand-muted)">
              To keep charging bays accessible for all commuters, vehicles that remain parked for more than 20 minutes after completing a full charge (100% SOC) may be subject to an overstay deterrence fee as configured by the station host.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-(--brand-ink)">6. Service Level Agreement (SLA) &amp; Uptime</h2>
            <p className="text-(--brand-muted)">
              VoltHive aims for 99.9% uptime across its cloud telemetry and reservation APIs. Scheduled maintenance windows will be announced in advance through the driver and host dashboards.
            </p>
          </section>
        </Reveal>

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
