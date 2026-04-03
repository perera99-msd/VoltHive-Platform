'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function MyGarage() {
  return (
    <section className="space-y-6 relative overflow-hidden">
      <div className="absolute -top-24 right-0 w-72 h-72 rounded-full bg-(--accent-blue)/16 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 left-0 w-72 h-72 rounded-full bg-(--accent-green)/14 blur-[120px] pointer-events-none" />

      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-4xl border border-(--brand-card)/70 bg-(--brand-card)/80 backdrop-blur-2xl p-6 md:p-7 shadow-[0_26px_70px_-46px_rgba(9,32,52,0.55)]"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-(--brand-muted)">Vehicle Profiles</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-(--brand-ink) mt-2">My Garage</h1>
        <p className="text-(--brand-muted) text-sm mt-2 font-medium">Keep your EV details updated for accurate compatibility, route confidence, and cleaner charging recommendations.</p>
      </motion.header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-4xl border border-(--brand-card)/70 bg-(--brand-card)/82 backdrop-blur-2xl p-6 shadow-[0_20px_45px_-30px_rgba(9,32,52,0.5)]"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="px-3 py-1 rounded-full bg-(--accent-blue)/14 text-(--brand-blue) text-[11px] font-semibold uppercase tracking-[0.14em]">Primary Vehicle</span>
            <span className="px-3 py-1 rounded-full bg-(--accent-green)/14 text-(--brand-green-deep) text-[11px] font-semibold uppercase tracking-[0.14em]">Active</span>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="w-24 h-24 rounded-3xl border border-(--brand-border) bg-(--background) flex items-center justify-center shrink-0">
              <Image src="/icons/car.png" alt="Nissan Leaf" width={56} height={56} className="w-14 h-14 object-contain opacity-90" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-(--brand-ink)">Nissan Leaf 2020</h2>
              <p className="text-sm text-(--brand-muted)">40kWh Battery · Estimated 330km range</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-(--brand-border) bg-(--background)/75 p-3.5">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-(--brand-muted)">Connector</p>
              <p className="text-sm font-semibold text-(--brand-ink) mt-1">CHAdeMO</p>
            </div>
            <div className="rounded-2xl border border-(--brand-border) bg-(--background)/75 p-3.5">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-(--brand-muted)">Charging Curve</p>
              <p className="text-sm font-semibold text-(--brand-ink) mt-1">Up to 50kW</p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button className="flex-1 py-2.5 rounded-lg bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-(--brand-card) text-sm font-semibold hover:brightness-105">Edit Vehicle</button>
            <button className="flex-1 py-2.5 rounded-lg border border-(--brand-border) bg-(--background) text-(--brand-ink) text-sm font-semibold hover:border-(--brand-blue)">Set Default</button>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.82, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-4xl border border-dashed border-(--brand-border) bg-(--brand-card)/76 backdrop-blur-xl p-7 flex flex-col justify-center items-center text-center min-h-[320px]"
        >
          <div className="w-14 h-14 rounded-2xl border border-(--brand-border) bg-(--background) flex items-center justify-center text-(--brand-muted)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-(--brand-ink)">Add Another Vehicle</h3>
          <p className="text-sm text-(--brand-muted) mt-2 max-w-xs">Include more vehicles to auto-filter stations by connector type and charging capability.</p>
          <button className="mt-5 px-6 py-2.5 rounded-lg bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-(--brand-card) text-sm font-semibold hover:brightness-105">Add Vehicle</button>
        </motion.article>
      </div>
    </section>
  );
}