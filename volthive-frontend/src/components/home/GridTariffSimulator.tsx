'use client';

import { useState } from 'react';
import Link from 'next/link';
import Reveal from '../common/Reveal';

interface HourlyData {
  hour: number;
  timeLabel: string;
  period: string;
  utilityPriceLkr: number;
  volthivePriceLkr: number;
  solarAvailabilityPercent: number;
  gridStrain: 'Low' | 'Moderate' | 'High';
}

const HOURLY_TIMELINE: HourlyData[] = [
  { hour: 0, timeLabel: '00:00', period: 'Off-Peak', utilityPriceLkr: 72, volthivePriceLkr: 62, solarAvailabilityPercent: 0, gridStrain: 'Low' },
  { hour: 3, timeLabel: '03:00', period: 'Off-Peak', utilityPriceLkr: 72, volthivePriceLkr: 60, solarAvailabilityPercent: 0, gridStrain: 'Low' },
  { hour: 6, timeLabel: '06:00', period: 'Day', utilityPriceLkr: 85, volthivePriceLkr: 74, solarAvailabilityPercent: 15, gridStrain: 'Moderate' },
  { hour: 9, timeLabel: '09:00', period: 'Day', utilityPriceLkr: 85, volthivePriceLkr: 70, solarAvailabilityPercent: 65, gridStrain: 'Moderate' },
  { hour: 12, timeLabel: '12:00', period: 'Day (Solar Peak)', utilityPriceLkr: 85, volthivePriceLkr: 66, solarAvailabilityPercent: 95, gridStrain: 'Low' },
  { hour: 15, timeLabel: '15:00', period: 'Day', utilityPriceLkr: 85, volthivePriceLkr: 72, solarAvailabilityPercent: 60, gridStrain: 'Moderate' },
  { hour: 18, timeLabel: '18:00', period: 'Peak Evening', utilityPriceLkr: 118, volthivePriceLkr: 89, solarAvailabilityPercent: 10, gridStrain: 'High' },
  { hour: 20, timeLabel: '20:00', period: 'Peak Grid Rush', utilityPriceLkr: 118, volthivePriceLkr: 92, solarAvailabilityPercent: 0, gridStrain: 'High' },
  { hour: 22, timeLabel: '22:00', period: 'Peak Taper', utilityPriceLkr: 118, volthivePriceLkr: 84, solarAvailabilityPercent: 0, gridStrain: 'Moderate' },
  { hour: 23, timeLabel: '23:00', period: 'Off-Peak Night', utilityPriceLkr: 72, volthivePriceLkr: 64, solarAvailabilityPercent: 0, gridStrain: 'Low' },
];

export default function GridTariffSimulator() {
  const [selectedHourIndex, setSelectedHourIndex] = useState(4); // Default 12:00 Solar Peak
  const [batteryKwh, setBatteryKwh] = useState(50); // Default 50 kWh charge

  const currentPoint = HOURLY_TIMELINE[selectedHourIndex];
  const utilityTotalLkr = Math.round(batteryKwh * currentPoint.utilityPriceLkr);
  const volthiveTotalLkr = Math.round(batteryKwh * currentPoint.volthivePriceLkr);
  const savingsLkr = utilityTotalLkr - volthiveTotalLkr;
  const savingsPercent = Math.round((savingsLkr / utilityTotalLkr) * 100);

  return (
    <section id="grid-simulator" className="relative z-10 w-full bg-(--surface-soft)/40 py-18 sm:py-28 px-5 sm:px-10 overflow-hidden font-sans border-t border-(--brand-border)">
      
      {/* Background Soft Accents */}
      <div className="absolute top-1/2 left-1/3 w-[450px] h-[450px] bg-(--brand-green)/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-[1500px] mx-auto">
        
        {/* Section Header */}
        <Reveal direction="left" className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-(--brand-border) font-mono text-[11px] font-black tracking-[0.16em] uppercase text-(--brand-blue-deep) mb-4 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>AI Dynamic Grid Dispatch</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-(--brand-ink) leading-[1.06] mb-4">
            Smart Tariffs That Save You Money.
          </h2>
          <p className="text-sm sm:text-lg text-(--brand-muted) font-medium leading-relaxed">
            VoltHive’s Python ML telemetry queries local grid strain and renewable solar feeds, adjusting prices in real-time to save you up to 30% compared to standard utility charging rates.
          </p>
        </Reveal>

        {/* Interactive Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Left Column: Interactive Time Slider & Energy Curve */}
          <Reveal direction="left" delay={0.1} className="lg:col-span-7 rounded-[2.25rem] bg-white border border-(--brand-border) p-6 sm:p-10 shadow-sm flex flex-col justify-between space-y-8">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-(--brand-border)">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-(--brand-ink) tracking-tight">
                    Time-of-Day Tariff Curve
                  </h3>
                  <p className="text-xs text-(--brand-muted) mt-0.5">
                    Click time points below to simulate dynamic price shifts
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-(--surface-soft) text-(--brand-blue-deep) font-mono text-xs font-black border border-(--brand-border)">
                  Selected: {currentPoint.timeLabel} ({currentPoint.period})
                </span>
              </div>

              {/* Hour Selection Buttons Bar */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2 mt-6">
                {HOURLY_TIMELINE.map((item, idx) => {
                  const isSelected = idx === selectedHourIndex;
                  return (
                    <button
                      key={item.timeLabel}
                      onClick={() => setSelectedHourIndex(idx)}
                      className={`py-3 px-1 rounded-xl text-center font-mono text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-linear-to-b from-(--brand-blue) to-(--brand-blue-deep) text-white shadow-md scale-105'
                          : 'bg-(--background) text-(--brand-ink) hover:bg-(--surface-soft) border border-(--brand-border)'
                      }`}
                    >
                      <span className="block text-[11px]">{item.timeLabel}</span>
                      <span className={`block text-[9px] mt-1 ${isSelected ? 'text-white/80' : 'text-(--brand-muted)'}`}>
                        LKR {item.volthivePriceLkr}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Visual Visualizer Bars */}
              <div className="mt-8 space-y-4">
                {/* Standard Grid Bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-(--brand-muted) mb-1.5">
                    <span>Standard Fixed CEB/LECO Rate</span>
                    <span className="font-mono text-(--brand-ink)">LKR {currentPoint.utilityPriceLkr} / kWh</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-(--brand-border) overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#8c9ba0] transition-all duration-500"
                      style={{ width: `${(currentPoint.utilityPriceLkr / 130) * 100}%` }}
                    />
                  </div>
                </div>

                {/* VoltHive Smart Shaved Rate Bar */}
                <div>
                  <div className="flex justify-between text-xs font-black text-(--brand-ink) mb-1.5">
                    <span className="text-(--brand-blue-deep) flex items-center gap-1.5">
                      <span>⚡ VoltHive AI Shaved Rate</span>
                      <span className="px-2 py-0.5 rounded-full bg-(--surface-tint) text-(--brand-green-deep) text-[10px] font-mono">
                        Save {savingsPercent}%
                      </span>
                    </span>
                    <span className="font-mono text-(--brand-green-deep) text-sm font-black">
                      LKR {currentPoint.volthivePriceLkr} / kWh
                    </span>
                  </div>
                  <div className="h-5 w-full rounded-full bg-(--surface-soft) border border-(--brand-border) overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-(--brand-blue) to-(--brand-green) transition-all duration-500 shadow-xs"
                      style={{ width: `${(currentPoint.volthivePriceLkr / 130) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Battery Size Slider */}
            <div className="pt-6 border-t border-(--brand-border) space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-(--brand-ink)">
                <span>Energy Delivered per Session:</span>
                <span className="font-mono text-sm font-black text-(--brand-blue-deep) bg-(--surface-soft) px-3 py-1 rounded-full">
                  {batteryKwh} kWh
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={100}
                step={5}
                value={batteryKwh}
                onChange={(e) => setBatteryKwh(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-(--brand-border) accent-(--brand-blue) cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-(--brand-muted)">
                <span>15 kWh (Short Top-up)</span>
                <span>50 kWh (Standard SUV)</span>
                <span>100 kWh (Full EV Battery)</span>
              </div>
            </div>
          </Reveal>

          {/* Right Column: Real Calculations & Savings Receipt */}
          <Reveal direction="right" delay={0.15} className="lg:col-span-5 rounded-[2.25rem] bg-white border border-(--brand-border) p-6 sm:p-10 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-(--brand-blue-deep) bg-(--surface-soft) px-3 py-1 rounded-full">
                Real-Time Session Estimate
              </span>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center py-2.5 border-b border-(--brand-border)/70 text-xs font-semibold text-(--brand-muted)">
                  <span>Time Window</span>
                  <span className="font-mono text-(--brand-ink) font-bold">{currentPoint.timeLabel} ({currentPoint.period})</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-(--brand-border)/70 text-xs font-semibold text-(--brand-muted)">
                  <span>Solar Renewable Penetration</span>
                  <span className="font-mono text-(--brand-green-deep) font-bold">{currentPoint.solarAvailabilityPercent}% Active Solar</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-(--brand-border)/70 text-xs font-semibold text-(--brand-muted)">
                  <span>Local Grid Stress</span>
                  <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                    currentPoint.gridStrain === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : currentPoint.gridStrain === 'Moderate'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {currentPoint.gridStrain}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-(--brand-border)/70 text-xs font-semibold text-(--brand-muted)">
                  <span>Standard Utility Cost</span>
                  <span className="font-mono text-(--brand-muted) line-through font-bold">LKR {utilityTotalLkr.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-(--brand-ink)">VoltHive Price</span>
                  <span className="text-2xl font-black font-mono text-(--brand-blue-deep)">
                    LKR {volthiveTotalLkr.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Big Savings Highlight Box */}
              <div className="mt-6 p-5 rounded-2xl bg-linear-to-br from-(--surface-soft) to-(--surface-tint) border border-(--brand-border) text-center space-y-1">
                <div className="text-[10px] font-mono font-black uppercase tracking-wider text-(--brand-blue-deep)">
                  Estimated Savings on this Single Charge
                </div>
                <div className="text-3xl font-black font-mono text-(--brand-green-deep)">
                  Save LKR {savingsLkr.toLocaleString()} ({savingsPercent}%)
                </div>
                <div className="text-[11px] text-(--brand-muted) font-medium">
                  Compared to unmanaged fixed peak tariffs
                </div>
              </div>
            </div>

            <Link
              href="/pricing"
              className="w-full py-4 rounded-full bg-(--brand-ink) hover:bg-(--brand-blue-deep) text-white font-extrabold text-xs uppercase tracking-[0.18em] text-center flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              <span>Explore Interactive ROI & Cost Portal →</span>
            </Link>
          </Reveal>

        </div>

      </div>
    </section>
  );
}
