'use client';

import { motion } from 'framer-motion';

export default function OwnerHome() {
  const stats = [
    { label: "Today's Revenue", value: "Rs. 14,250", trend: "+12%", color: "text-(--brand-green)" },
    { label: "Active Bookings", value: "8", trend: "Live", color: "text-(--brand-blue)" },
    { label: "Avg. Utilization", value: "68%", trend: "+5%", color: "text-(--brand-ink)" },
    { label: "Hardware Alerts", value: "0", trend: "All Good", color: "text-(--brand-muted)" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-(--brand-ink) mb-1">Overview Dashboard</h1>
          <p className="text-(--brand-muted) text-[15px] font-medium">Monitor your network performance and hardware streams.</p>
        </div>
        <button className="hidden md:flex items-center gap-2 bg-white border border-(--brand-border) text-(--brand-ink) px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-blue)"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          Export Report
        </button>
      </div>

      {/* High-End Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-(--brand-card)/80 backdrop-blur-xl border border-(--brand-border)/80 p-6 rounded-2xl shadow-[0_8px_30px_-12px_rgba(9,32,52,0.06)] hover:shadow-[0_8px_30px_-12px_rgba(9,32,52,0.12)] transition-shadow"
          >
            <p className="text-[12px] font-bold text-(--brand-muted) uppercase tracking-wider mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</h3>
              <span className="text-[11px] font-bold px-2 py-1 bg-(--surface-soft) text-(--brand-ink) rounded-md border border-(--brand-border)">
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Placeholder for Premium Charts */}
        <div className="lg:col-span-2 bg-(--brand-card)/80 backdrop-blur-xl border border-(--brand-border)/80 p-6 rounded-2xl shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-(--brand-ink) mb-6">Revenue & Occupancy Velocity</h3>
          <div className="flex-1 bg-(--background)/50 rounded-xl border border-dashed border-(--brand-border) flex items-center justify-center text-(--brand-muted) text-sm font-medium">
             [ AI Predictive Chart Rendered Here ]
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-(--brand-card)/80 backdrop-blur-xl border border-(--brand-border)/80 p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-(--brand-ink) mb-6">Live Station Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-(--brand-border)/60 last:border-0 last:pb-0">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-(--brand-blue) shadow-[0_0_8px_var(--brand-blue)]" />
                <div>
                  <p className="text-sm font-bold text-(--brand-ink)">Booking Confirmed • Station {i}</p>
                  <p className="text-xs text-(--brand-muted) mt-0.5">Driver secured 50kW CCS2 plug at Rs. 92/kWh</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}