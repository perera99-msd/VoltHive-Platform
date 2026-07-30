'use client';

import { motion, Variants } from 'framer-motion';
import Image from 'next/image';

export default function PWAGuide() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.25, duration: 1, ease: 'easeOut' }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: 'easeOut' }
    }
  };

  return (
    <section id="pwa-guide" className="relative z-10 w-full min-h-[90dvh] bg-(--surface-soft)/40 flex flex-col justify-center items-center py-16 sm:py-24 px-5 sm:px-10 overflow-hidden font-sans border-t border-(--brand-border)">
      
      {/* Background Soft Radial Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-linear-to-b from-(--brand-blue)/10 to-(--brand-green)/10 blur-[140px] rounded-full pointer-events-none" />

      <motion.div 
        className="max-w-[1500px] w-full mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div variants={itemVariants} className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-(--brand-card) border border-(--brand-border) font-mono text-[10px] sm:text-xs font-black tracking-[0.16em] sm:tracking-[0.18em] uppercase text-(--brand-blue-deep) mb-3.5 sm:mb-4 shadow-2xs">
            <span>INSTANT MOBILE INSTALL</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-(--brand-ink) leading-[1.06] mb-4 sm:mb-5">
            Install the VoltHive App.
          </h2>
          <p className="text-sm sm:text-xl text-(--brand-muted) font-medium leading-relaxed">
            Get the full native app experience instantly on iOS & Android. Zero app store downloads, zero gateway fees. Save directly to your home screen.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
          
          {/* iOS Card */}
          <motion.div 
            variants={itemVariants} 
            className="rounded-[2rem] sm:rounded-[2.5rem] border border-(--brand-border) bg-(--brand-card) p-6 sm:p-10 shadow-lg hover:shadow-2xl transition-all flex flex-col items-center text-center"
          >
            <div className="w-full max-w-[220px] sm:max-w-xs aspect-[9/18] rounded-[2rem] sm:rounded-[2.5rem] border border-(--brand-border) bg-(--surface-soft)/40 p-2 shadow-inner relative overflow-hidden mb-6 sm:mb-8 group">
              <Image 
                src="/hero/pwa_ios_guide.png" 
                alt="iOS PWA Installation Guide" 
                fill 
                className="object-cover rounded-[1.6rem] sm:rounded-[2rem] group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-(--brand-ink) mb-4 sm:mb-6">Apple iOS (Safari)</h3>
            <ol className="text-left space-y-3 sm:space-y-4 text-(--brand-muted) font-semibold text-xs sm:text-base max-w-xs w-full">
              <li className="flex gap-3 sm:gap-4 items-center">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-(--surface-soft) text-(--brand-ink) flex items-center justify-center font-bold text-xs sm:text-sm">1</span>
                <span>Open <strong>volthive.com</strong> in Safari</span>
              </li>
              <li className="flex gap-3 sm:gap-4 items-center">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-(--surface-soft) text-(--brand-ink) flex items-center justify-center font-bold text-xs sm:text-sm">2</span>
                <span>Tap the <strong>Share</strong> button</span>
              </li>
              <li className="flex gap-3 sm:gap-4 items-center">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-(--brand-blue) text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shadow-(--brand-blue)/30">3</span>
                <span className="text-(--brand-ink)">Tap <strong>Add to Home Screen</strong></span>
              </li>
            </ol>
          </motion.div>

          {/* Android Card */}
          <motion.div 
            variants={itemVariants} 
            className="rounded-[2rem] sm:rounded-[2.5rem] border border-(--brand-border) bg-(--brand-card) p-6 sm:p-10 shadow-lg hover:shadow-2xl transition-all flex flex-col items-center text-center"
          >
            <div className="w-full max-w-[220px] sm:max-w-xs aspect-[9/18] rounded-[2rem] sm:rounded-[2.5rem] border border-(--brand-border) bg-(--surface-soft)/40 p-2 shadow-inner relative overflow-hidden mb-6 sm:mb-8 group">
              <Image 
                src="/hero/pwa_android_guide.png" 
                alt="Android PWA Installation Guide" 
                fill 
                className="object-cover rounded-[1.6rem] sm:rounded-[2rem] group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-(--brand-ink) mb-4 sm:mb-6">Android (Chrome)</h3>
            <ol className="text-left space-y-3 sm:space-y-4 text-(--brand-muted) font-semibold text-xs sm:text-base max-w-xs w-full">
              <li className="flex gap-3 sm:gap-4 items-center">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-(--surface-soft) text-(--brand-ink) flex items-center justify-center font-bold text-xs sm:text-sm">1</span>
                <span>Open <strong>volthive.com</strong> in Chrome</span>
              </li>
              <li className="flex gap-3 sm:gap-4 items-center">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-(--surface-soft) text-(--brand-ink) flex items-center justify-center font-bold text-xs sm:text-sm">2</span>
                <span>Tap the <strong>Menu (⋮)</strong> icon</span>
              </li>
              <li className="flex gap-3 sm:gap-4 items-center">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-(--brand-green-deep) text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shadow-(--brand-green-deep)/30">3</span>
                <span className="text-(--brand-ink)">Tap <strong>Install App</strong></span>
              </li>
            </ol>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}
