'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';

export default function PWAGuide() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, duration: 0.8, ease: 'easeOut' }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  return (
    <section id="pwa-guide" className="relative z-10 w-full min-h-[90dvh] bg-(--background) flex flex-col justify-center items-center py-16 sm:py-24 px-5 sm:px-10 overflow-hidden font-sans border-t border-(--brand-border)">
      
      {/* Background Soft Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-linear-to-r from-(--brand-blue)/10 via-(--brand-green)/10 to-transparent blur-[120px] rounded-full pointer-events-none -z-10" />

      <motion.div 
        className="max-w-[1400px] w-full mx-auto relative z-10 space-y-12 sm:space-y-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        
        {/* =========================================================================
            1. CLEAN SECTION HEADER
        ========================================================================= */}
        <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto space-y-3.5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-(--brand-border) font-mono text-[10px] sm:text-xs font-black tracking-[0.18em] uppercase text-(--brand-blue-deep) shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>PROGRESSIVE WEB APP (PWA)</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-(--brand-ink) leading-[1.08]">
            Install the VoltHive Driver App.
          </h2>

          <p className="text-sm sm:text-base text-(--brand-muted) font-medium leading-relaxed max-w-2xl mx-auto text-balance">
            Run VoltHive as a native smartphone app directly from your browser. No app store downloads, 0 MB storage footprint, with 1-touch Face ID / Fingerprint login.
          </p>
        </motion.div>

        {/* =========================================================================
            2. 3 QUICK BENEFIT PILLS
        ========================================================================= */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-(--brand-border) shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-(--surface-soft) text-(--brand-blue-deep) flex items-center justify-center font-bold text-sm shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-blue-deep)"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-(--brand-ink)">0 MB Storage</h4>
              <p className="text-xs text-(--brand-muted) mt-0.5">Zero download size, automatic instant updates.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-(--brand-border) shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-(--surface-tint) text-(--brand-green-deep) flex items-center justify-center font-bold text-sm shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-green-deep)"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-(--brand-ink)">Face ID &amp; Touch ID</h4>
              <p className="text-xs text-(--brand-muted) mt-0.5">1-touch hardware biometric unlock.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-(--brand-border) shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-(--surface-soft) text-(--brand-blue-deep) flex items-center justify-center font-bold text-sm shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-(--brand-blue-deep)"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-(--brand-ink)">Fullscreen Cockpit</h4>
              <p className="text-xs text-(--brand-muted) mt-0.5">Standalone mode with zero browser bars.</p>
            </div>
          </div>
        </motion.div>

        {/* =========================================================================
            3. CLEAN 2-COLUMN INSTALLATION GUIDES WITH IMAGES
        ========================================================================= */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          
          {/* iOS Card */}
          <div className="rounded-4xl border border-(--brand-border) bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 items-center">
            {/* iOS Image Mockup */}
            <div className="w-full sm:w-48 aspect-[9/16] relative rounded-2xl overflow-hidden border border-(--brand-border) bg-(--surface-soft)/40 shrink-0 shadow-xs">
              <Image
                src="/hero/pwa_ios_clean.jpg"
                alt="Apple iOS Safari PWA Installation"
                fill
                sizes="(max-width: 640px) 100vw, 200px"
                className="object-cover"
              />
            </div>

            {/* iOS Steps */}
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-(--brand-ink) flex items-center gap-2">
                  <svg className="w-4 h-4 fill-current text-(--brand-ink)" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  <span>Apple iOS (Safari)</span>
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase text-(--brand-blue-deep) bg-(--surface-soft) px-2.5 py-1 rounded-full">
                  Safari
                </span>
              </div>

              <ol className="space-y-3 text-xs sm:text-sm text-(--brand-muted)">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-(--surface-soft) text-(--brand-blue-deep) font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Open <strong>volthive.com</strong> in default Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-(--surface-soft) text-(--brand-blue-deep) font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Tap the <strong>Share</strong> button on the toolbar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-(--brand-blue) text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">3</span>
                  <span className="text-(--brand-ink) font-semibold">Tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong></span>
                </li>
              </ol>
            </div>
          </div>

          {/* Android Card */}
          <div className="rounded-4xl border border-(--brand-border) bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 items-center">
            {/* Android Image Mockup */}
            <div className="w-full sm:w-48 aspect-[9/16] relative rounded-2xl overflow-hidden border border-(--brand-border) bg-(--surface-soft)/40 shrink-0 shadow-xs">
              <Image
                src="/hero/pwa_android_clean.jpg"
                alt="Android Chrome PWA Installation"
                fill
                sizes="(max-width: 640px) 100vw, 200px"
                className="object-cover"
              />
            </div>

            {/* Android Steps */}
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-(--brand-ink) flex items-center gap-2">
                  <svg className="w-4 h-4 fill-current text-(--brand-green-deep)" viewBox="0 0 24 24"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/></svg>
                  <span>Android (Chrome)</span>
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase text-(--brand-green-deep) bg-(--surface-tint) px-2.5 py-1 rounded-full">
                  Chrome
                </span>
              </div>

              <ol className="space-y-3 text-xs sm:text-sm text-(--brand-muted)">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-(--surface-soft) text-(--brand-ink) font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Open <strong>volthive.com</strong> in Google Chrome</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-(--surface-soft) text-(--brand-ink) font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Tap the <strong>Add to Home screen</strong> prompt</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-(--brand-green) text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">3</span>
                  <span className="text-(--brand-ink) font-semibold">Tap <strong>Install</strong> to launch from App Drawer</span>
                </li>
              </ol>
            </div>
          </div>

        </motion.div>

        {/* =========================================================================
            4. BOTTOM ACTION ROW
        ========================================================================= */}
        <motion.div variants={itemVariants} className="pt-4 border-t border-(--brand-border) flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-(--brand-muted)">
            <span className="w-2 h-2 rounded-full bg-(--brand-green)" />
            <span>Compatible with all iOS 14+ and Android 8+ mobile devices</span>
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-center">
            <Link
              href="/download-app"
              className="px-5 py-3 rounded-full bg-white border border-(--brand-border) hover:bg-(--surface-soft) text-(--brand-ink) font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-2xs active:scale-95"
            >
              Full Installation Guide
            </Link>
            <Link
              href="/driver-login"
              className="px-6 py-3 rounded-full bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-extrabold text-[11px] uppercase tracking-wider hover:brightness-105 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>Launch Driver App (PWA) →</span>
            </Link>
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}

