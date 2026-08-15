'use client';

import { useState } from 'react';
import Link from 'next/link';
import HomeNavbar from '../../components/home/HomeNavbar';
import Footer from '../../components/home/Footer';
import Reveal from '../../components/common/Reveal';

interface EVCarPreset {
  name: string;
  batteryKwh: number;
  maxDcKw: number;
  consumptionKwhPer100Km: number;
}

const CAR_PRESETS: EVCarPreset[] = [
  { name: 'BYD Atto 3 Extended', batteryKwh: 60.48, maxDcKw: 88, consumptionKwhPer100Km: 14.5 },
  { name: 'MG ZS EV Trophy', batteryKwh: 51.1, maxDcKw: 75, consumptionKwhPer100Km: 16.0 },
  { name: 'Hyundai Ioniq 5 LR', batteryKwh: 72.6, maxDcKw: 150, consumptionKwhPer100Km: 15.2 },
  { name: 'Tesla Model 3 RWD', batteryKwh: 60.0, maxDcKw: 150, consumptionKwhPer100Km: 13.8 },
  { name: 'Nissan Leaf e+ Gen 2', batteryKwh: 40.0, maxDcKw: 50, consumptionKwhPer100Km: 15.0 },
  { name: 'Audi e-tron 55 Quattro', batteryKwh: 95.0, maxDcKw: 150, consumptionKwhPer100Km: 22.0 },
];

export default function PricingPage() {
  const [calculatorMode, setCalculatorMode] = useState<'driver' | 'host'>('driver');

  // Driver Calculator State
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [startSoc, setStartSoc] = useState(20);
  const [targetSoc, setTargetSoc] = useState(80);
  const [chargerPowerKw, setChargerPowerKw] = useState(120);
  const [tariffRateLkr, setTariffRateLkr] = useState(82);

  // Host Calculator State
  const [bayCount, setBayCount] = useState(2);
  const [hardwarePowerKw, setHardwarePowerKw] = useState(60);
  const [dailyUtilHours, setDailyUtilHours] = useState(6);
  const [hostSellPriceLkr, setHostSellPriceLkr] = useState(88);
  const [hostWholesaleCostLkr, setHostWholesaleCostLkr] = useState(58);

  // Driver Calculations
  const car = CAR_PRESETS[selectedCarIndex];
  const deltaSoc = Math.max(0, targetSoc - startSoc);
  const kwhNeeded = (car.batteryKwh * deltaSoc) / 100;
  const effectiveChargingSpeedKw = Math.min(chargerPowerKw, car.maxDcKw);
  const chargeDurationMin = Math.round((kwhNeeded / effectiveChargingSpeedKw) * 60 * 1.12); // +12% taper buffer
  const sessionCostLkr = Math.round(kwhNeeded * tariffRateLkr);
  
  // Petrol Comparison (95 Octane @ LKR 375/L, 12 km/L average ICE sedan)
  const rangeAddedKm = Math.round((kwhNeeded / car.consumptionKwhPer100Km) * 100);
  const equivalentPetrolLiters = rangeAddedKm / 12;
  const equivalentPetrolCostLkr = Math.round(equivalentPetrolLiters * 375);
  const driverSavingsLkr = Math.max(0, equivalentPetrolCostLkr - sessionCostLkr);
  const annualSavingsLkr = driverSavingsLkr * 52;

  // Host Calculations
  const dailyKwhPerBay = hardwarePowerKw * dailyUtilHours * 0.72; // Average load factor
  const totalDailyKwh = dailyKwhPerBay * bayCount;
  const monthlyKwh = totalDailyKwh * 30;
  const grossMonthlyRevenueLkr = Math.round(monthlyKwh * hostSellPriceLkr);
  const wholesaleCostMonthlyLkr = Math.round(monthlyKwh * hostWholesaleCostLkr);
  const netMonthlyProfitLkr = grossMonthlyRevenueLkr - wholesaleCostMonthlyLkr;
  // Legacy aggregator fee (20% cut) that VoltHive saves the host
  const legacyAggregatorCutLkr = Math.round(grossMonthlyRevenueLkr * 0.20);
  const estHardwareInvestmentLkr = bayCount * (hardwarePowerKw > 100 ? 5500000 : hardwarePowerKw > 50 ? 3200000 : 1200000);
  const estPaybackMonths = Math.round(estHardwareInvestmentLkr / (netMonthlyProfitLkr || 1));

  return (
    <div className="min-h-screen bg-(--background) text-(--brand-ink) font-sans flex flex-col selection:bg-(--accent-blue)/30">
      
      {/* Top Navbar */}
      <HomeNavbar />

      {/* Main Container */}
      <main className="flex-1 pt-32 sm:pt-40 pb-24 px-5 sm:px-10 max-w-[1500px] mx-auto w-full relative z-10">
        
        {/* Ambient Glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-linear-to-tr from-(--surface-soft) via-white to-(--surface-tint) blur-3xl -z-10 rounded-full pointer-events-none opacity-80" />

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-(--brand-border) shadow-2xs font-mono text-xs font-black uppercase tracking-widest text-(--brand-blue-deep) mb-6">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>TRANSPARENT ECONOMICS</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-(--brand-ink) mb-6 leading-[1.08]">
            Interactive Pricing &amp; ROI Calculator.
          </h1>
          <p className="text-base sm:text-xl text-(--brand-muted) font-medium leading-relaxed">
            Calculate your exact EV charging costs, petrol savings, or station operator yield in Sri Lankan Rupees.
          </p>
        </div>

        {/* Mode Selector Pill Bar */}
        <div className="flex justify-center mb-12">
          <div className="p-1.5 rounded-2xl bg-white border border-(--brand-border) shadow-sm inline-flex gap-2">
            <button
              onClick={() => setCalculatorMode('driver')}
              className={`px-7 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                calculatorMode === 'driver'
                  ? 'bg-(--brand-ink) text-white shadow-md'
                  : 'text-(--brand-muted) hover:text-(--brand-ink) hover:bg-(--surface-soft)'
              }`}
            >
              <span>For EV Drivers</span>
            </button>
            <button
              onClick={() => setCalculatorMode('host')}
              className={`px-7 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                calculatorMode === 'host'
                  ? 'bg-(--brand-blue-deep) text-white shadow-md'
                  : 'text-(--brand-muted) hover:text-(--brand-ink) hover:bg-(--surface-soft)'
              }`}
            >
              <span>For Station Hosts</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            CALCULATOR 1: FOR EV DRIVERS
        ========================================================================= */}
        {calculatorMode === 'driver' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            
            {/* Left Inputs Card */}
            <Reveal direction="left" className="lg:col-span-7 rounded-[2.25rem] bg-white border border-(--brand-border) p-6 sm:p-10 shadow-sm space-y-7">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-(--brand-ink) tracking-tight mb-1">
                  1. Select Your Electric Vehicle
                </h3>
                <p className="text-xs text-(--brand-muted) mb-4">
                  Pre-configured with real Sri Lankan market battery capacities &amp; charge curves
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CAR_PRESETS.map((p, idx) => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedCarIndex(idx)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                        selectedCarIndex === idx
                          ? 'border-(--brand-blue) bg-(--surface-soft) text-(--brand-ink) ring-2 ring-(--brand-blue)/20'
                          : 'border-(--brand-border) bg-(--background) text-(--brand-muted) hover:bg-white'
                      }`}
                    >
                      <span className="block text-xs font-black text-(--brand-ink) leading-tight">{p.name}</span>
                      <span className="block text-[10px] font-mono mt-1 font-bold text-(--brand-blue-deep)">
                        {p.batteryKwh} kWh Pack
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* State of Charge Sliders */}
              <div className="space-y-5 pt-4 border-t border-(--brand-border)">
                <h3 className="text-lg font-black text-(--brand-ink) tracking-tight">
                  2. Charging Window (State of Charge %)
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-(--brand-ink)">
                    <span>Starting Battery: {startSoc}%</span>
                    <span>Target Battery: {targetSoc}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={startSoc}
                      onChange={(e) => setStartSoc(Math.min(Number(e.target.value), targetSoc - 5))}
                      className="w-full h-2 rounded-lg bg-(--brand-border) accent-(--brand-muted) cursor-pointer"
                    />
                    <input
                      type="range"
                      min={20}
                      max={100}
                      step={5}
                      value={targetSoc}
                      onChange={(e) => setTargetSoc(Math.max(Number(e.target.value), startSoc + 5))}
                      className="w-full h-2 rounded-lg bg-(--brand-border) accent-(--brand-blue) cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Charger Speed Selector */}
              <div className="space-y-3 pt-4 border-t border-(--brand-border)">
                <h3 className="text-lg font-black text-(--brand-ink) tracking-tight">
                  3. Station Hardware Speed &amp; Tariff
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: '60 kW Fast DC', kw: 60, rate: 78 },
                    { label: '120 kW Hyper DC', kw: 120, rate: 82 },
                    { label: '150 kW Ultra DC', kw: 150, rate: 88 },
                  ].map((tier) => (
                    <button
                      key={tier.kw}
                      onClick={() => {
                        setChargerPowerKw(tier.kw);
                        setTariffRateLkr(tier.rate);
                      }}
                      className={`p-3 rounded-2xl text-center border transition-all cursor-pointer ${
                        chargerPowerKw === tier.kw
                          ? 'border-(--brand-blue) bg-(--surface-soft) text-(--brand-ink) ring-2 ring-(--brand-blue)/20'
                          : 'border-(--brand-border) bg-(--background) text-(--brand-muted) hover:bg-white'
                      }`}
                    >
                      <span className="block text-xs font-black">{tier.label}</span>
                      <span className="block text-[10px] font-mono font-bold text-(--brand-blue-deep) mt-1">
                        LKR {tier.rate} / kWh
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Right Summary & Savings Receipt */}
            <Reveal direction="right" delay={0.1} className="lg:col-span-5 rounded-[2.25rem] bg-white border border-(--brand-border) p-6 sm:p-10 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-(--brand-blue-deep) bg-(--surface-soft) px-3 py-1 rounded-full">
                  Real Calculation Breakdown
                </span>

                <div className="mt-6 space-y-3.5">
                  <div className="flex justify-between py-2 border-b border-(--brand-border)/70 text-xs">
                    <span className="text-(--brand-muted) font-semibold">Energy Delivered</span>
                    <span className="font-mono font-bold text-(--brand-ink)">{kwhNeeded.toFixed(1)} kWh</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-(--brand-border)/70 text-xs">
                    <span className="text-(--brand-muted) font-semibold">Estimated Charge Time</span>
                    <span className="font-mono font-bold text-(--brand-blue-deep)">~{chargeDurationMin} Minutes</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-(--brand-border)/70 text-xs">
                    <span className="text-(--brand-muted) font-semibold">Range Added</span>
                    <span className="font-mono font-bold text-(--brand-green-deep)">+{rangeAddedKm} km</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-(--brand-border)/70 text-xs">
                    <span className="text-(--brand-muted) font-semibold">VoltHive Session Cost</span>
                    <span className="font-mono font-black text-base text-(--brand-ink)">LKR {sessionCostLkr.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-(--brand-border)/70 text-xs">
                    <span className="text-(--brand-muted) font-semibold">Equivalent Petrol Cost (95 Octane)</span>
                    <span className="font-mono font-bold text-(--brand-muted) line-through">LKR {equivalentPetrolCostLkr.toLocaleString()}</span>
                  </div>
                </div>

                {/* Big Savings Highlight Card */}
                <div className="mt-6 p-6 rounded-2xl bg-linear-to-br from-(--surface-soft) to-(--surface-tint) border border-(--brand-border) text-center space-y-1">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-(--brand-blue-deep)">
                    Net Savings on this Session
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-(--brand-green-deep)">
                    Save LKR {driverSavingsLkr.toLocaleString()}
                  </div>
                  <p className="text-xs text-(--brand-muted) font-medium pt-1">
                    Projected ~LKR {annualSavingsLkr.toLocaleString()} saved annually (1 charge/week)
                  </p>
                </div>
              </div>

              <Link
                href="/driver-login"
                className="w-full py-4 rounded-full bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-extrabold text-xs uppercase tracking-[0.18em] text-center flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition-all"
              >
                <span>Reserve Charger with These Rates →</span>
              </Link>
            </Reveal>

          </div>
        )}

        {/* =========================================================================
            CALCULATOR 2: FOR STATION HOSTS / OPERATORS
        ========================================================================= */}
        {calculatorMode === 'host' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            
            {/* Host Inputs */}
            <Reveal direction="left" className="lg:col-span-7 rounded-[2.25rem] bg-white border border-(--brand-border) p-6 sm:p-10 shadow-sm space-y-7">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-(--brand-ink) tracking-tight mb-1">
                  1. Hardware Configuration
                </h3>
                <p className="text-xs text-(--brand-muted) mb-4">
                  Select your installed charging bays and hardware output power
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-(--brand-ink) mb-2">
                      <span>Number of Charging Bays:</span>
                      <span className="font-mono text-(--brand-blue-deep) font-black text-sm">{bayCount} Bays</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={bayCount}
                      onChange={(e) => setBayCount(Number(e.target.value))}
                      className="w-full h-2 rounded-lg bg-(--brand-border) accent-(--brand-blue) cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-(--brand-ink) mb-2">
                      <span>Charger Power Rating:</span>
                      <span className="font-mono text-(--brand-blue-deep) font-black text-sm">{hardwarePowerKw} kW per Bay</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: '22 kW AC Commercial', kw: 22 },
                        { label: '60 kW DC Fast', kw: 60 },
                        { label: '120 kW Hypercharger', kw: 120 },
                      ].map((item) => (
                        <button
                          key={item.kw}
                          onClick={() => setHardwarePowerKw(item.kw)}
                          className={`p-3 rounded-2xl text-center border transition-all cursor-pointer ${
                            hardwarePowerKw === item.kw
                              ? 'border-(--brand-blue) bg-(--surface-soft) text-(--brand-ink) ring-2 ring-(--brand-blue)/20'
                              : 'border-(--brand-border) bg-(--background) text-(--brand-muted) hover:bg-white'
                          }`}
                        >
                          <span className="block text-xs font-black">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Utilization & Tariff Margin */}
              <div className="space-y-4 pt-4 border-t border-(--brand-border)">
                <h3 className="text-lg font-black text-(--brand-ink) tracking-tight">
                  2. Daily Utilization &amp; Tariffs
                </h3>

                <div>
                  <div className="flex justify-between text-xs font-bold text-(--brand-ink) mb-2">
                    <span>Average Daily Active Utilization:</span>
                    <span className="font-mono text-(--brand-green-deep) font-black text-sm">{dailyUtilHours} Hours / Day</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={14}
                    step={1}
                    value={dailyUtilHours}
                    onChange={(e) => setDailyUtilHours(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-(--brand-border) accent-(--brand-green) cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-(--brand-muted) mb-1">
                      Selling Price (LKR / kWh)
                    </label>
                    <input
                      type="number"
                      value={hostSellPriceLkr}
                      onChange={(e) => setHostSellPriceLkr(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-(--brand-border) bg-(--background) font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-(--brand-muted) mb-1">
                      Wholesale Grid Cost (LKR / kWh)
                    </label>
                    <input
                      type="number"
                      value={hostWholesaleCostLkr}
                      onChange={(e) => setHostWholesaleCostLkr(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-(--brand-border) bg-(--background) font-mono font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Host Results & ROI Projection */}
            <Reveal direction="right" delay={0.1} className="lg:col-span-5 rounded-[2.25rem] bg-white border border-(--brand-border) p-6 sm:p-10 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-(--brand-green-deep) bg-(--surface-tint) px-3 py-1 rounded-full">
                  Projected Revenue &amp; Profit
                </span>

                <div className="mt-6 space-y-3.5">
                  <div className="flex justify-between py-2 border-b border-(--brand-border)/70 text-xs">
                    <span className="text-(--brand-muted) font-semibold">Monthly Energy Dispatched</span>
                    <span className="font-mono font-bold text-(--brand-ink)">{Math.round(monthlyKwh).toLocaleString()} kWh</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-(--brand-border)/70 text-xs">
                    <span className="text-(--brand-muted) font-semibold">Gross Monthly Revenue</span>
                    <span className="font-mono font-bold text-(--brand-ink)">LKR {grossMonthlyRevenueLkr.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-(--brand-border)/70 text-xs">
                    <span className="text-(--brand-muted) font-semibold">VoltHive Gateway Fee</span>
                    <span className="font-mono font-black text-(--brand-green-deep)">0% (LKR 0)</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-(--brand-border)/70 text-xs">
                    <span className="text-(--brand-muted) font-semibold">Saved vs Legacy Aggregators (20%)</span>
                    <span className="font-mono font-bold text-(--brand-blue-deep)">+LKR {legacyAggregatorCutLkr.toLocaleString()} / mo</span>
                  </div>
                </div>

                {/* Big Profit Box */}
                <div className="mt-6 p-6 rounded-2xl bg-linear-to-br from-(--surface-soft) to-(--surface-tint) border border-(--brand-border) text-center space-y-1">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-(--brand-blue-deep)">
                    Projected Net Monthly Operating Profit
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-(--brand-green-deep)">
                    LKR {netMonthlyProfitLkr.toLocaleString()}
                  </div>
                  <p className="text-xs text-(--brand-muted) font-medium pt-1">
                    Est. hardware payback timeline: <strong>~{estPaybackMonths} months</strong>
                  </p>
                </div>
              </div>

              <Link
                href="/hosts"
                className="w-full py-4 rounded-full bg-(--brand-ink) hover:bg-(--brand-blue-deep) text-white font-extrabold text-xs uppercase tracking-[0.18em] text-center flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>Onboard Your Station as a Host →</span>
              </Link>
            </Reveal>

          </div>
        )}

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
