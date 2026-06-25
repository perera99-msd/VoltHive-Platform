'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HomeNavbar from '../../components/home/HomeNavbar';
import Footer from '../../components/home/Footer';

export default function DownloadAppPage() {
  const [selectedOs, setSelectedOs] = useState<'ios' | 'android'>('ios');

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-[#1a1a1a] font-sans flex flex-col selection:bg-[#4a90a4]/20">
      
      {/* Top Floating Navbar */}
      <HomeNavbar />

      {/* Main Content Area */}
      <main className="flex-1 pt-32 sm:pt-40 pb-24 px-6 sm:px-10 max-w-[1400px] mx-auto w-full relative z-10">
        
        {/* Subtle Ambient Background Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] bg-linear-to-tr from-[#e8f3ef] via-white to-[#dcefe8] blur-3xl -z-10 rounded-full pointer-events-none opacity-90" />

        {/* HERO SHOWCASE HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#e0e5e3] shadow-2xs font-mono text-xs font-black uppercase tracking-widest text-[#4a90a4] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#6cb567] animate-pulse" />
            <span>INSTANT STANDALONE APP</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#1a1a1a] mb-6 leading-[1.08] text-balance">
            Install the VoltHive Driver App.
          </h1>
          <p className="text-base sm:text-xl text-[#6b6f72] font-medium leading-relaxed text-balance">
            Get instant 1-tap access to live charging slots, hardware biometric login (Face ID & Fingerprint), and your real-time EV garage. Runs natively on your smartphone without app store downloads.
          </p>
        </div>

        {/* INTERACTIVE OS SELECTOR PILL */}
        <div className="flex justify-center mb-14">
          <div className="p-1.5 rounded-2xl bg-white border border-[#e0e5e3] shadow-md inline-flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedOs('ios')}
              className={`px-7 py-3 rounded-xl font-sans text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2.5 ${
                selectedOs === 'ios'
                  ? 'bg-[#1a1a1a] text-white shadow-md scale-[1.02]'
                  : 'text-[#6b6f72] hover:text-[#1a1a1a] hover:bg-[#f5f7f6]'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <span>Apple iOS (Safari)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOs('android')}
              className={`px-7 py-3 rounded-xl font-sans text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2.5 ${
                selectedOs === 'android'
                  ? 'bg-[#4a90a4] text-white shadow-md scale-[1.02]'
                  : 'text-[#6b6f72] hover:text-[#1a1a1a] hover:bg-[#f5f7f6]'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/></svg>
              <span>Android (Chrome)</span>
            </button>
          </div>
        </div>

        {/* SETUP GUIDE & APP MOCKUP GRID */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          
          {/* LEFT COLUMN: HUMAN-FRIENDLY 3-STEP SEQUENCE */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight">
                  3-Step Quick Installation Guide
                </h2>
                <span className="text-xs font-bold font-mono text-[#4a90a4] bg-[#e8f3ef] px-3 py-1 rounded-full uppercase">
                  {selectedOs === 'ios' ? 'iOS Safari Only' : 'Android Chrome'}
                </span>
              </div>

              {selectedOs === 'ios' ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-[#e0e5e3] bg-white p-6 sm:p-7 shadow-xs hover:border-[#4a90a4] transition-all flex gap-5 items-start">
                    <div className="w-11 h-11 rounded-2xl bg-[#e8f3ef] border border-[#dcefe8] flex items-center justify-center font-mono font-black text-sm text-[#4a90a4] shrink-0">
                      01
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] mb-1">Open volthive.com in Safari</h3>
                      <p className="text-sm text-[#6b6f72] leading-relaxed">
                        Open the default **Safari** browser on your iPhone or iPad. Note that Apple restricts standalone app installation on third-party browsers like Chrome or Firefox.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#e0e5e3] bg-white p-6 sm:p-7 shadow-xs hover:border-[#4a90a4] transition-all flex gap-5 items-start">
                    <div className="w-11 h-11 rounded-2xl bg-[#e8f3ef] border border-[#dcefe8] flex items-center justify-center font-mono font-black text-sm text-[#4a90a4] shrink-0">
                      02
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] mb-1">Tap the Share Button</h3>
                      <p className="text-sm text-[#6b6f72] leading-relaxed">
                        Tap the standard **Share icon** located at the bottom center of your Safari toolbar (the square box with an upward pointing arrow).
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#e0e5e3] bg-white p-6 sm:p-7 shadow-xs hover:border-[#6cb567] transition-all flex gap-5 items-start">
                    <div className="w-11 h-11 rounded-2xl bg-[#e8f3ef] border border-[#dcefe8] flex items-center justify-center font-mono font-black text-sm text-[#5ba857] shrink-0">
                      03
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] mb-1">Select "Add to Home Screen"</h3>
                      <p className="text-sm text-[#6b6f72] leading-relaxed">
                        Scroll down the share sheet and tap **Add to Home Screen**, then tap **Add** in the top right. Your VoltHive app icon will immediately appear on your phone screen!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-[#e0e5e3] bg-white p-6 sm:p-7 shadow-xs hover:border-[#4a90a4] transition-all flex gap-5 items-start">
                    <div className="w-11 h-11 rounded-2xl bg-[#e8f3ef] border border-[#dcefe8] flex items-center justify-center font-mono font-black text-sm text-[#4a90a4] shrink-0">
                      01
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] mb-1">Open volthive.com in Chrome</h3>
                      <p className="text-sm text-[#6b6f72] leading-relaxed">
                        Open **Google Chrome** on your Android smartphone or tablet and visit our main portal URL.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#e0e5e3] bg-white p-6 sm:p-7 shadow-xs hover:border-[#4a90a4] transition-all flex gap-5 items-start">
                    <div className="w-11 h-11 rounded-2xl bg-[#e8f3ef] border border-[#dcefe8] flex items-center justify-center font-mono font-black text-sm text-[#4a90a4] shrink-0">
                      02
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] mb-1">Accept the Automatic Install Banner</h3>
                      <p className="text-sm text-[#6b6f72] leading-relaxed">
                        Tap the automated **"Add VoltHive to Home Screen"** banner at the bottom of the page. Or tap Chrome's 3-dot menu and choose **Install App**.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#e0e5e3] bg-white p-6 sm:p-7 shadow-xs hover:border-[#6cb567] transition-all flex gap-5 items-start">
                    <div className="w-11 h-11 rounded-2xl bg-[#e8f3ef] border border-[#dcefe8] flex items-center justify-center font-mono font-black text-sm text-[#5ba857] shrink-0">
                      03
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] mb-1">Launch Directly from App Drawer</h3>
                      <p className="text-sm text-[#6b6f72] leading-relaxed">
                        Tap the new VoltHive app icon. The app launches in dedicated fullscreen mode with 1-touch Face ID / Fingerprint sensor login!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 mt-6 border-t border-[#e0e5e3] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6b6f72]">
                <span className="w-2 h-2 rounded-full bg-[#4a90a4]" />
                <span>Requires no app store storage footprint</span>
              </div>
              <Link
                href="/driver-login"
                className="px-7 py-3.5 rounded-full bg-[#1a1a1a] hover:bg-[#4a90a4] text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
              >
                Go to Driver Login →
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: LUXURY PHONE APP COCKPIT PREVIEW */}
          <div className="lg:col-span-5 flex">
            <div className="w-full rounded-3xl sm:rounded-[2.75rem] border border-[#e0e5e3] bg-linear-to-b from-white via-[#f5f7f6] to-[#e8f3ef] p-8 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between text-center">
              
              {/* Top Status */}
              <div className="flex justify-between items-center pb-6 border-b border-[#e0e5e3]/80 text-left">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#4a90a4]">Standalone Mode</p>
                  <p className="text-sm font-black text-[#1a1a1a]">App Sandbox Experience</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#6cb567]/15 text-[#5ba857] text-[11px] font-bold font-mono uppercase">
                  ● ACTIVE
                </div>
              </div>

              {/* Center Interactive Mockup Screen Card */}
              <div className="my-8 py-10 px-6 rounded-3xl bg-white border border-[#e0e5e3] shadow-xl relative overflow-hidden text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-tr from-[#4a90a4] to-[#6cb567] p-0.5 shadow-md">
                  <div className="w-full h-full bg-white rounded-[0.9rem] flex items-center justify-center font-mono font-black text-xl text-[#1a1a1a]">
                    VH
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-[#1a1a1a]">Driver Cockpit Portal</h3>
                  <p className="text-xs text-[#6b6f72] mt-1 font-medium">Biometric Hardware Security Linked</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#e8f3ef] border border-[#dcefe8] text-xs font-bold text-[#3f7f90] flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-[#5ba857]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                  <span>Face ID / Fingerprint Enabled</span>
                </div>
              </div>

              {/* Bottom Feature Bullets */}
              <div className="space-y-3 text-left bg-white/60 p-5 rounded-2xl border border-[#e0e5e3]/60">
                <div className="flex items-start gap-2.5 text-xs font-semibold text-[#1a1a1a]">
                  <span className="text-[#6cb567] font-bold">✓</span>
                  <span>**Removes Marketing Site**: Website navigation vanishes instantly upon launching installed app.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs font-semibold text-[#1a1a1a]">
                  <span className="text-[#6cb567] font-bold">✓</span>
                  <span>**Guaranteed Slot Booking**: Tap 1-hour grid buttons (`00:00 - 01:00`) for zero touchscreen friction.</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
