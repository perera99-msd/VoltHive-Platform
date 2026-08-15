'use client';

import Link from 'next/link';
import HomeNavbar from '../../components/home/HomeNavbar';
import Footer from '../../components/home/Footer';
import Reveal from '../../components/common/Reveal';

const TECH_PILLARS = [
  {
    title: 'Python Machine Learning Predictor',
    badge: 'ALGORITHMIC YIELD OPTIMIZATION',
    desc: 'Our backend ML microservice forecasts hourly kilowatt demand by synthesizing meteorological telemetry (ambient temperature, solar irradiance), historical expressway traffic trends, and local Ceylon Electricity Board (CEB) grid load stress.',
    codeSnippet: `def predict_demand(station_id, hour_window, weather_idx):\n    features = extract_telemetry(station_id, weather_idx)\n    predicted_load_kw = xgboost_model.predict(features)\n    optimal_tariff = calculate_elastic_tariff(predicted_load_kw, ceb_base_rate)\n    return optimal_tariff`,
    specs: ['XGBoost & ARIMA Multi-Variate Forecasting', '15-Minute Rolling Dynamic Re-pricing', 'Sub-second Telemetry WebSocket Heartbeats'],
  },
  {
    title: 'OCPP 1.6J & 2.0.1 Central Orchestrator',
    badge: 'OPEN EVSE PROTOCOL',
    desc: 'VoltHive implements a native OCPP WebSocket broker that communicates bi-directionally with high-power DC fast chargers and AC destination points. It manages smart charging profiles to prevent station electrical tripping during grid surges.',
    codeSnippet: `{\n  "action": "SetChargingProfile",\n  "connectorId": 1,\n  "csChargingProfiles": {\n    "chargingProfilePurpose": "TxDefaultProfile",\n    "chargingSchedule": { "limit": 120.0, "unit": "A" }\n  }\n}`,
    specs: ['Smart Charging Profile Dispatching', 'Remote Firmware & Diagnostic Logs', 'Hardened WebSocket (WSS) Encryption'],
  },
  {
    title: 'ISO 15118 Cryptographic Plug & Charge',
    badge: 'SECURE HARDWARE AUTH',
    desc: 'Supports direct hardware-to-vehicle cryptographic handshakes using public key infrastructure (PKI). Vehicles with ISO 15118 capability automatically identify, authenticate, and begin charging upon cable insertion with zero touchscreens.',
    codeSnippet: `// Cryptographic V2G Handshake\nconst certVerified = verifyX509VehicleCert(v2gMessage.signature);\nif (certVerified) {\n  session.openContract(v2gMessage.evccId);\n  evse.unlockCable();\n}`,
    specs: ['X.509 Certificate Mutual TLS', 'Zero-Touch Session Initialization', 'Automated Overstay Detection'],
  },
  {
    title: 'Direct Point-of-Sale Settlement Engine',
    badge: '0% GATEWAY COMMISSIONS',
    desc: 'Unlike legacy charging networks that retain 20%–30% of energy sales, VoltHive routes physical transaction events directly to Stripe Connect and local clearing banks. 100% of the energy value lands in the host account.',
    codeSnippet: `// Direct Merchant Split: 0% Host Haircut\nconst transfer = await stripe.transfers.create({\n  amount: calculatedEnergyLkr,\n  currency: 'lkr',\n  destination: hostConnectedAccountId,\n});`,
    specs: ['Stripe Connect Automated Escrow', 'Itemized PDF Invoicing for Fleets', 'Real-Time Tax Compliance Breakdown'],
  },
];

export default function TechnologyPage() {
  return (
    <div className="min-h-screen bg-(--background) text-(--brand-ink) font-sans flex flex-col selection:bg-(--accent-blue)/30">
      
      {/* Top Navbar */}
      <HomeNavbar />

      {/* Main Content */}
      <main className="flex-1 pt-32 sm:pt-40 pb-24 px-5 sm:px-10 max-w-[1500px] mx-auto w-full relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-(--brand-border) shadow-2xs font-mono text-xs font-black uppercase tracking-widest text-(--brand-blue-deep) mb-6">
            <span className="w-2 h-2 rounded-full bg-(--brand-green) animate-pulse" />
            <span>CORE PROTOCOL SPECIFICATIONS</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-(--brand-ink) mb-6 leading-[1.08]">
            Decentralized Grid Intelligence.
          </h1>
          <p className="text-base sm:text-xl text-(--brand-muted) font-medium leading-relaxed">
            The architectural blueprint behind VoltHive’s dynamic pricing algorithms, OCPP 1.6J/2.0.1 controller layer, and instant settlement pipelines.
          </p>
        </div>

        {/* Technical Architecture Specs Grid */}
        <div className="space-y-12 mb-24">
          {TECH_PILLARS.map((p, idx) => (
            <Reveal key={p.title} direction={idx % 2 === 0 ? 'left' : 'right'} delay={0.1}>
              <div className="rounded-[2.5rem] bg-white border border-(--brand-border) p-8 sm:p-12 shadow-sm hover:shadow-xl transition-all grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* Left Narrative */}
                <div className="lg:col-span-7 space-y-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-(--surface-soft) text-(--brand-blue-deep) font-mono text-[10px] font-black tracking-wider uppercase border border-(--brand-border)">
                    {p.badge}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-(--brand-ink) tracking-tight">
                    {p.title}
                  </h2>
                  <p className="text-sm sm:text-base text-(--brand-muted) font-medium leading-relaxed">
                    {p.desc}
                  </p>
                  
                  <div className="pt-4 space-y-2">
                    {p.specs.map((spec, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2.5 text-xs font-bold text-(--brand-ink)">
                        <span className="w-4 h-4 rounded-full bg-(--surface-tint) text-(--brand-green-deep) flex items-center justify-center text-[10px]">✓</span>
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Code Block */}
                <div className="lg:col-span-5 rounded-2xl bg-[#141a1d] border border-[#253238] p-6 shadow-inner text-left font-mono text-xs overflow-x-auto text-[#a0b0b8]">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#253238] text-[10px] text-(--brand-muted)">
                    <span>Protocol Execution Trace</span>
                    <span className="text-(--accent-green)">● RUNNING</span>
                  </div>
                  <pre className="leading-relaxed whitespace-pre-wrap">
                    <code>{p.codeSnippet}</code>
                  </pre>
                </div>

              </div>
            </Reveal>
          ))}
        </div>

        {/* Live Grid Metrics Counter Card */}
        <Reveal direction="up" className="rounded-[2.5rem] bg-linear-to-r from-(--brand-ink) via-[#1b2528] to-[#121c1f] text-white p-8 sm:p-14 shadow-2xl text-center">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-(--accent-green)">
            ENTERPRISE RELIABILITY
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-2 mb-6">
            Engineered for 99.9% Uptime &amp; Millisecond Latency.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-6 border-t border-[#2d3e46]">
            <div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-white">99.9%</div>
              <div className="text-xs text-[#8f9fa5] uppercase tracking-wider font-bold mt-1">SLA Uptime</div>
            </div>
            <div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-(--accent-blue)">&lt; 1 Sec</div>
              <div className="text-xs text-[#8f9fa5] uppercase tracking-wider font-bold mt-1">Heartbeat Latency</div>
            </div>
            <div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-(--accent-green)">0%</div>
              <div className="text-xs text-[#8f9fa5] uppercase tracking-wider font-bold mt-1">Gateway Take</div>
            </div>
            <div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-white">FIDO2</div>
              <div className="text-xs text-[#8f9fa5] uppercase tracking-wider font-bold mt-1">Biometric Auth</div>
            </div>
          </div>
        </Reveal>

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
