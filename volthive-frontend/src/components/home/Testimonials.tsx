'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal from '../common/Reveal';

const TESTIMONIALS = [
  {
    quote: 'I reserve my slot before leaving the office and it is always free when I arrive. No more queue anxiety on the way home.',
    name: 'Sanchana D.',
    role: 'EV Driver · Colombo',
  },
  {
    quote: 'Dynamic pricing did the work for us. Revenue per charger is up and I finally see every session settle in one dashboard.',
    name: 'Ruwan P.',
    role: 'Station Owner · Nugegoda',
  },
  {
    quote: 'Installing the PWA took seconds. Face ID login and live map make it feel like a fully native app.',
    name: 'Ama K.',
    role: 'Fleet Driver · Kandy',
  },
  {
    quote: 'Zero gateway fees was the deciding factor. Every rupee we charge lands back in our business.',
    name: 'Dilshan W.',
    role: 'Charging Network Operator',
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 8000);
    return () => clearInterval(timer);
  }, []);

  const item = TESTIMONIALS[index];

  return (
    <section id="testimonials" className="relative z-10 w-full bg-(--surface-soft)/40 py-16 sm:py-24 px-5 sm:px-10 overflow-hidden font-sans border-t border-(--brand-border)">
      <div className="max-w-[1500px] mx-auto text-center">
        <Reveal className="max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-(--brand-border) font-mono text-[11px] font-black tracking-[0.16em] uppercase text-(--brand-blue-deep) mb-4 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>Trusted on the road</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-(--brand-ink) leading-[1.06] mb-4">
            Loved by drivers &amp; owners.
          </h2>
        </Reveal>

        <Reveal>
          <div className="relative max-w-3xl mx-auto min-h-[220px] sm:min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.figure
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="px-2"
              >
                <blockquote className="text-lg sm:text-2xl font-bold text-(--brand-ink) leading-relaxed tracking-tight">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6">
                  <div className="text-sm font-black text-(--brand-ink)">{item.name}</div>
                  <div className="text-xs font-semibold text-(--brand-muted) mt-0.5">{item.role}</div>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex justify-center gap-2.5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${
                  i === index ? 'w-8 bg-linear-to-r from-(--brand-blue) to-(--brand-green)' : 'w-2 bg-(--brand-border) hover:bg-(--brand-muted)/40'
                }`}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
