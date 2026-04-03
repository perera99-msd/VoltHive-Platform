// volthive-frontend/src/components/driver/views/DriverHome.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function DriverHome({ onBookNow }: { onBookNow?: () => void }) {
  return (
    <section className="space-y-6 relative overflow-hidden">
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-(--accent-blue)/18 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-(--accent-green)/14 blur-[120px] pointer-events-none" />

      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-4xl border border-(--brand-card)/70 bg-(--brand-card)/78 backdrop-blur-2xl p-6 md:p-8 shadow-[0_26px_70px_-42px_rgba(9,32,52,0.58)]"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-(--brand-muted)">Driver Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-(--brand-ink) mt-2">
              Welcome back,
              <span className="text-transparent bg-clip-text bg-linear-to-r from-(--brand-blue) to-(--brand-green)"> Dimalsha.</span>
            </h1>
            <p className="text-(--brand-muted) mt-2 max-w-2xl font-medium">Your charging workflow is ready. Continue from map mode, review reservations, and manage trips from one clean surface.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBookNow}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-(--brand-card) text-sm font-semibold shadow-[0_18px_34px_-22px_rgba(74,144,164,0.85)] hover:brightness-105"
            >
              Open Live Map
            </button>
            <button className="px-5 py-3 rounded-xl bg-(--brand-card)/90 border border-(--brand-border) text-(--brand-ink) text-sm font-semibold hover:bg-(--background)">
              Monthly Summary
            </button>
          </div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <article className="rounded-3xl border border-(--brand-card)/70 bg-(--brand-card)/80 backdrop-blur-xl p-5 shadow-[0_16px_34px_-26px_rgba(9,32,52,0.42)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--brand-muted)">Upcoming Sessions</p>
          <p className="text-3xl font-semibold tracking-tight text-(--brand-ink) mt-2">03</p>
          <p className="text-sm text-(--brand-muted) mt-1">Next at 2:00 PM · Colombo Fast Charge 19</p>
        </article>
        <article className="rounded-3xl border border-(--brand-card)/70 bg-(--brand-card)/80 backdrop-blur-xl p-5 shadow-[0_16px_34px_-26px_rgba(9,32,52,0.42)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--brand-muted)">Average Cost</p>
          <p className="text-3xl font-semibold tracking-tight text-(--brand-ink) mt-2">LKR 86</p>
          <p className="text-sm text-(--brand-muted) mt-1">Per kWh over the last 14 days</p>
        </article>
        <article className="rounded-3xl border border-(--brand-card)/70 bg-(--brand-card)/80 backdrop-blur-xl p-5 shadow-[0_16px_34px_-26px_rgba(9,32,52,0.42)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--brand-muted)">Completion Rate</p>
          <p className="text-3xl font-semibold tracking-tight text-(--brand-ink) mt-2">98%</p>
          <p className="text-sm text-(--brand-muted) mt-1">Stable performance this month</p>
        </article>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <motion.article
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.82, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="xl:col-span-2 rounded-4xl border border-(--brand-card)/65 bg-(--brand-card)/78 backdrop-blur-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-(--brand-ink)">Today Timeline</h2>
            <span className="px-3 py-1 rounded-full bg-(--accent-blue)/14 text-(--brand-blue) text-xs font-semibold">3 activities</span>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-(--brand-border) bg-(--background)/72 p-4">
              <p className="font-semibold text-(--brand-ink)">09:30 AM · Session Completed</p>
              <p className="text-sm text-(--brand-muted) mt-1">Negombo Port Station · 18.2 kWh delivered</p>
            </div>
            <div className="rounded-2xl border border-(--brand-border) bg-(--background)/72 p-4">
              <p className="font-semibold text-(--brand-ink)">02:00 PM · Upcoming Reservation</p>
              <p className="text-sm text-(--brand-muted) mt-1">Colombo Fast Charge 19 · Slot reserved for 30 minutes</p>
            </div>
            <div className="rounded-2xl border border-(--brand-border) bg-(--background)/72 p-4">
              <p className="font-semibold text-(--brand-ink)">08:00 PM · Suggested Off-Peak Window</p>
              <p className="text-sm text-(--brand-muted) mt-1">Forecast shows 12% lower rates in nearby stations</p>
            </div>
          </div>
        </motion.article>

        <motion.aside
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.82, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <div className="rounded-3xl border border-(--brand-card)/70 bg-(--brand-card)/82 backdrop-blur-2xl p-5">
            <h3 className="font-semibold text-(--brand-ink)">Quick Actions</h3>
            <div className="mt-4 space-y-2.5">
              <button onClick={onBookNow} className="w-full py-2.5 rounded-lg bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-(--brand-card) text-sm font-semibold hover:brightness-105">Find Nearby Station</button>
              <button className="w-full py-2.5 rounded-lg border border-(--brand-border) bg-(--background) text-(--brand-ink) text-sm font-semibold hover:border-(--brand-blue)">Manage Vehicles</button>
              <button className="w-full py-2.5 rounded-lg border border-(--brand-border) bg-(--background) text-(--brand-ink) text-sm font-semibold hover:border-(--brand-green)">View Payments</button>
            </div>
          </div>

          <div className="rounded-3xl border border-(--brand-card)/70 bg-(--brand-card)/82 backdrop-blur-2xl p-5">
            <h3 className="font-semibold text-(--brand-ink)">Charging Insight</h3>
            <p className="text-sm text-(--brand-muted) mt-2">Use Smart Match from map mode for top-value station ranking using route time and live dynamic pricing.</p>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}