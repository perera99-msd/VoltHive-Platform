import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section id="about-us" className="relative pt-24 sm:pt-28 pb-14 lg:pt-48 lg:pb-24 px-4 sm:px-6 max-w-7xl mx-auto z-10 overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-md h-64 bg-linear-to-r from-(--accent-blue)/20 via-(--brand-card) to-(--accent-green)/20 blur-3xl -z-10 rounded-full" />

      <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center lg:text-left vh-rise-in max-w-2xl mx-auto lg:mx-0"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-(--brand-card) border border-(--brand-border) shadow-sm text-(--brand-muted) text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-6 sm:mb-8">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--accent-green) opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-(--brand-green)"></span>
            </span>
            One Network. Smart Charging.
          </div>

          <h1 className="mx-auto lg:mx-0 max-w-[12ch] sm:max-w-[14ch] text-[2.45rem] sm:text-5xl lg:text-[4.2rem] font-semibold tracking-tight mb-4 sm:mb-6 leading-[0.95] sm:leading-[1.05] text-(--brand-ink) text-balance">
            <span className="block">Premium EV charging,</span>
            <span className="block text-transparent bg-clip-text bg-linear-to-r from-(--brand-blue) to-(--brand-green)">
              orchestrated intelligently.
            </span>
          </h1>

          <p className="text-[0.98rem] sm:text-lg text-(--brand-muted) max-w-88 sm:max-w-xl mx-auto lg:mx-0 mb-7 sm:mb-10 leading-relaxed font-medium text-balance px-1 sm:px-0">
            Book instantly, route efficiently, and optimize station operations with a beautifully connected EV platform designed for drivers and owners.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center justify-center lg:justify-start max-w-88 sm:max-w-none mx-auto lg:mx-0">
            <Link href="/login" className="w-full sm:w-auto px-7 py-3.5 sm:px-8 sm:py-4 rounded-full bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-(--brand-card) font-semibold text-sm sm:text-base hover:brightness-105 active:scale-95 transition-all shadow-[0_12px_24px_-10px_rgba(36,84,196,0.6)] flex items-center justify-center">
              Start Charging
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-7 py-3.5 sm:px-8 sm:py-4 rounded-full bg-(--brand-card) border border-(--brand-border) text-(--brand-ink) font-semibold text-sm sm:text-base hover:border-(--accent-blue) hover:bg-(--accent-blue)/10 active:scale-95 transition-all flex items-center justify-center shadow-sm">
              Partner with VoltHive
            </Link>
          </div>
        </motion.div>

        {/* Hero Image Container */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-6 lg:mt-0 w-full max-w-[88%] sm:max-w-md mx-auto lg:max-w-none vh-float-soft"
        >
          <div className="absolute -inset-4 bg-linear-to-br from-(--accent-blue)/20 to-(--accent-green)/20 blur-2xl rounded-3xl" />
          <div className="relative rounded-3xl sm:rounded-4xl overflow-hidden border border-(--brand-border) shadow-xl bg-(--brand-card)">
            <Image
              src="/brand/banner.jpg"
              alt="VoltHive banner"
              width={1366}
              height={768}
              className="w-full h-auto object-cover"
              priority
            />
          </div>

          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 sm:-bottom-6 bg-(--brand-card)/95 backdrop-blur rounded-xl sm:rounded-2xl border border-(--brand-border) px-4 py-3 sm:px-5 sm:py-4 shadow-lg w-10/12 sm:w-auto text-center sm:text-left">
            <Image
              src="/brand/logo-with-slogan.png"
              alt="VoltHive slogan logo"
              width={220}
              height={58}
              className="h-6 sm:h-9 w-auto mx-auto sm:mx-0"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}