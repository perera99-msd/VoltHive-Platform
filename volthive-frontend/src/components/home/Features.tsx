'use client';

import { motion, Variants } from 'framer-motion';

const CORE_FEATURES = [
  {
    id: 'f1',
    title: 'Zero Gateway Fees.',
    subtitle: 'Point-of-Sale Native',
    description: 'Keep 100% of your charging revenue. Our architecture links physical EVSE hardware directly to Stripe Connect with zero middleman markup.',
    badgeColor: 'bg-(--surface-soft) text-(--brand-blue-deep) border-(--brand-border)',
    accentBg: 'from-(--surface-soft)/40 via-white to-white',
    span: 'col-span-1 md:col-span-2 lg:col-span-2'
  },
  {
    id: 'f2',
    title: 'Dynamic Pricing AI.',
    subtitle: 'Yield Optimization',
    description: 'Our Python telemetry engine queries local grid tariffs and adjusts your charging prices autonomously to maximize station ROI during peak demand.',
    badgeColor: 'bg-(--surface-tint) text-(--brand-green-deep) border-(--brand-border)',
    accentBg: 'from-(--surface-tint)/30 via-white to-white',
    span: 'col-span-1 md:col-span-2 lg:col-span-1'
  },
  {
    id: 'f3',
    title: 'Pre-Arrival Booking.',
    subtitle: 'Guaranteed Slots',
    description: 'Drivers lock in charging slots 24 hours in advance, eliminating queue anxiety and maximizing station hardware utilization rates.',
    badgeColor: 'bg-(--surface-tint) text-(--brand-green-deep) border-(--brand-border)',
    accentBg: 'from-(--surface-tint)/30 via-white to-white',
    span: 'col-span-1 md:col-span-2 lg:col-span-1'
  },
  {
    id: 'f4',
    title: 'Enterprise Fleet Management.',
    subtitle: 'Multi-Tenant Scale',
    description: 'Manage 5 or 5,000 stations. Full RBAC (Role-Based Access Control), automated invoicing, and live heartbeat telemetry across all active connectors.',
    badgeColor: 'bg-(--surface-soft) text-(--brand-blue-deep) border-(--brand-border)',
    accentBg: 'from-(--surface-soft)/40 via-white to-white',
    span: 'col-span-1 md:col-span-2 lg:col-span-2'
  }
];

export default function Features() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, duration: 1.2, ease: 'easeOut' }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: 'easeOut' } 
    }
  };

  return (
    <section id="services" className="relative z-10 w-full min-h-[90dvh] bg-(--background) flex flex-col justify-center py-16 sm:py-24 px-5 sm:px-10 overflow-hidden font-sans border-t border-(--brand-border)">
      
      {/* Background Soft Glows */}
      <div className="absolute top-1/3 right-0 w-[40vw] h-[40vw] max-w-[500px] bg-(--brand-blue)/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[40vw] h-[40vw] max-w-[500px] bg-(--brand-green)/10 blur-[130px] rounded-full pointer-events-none" />

      <motion.div 
        className="max-w-[1500px] w-full mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Header */}
        <motion.div variants={cardVariants} className="max-w-3xl mb-12 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-(--surface-soft) border border-(--brand-border) font-mono text-[11px] sm:text-xs font-black tracking-[0.16em] sm:tracking-[0.18em] uppercase text-(--brand-blue-deep) mb-3.5 sm:mb-4 shadow-2xs">
            <span>CORE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-(--brand-ink) leading-[1.06] mb-4 sm:mb-5">
            Intelligent Infrastructure.
          </h2>
          <p className="text-sm sm:text-xl text-(--brand-muted) font-medium leading-relaxed">
            The most advanced EV aggregator protocol. Designed for station owners, optimized for drivers, powered by AI.
          </p>
        </motion.div>

        {/* Bento Grid - Mobile Dynamic Auto-Rows */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-5 sm:gap-6 auto-rows-auto md:auto-rows-[340px]">
          {CORE_FEATURES.map((feature) => (
            <motion.div 
              key={feature.id}
              variants={cardVariants}
              className={`${feature.span} relative rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 overflow-hidden group border border-(--brand-border) bg-linear-to-br ${feature.accentBg} shadow-sm hover:shadow-xl hover:border-(--brand-blue)/40 transition-all duration-500 flex flex-col justify-between min-h-[240px] md:min-h-0`}
            >
              <div className="relative z-10">
                <span className={`inline-block px-3 py-1 rounded-full border font-mono text-[10px] sm:text-[11px] font-black tracking-[0.14em] sm:tracking-[0.16em] uppercase mb-4 sm:mb-6 ${feature.badgeColor}`}>
                  {feature.subtitle}
                </span>
                <h3 className="text-xl sm:text-4xl font-black text-(--brand-ink) tracking-tight mb-3 sm:mb-4">
                  {feature.title}
                </h3>
              </div>
              
              <p className="relative z-10 text-(--brand-muted) text-sm sm:text-base font-medium leading-relaxed max-w-lg mt-auto pt-4 md:pt-0">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

      </motion.div>
    </section>
  );
}