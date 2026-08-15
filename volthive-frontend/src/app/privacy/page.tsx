'use client';

import HomeNavbar from '../../components/home/HomeNavbar';
import Footer from '../../components/home/Footer';
import PrivacyContent from '../../components/info/PrivacyContent';
import Reveal from '../../components/common/Reveal';

export default function PrivacyPage() {
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
            <span>SECURITY &amp; PRIVACY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-(--brand-ink) mb-6 leading-[1.1]">
            Privacy Architecture &amp; Data Policy.
          </h1>
          <p className="text-sm sm:text-base text-(--brand-muted) font-medium leading-relaxed">
            Effective Date: January 1, 2026 · Telemetry Security Standard
          </p>
        </div>

        {/* Privacy Content Box */}
        <Reveal direction="up" className="rounded-[2.25rem] bg-white border border-(--brand-border) p-8 sm:p-14 shadow-sm">
          <PrivacyContent />
        </Reveal>

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
