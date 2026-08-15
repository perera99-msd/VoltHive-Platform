'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OwnerHelpViewProps {
  onNavigate?: (tab: string) => void;
}

interface HelpModule {
  id: string;
  title: string;
  category: 'Operations' | 'AI Engine' | 'Hardware' | 'Tariffs' | 'Communication' | 'Analytics' | 'Security';
  badge: string;
  shortDesc: string;
  overview: string;
  workflows: { step: string; title: string; detail: string }[];
  systemLogic: { title: string; description: string }[];
  proTips: string[];
  faqs: { q: string; a: string }[];
  relatedTab?: string;
}

// Crisp Vector SVG Icons for each module
const MODULE_ICONS: Record<string, React.ReactNode> = {
  stations: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.25A2.25 2.25 0 010 18.75V3.75A2.25 2.25 0 012.25 1.5h19.5A2.25 2.25 0 0124 3.75v15a2.25 2.25 0 01-2.25 2.25H13.5m-9-15h3m-3 4.5h3m-3 4.5h3m7.5-9h3m-3 4.5h3m-3 4.5h3" />
    </svg>
  ),
  chargers: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  ai: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
  bookings: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  rates: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chat: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  map: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  ),
  dashboard: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  security_settings: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
};

const HELP_MODULES: HelpModule[] = [
  {
    id: 'stations',
    title: 'Station Infrastructure & Hubs',
    category: 'Operations',
    badge: 'Core Asset',
    shortDesc: 'Managing physical EV premises, GPS coordinates, opening schedules, amenities, and operational health.',
    overview: 'Stations are the primary physical entities in the VoltHive network. Each station possesses distinct geographic coordinates (latitude & longitude), operating hours, amenity tags, and hardware charging ports mapped to its premise. Drivers discover your stations on the VoltHive mobile map based on proximity and real-time port availability.',
    workflows: [
      { step: '01', title: 'Registering a Station', detail: 'Navigate to "My Stations" and click "+ Add New Station". Provide the official hub name, exact street address, GPS coordinates, business operating hours, and amenities (e.g. WiFi, Restrooms, Dining).' },
      { step: '02', title: 'Editing Amenities & Schedule', detail: 'Click "Edit Station" on any station card to update opening times, contact hotlines, or toggle amenities. Changes take effect immediately on driver mobile apps.' },
      { step: '03', title: 'Station Maintenance Mode', detail: 'Toggle a station to "Maintenance" if civil or electrical work is underway. This temporarily prevents drivers from initiating new reservations while preserving existing data.' },
      { step: '04', title: 'Deleting a Station', detail: 'Deleting a station requires passing a confirmation safety modal. Note that a station with active charging sessions cannot be deleted until all sessions are completed.' }
    ],
    systemLogic: [
      { title: 'GeoJSON Indexing', description: 'VoltHive utilizes MongoDB 2dsphere indexing to calculate spherical distance between drivers and your stations, sorting nearby stations within milliseconds.' },
      { title: 'Relational Hierarchy', description: 'Station (Parent) → Chargers (Ports) → Bookings (Charging Sessions). Deleting a station cascades to its associated hardware ports and archives booking logs.' }
    ],
    proTips: [
      'Enable all on-site amenities (Cafe, Restroom, 24/7 Security) — stations with 3+ amenities see a 34% higher booking conversion rate.',
      'Keep operating hours accurate to prevent no-show penalties when drivers arrive during closed hours.'
    ],
    faqs: [
      { q: 'How do drivers find my station?', a: 'Stations marked "Active" are automatically broadcasted to the driver map with real-time port availability badges.' },
      { q: 'Can I operate a 24/7 station?', a: 'Yes! Set operating hours to 00:00 - 23:59 or select 24 Hours in the schedule builder.' }
    ],
    relatedTab: 'stations'
  },
  {
    id: 'chargers',
    title: 'Hardware Chargers & Connectors',
    category: 'Hardware',
    badge: 'Hardware Port',
    shortDesc: 'Commissioning charging ports, power ratings (kW), plug standards (CCS1, CCS2, CHAdeMO, Type 1, Type 2, GB/T, Tesla NACS), and port statuses.',
    overview: 'Chargers represent the physical hardware ports installed at your station locations. Each charger is assigned a power output rating (e.g. 7.4kW AC, 22kW AC Fast, 50kW DC Rapid, 150kW Ultra-Fast) and connector type. Drivers select specific chargers based on their vehicle compatibility.',
    workflows: [
      { step: '01', title: 'Commissioning a Charger', detail: 'Navigate to "My Chargers" and click "+ Add Charger". Select the host station, assign a unique port identifier (e.g. Port A1), connector standard, and rated power in kW.' },
      { step: '02', title: 'Setting Port Status', detail: 'Port status automatically updates between Available, Occupied, and Faulted. You can manually flag a port for Maintenance if hardware repairs are needed.' },
      { step: '03', title: 'Output Power Calibration', detail: 'Update the rated power (kW) if grid load balancing or transformer limits change. This ensures drivers receive accurate charging time estimates.' }
    ],
    systemLogic: [
      { title: 'Port Conflict Prevention', description: 'The booking engine locks a charger port 15 minutes prior to a reservation, preventing other drivers from seizing the connector.' },
      { title: 'Energy Calculation', description: 'Delivered Energy (kWh) = (Charger Power kW × Active Charging Duration in Minutes) / 60 × Efficiency Factor (0.94 for DC, 0.90 for AC).' }
    ],
    proTips: [
      'If you have high-power DC chargers (50kW+), pair them with AI dynamic pricing to capitalize on fast-turnaround peak demand.',
      'Regularly test connector latching mechanisms — faulted ports degrade your station reliability rating on the driver network.'
    ],
    faqs: [
      { q: 'What connector types are supported?', a: 'VoltHive supports CCS1, CCS2 (Combo 2), CHAdeMO, Type 1 (SAE J1772), Type 2 (Mennekes AC), GB/T, and Tesla NACS standards.' },
      { q: 'Can one charger serve two cars simultaneously?', a: 'If you have dual-gun hardware, register each cable as a separate port (e.g. Gun 1 - CCS2, Gun 2 - Type 2).' }
    ],
    relatedTab: 'chargers'
  },
  {
    id: 'ai',
    title: 'AI Demand & Dynamic Pricing Engine',
    category: 'AI Engine',
    badge: 'Neural Forecast',
    shortDesc: 'Machine learning demand forecasting, 24/7 occupancy curves, dynamic tariff multipliers, and revenue optimization.',
    overview: 'The VoltHive AI Intelligence Engine employs neural regression and time-series demand models to predict driver charging rush hours 24 hours in advance. It dynamically optimizes tariff rates — raising rates during peak grid congestion to maximize revenue, and discounting rates during slow hours to attract traffic.',
    workflows: [
      { step: '01', title: 'Selecting an AI Pricing Profile', detail: 'Open "AI Intelligence" and choose an AI Profile for your station: Conservative (0.92x–1.15x), Balanced (0.90x–1.30x), or Aggressive (0.85x–1.45x).' },
      { step: '02', title: 'Reviewing the 24h Hourly Forecast', detail: 'Inspect the interactive 24-hour demand chart. High-probability peak windows are highlighted in rose/amber, while valley discount hours are highlighted in mint green.' },
      { step: '03', title: 'Applying Dynamic Rates to Calendar', detail: 'Click "Sync AI Multipliers to Tariff Schedule" to automatically write the neural price recommendations into your 24/7 Rate Matrix.' },
      { step: '04', title: 'Manual Price Overrides', detail: 'You can manually edit any individual hour in the Rate Calculator if you wish to override the AI recommendation for special events.' }
    ],
    systemLogic: [
      { title: 'Multi-Factor Neural Weights', description: 'The AI model evaluates hour-of-day, day-of-week, historical occupancy patterns, local city traffic indices, and weather temperature to forecast hourly demand.' },
      { title: 'Multiplier Caps', description: 'Under the Balanced profile, the maximum price ceiling is capped at 1.30x of base rate, and the minimum floor is 0.90x, ensuring fair rates for drivers while boosting margins.' }
    ],
    proTips: [
      'Use the Aggressive profile during holidays and long weekends when inter-city EV travel surges by over 200%.',
      'Check the AI forecast every morning at 08:00 AM to review expected peak charging hours.'
    ],
    faqs: [
      { q: 'Does AI change prices without my permission?', a: 'No. AI recommendations require one-tap operator confirmation before being synchronized into active billing.' },
      { q: 'How accurate is the forecast?', a: 'VoltHive neural models achieve 91.4% accuracy based on aggregated charging telemetry across Sri Lanka.' }
    ],
    relatedTab: 'ai'
  },
  {
    id: 'bookings',
    title: 'Live Operations & POS Terminal',
    category: 'Operations',
    badge: 'POS & Queue',
    shortDesc: 'Managing reservations, approving booking requests, starting/stopping charging sessions, and settling payments.',
    overview: 'The Live Operations & POS Terminal is your real-time command center for managing EV drivers at your stations. It displays incoming reservations, active charging sessions, queued drivers, and settled transactions with live billing counters.',
    workflows: [
      { step: '01', title: 'Approving or Rejecting Requests', detail: 'When a driver submits a booking, an approval card appears in "Pending Approvals". Review vehicle details and click "Approve" or "Reject".' },
      { step: '02', title: 'Starting a Charging Session', detail: 'When the driver arrives at the station and plugs in, click "Start Charging" on their POS card. The port status switches to Occupied and the session timer begins.' },
      { step: '03', title: 'Stopping & Checking Out', detail: 'When charging finishes, click "Stop Charge & Check Out". VoltHive instantly computes the final invoice based on energy delivered (kWh) and applicable hourly tariff.' },
      { step: '04', title: 'Handling No-Shows', detail: 'If a driver fails to arrive 15 minutes after their slot starts, click "Mark No-Show" to release the port for walk-in drivers.' }
    ],
    systemLogic: [
      { title: 'Bill Formula', description: 'Total Bill (LKR) = (Delivered Energy kWh × Hourly Tariff Rate) + Fixed Service Fee. Discounts or overrides are applied transparently before settlement.' },
      { title: 'State Transitions', description: 'Pending → Confirmed → Active Charging → Completed. Database updates are protected with atomic transactions to prevent double-charging.' }
    ],
    proTips: [
      'Use the "tel:" hotline button on driver POS cards to call arriving drivers directly if their charger slot is ready.',
      'Settle cash transactions immediately upon checkout to keep your daily revenue ledger accurate.'
    ],
    faqs: [
      { q: 'What happens if a driver overstays their slot?', a: 'The POS timer turns red, alerting the operator to remind the driver or apply overstay fees.' },
      { q: 'Can I create a walk-in booking for a driver on site?', a: 'Yes! Use the POS "New Walk-In Booking" modal to assign an available port instantly.' }
    ],
    relatedTab: 'bookings'
  },
  {
    id: 'rates',
    title: 'Rate Calculator & Tariff Rules',
    category: 'Tariffs',
    badge: 'Tariff Engine',
    shortDesc: 'Configuring base kWh electricity rates, 24/7 hourly tariff schedules, peak surcharges, and holiday discounts.',
    overview: 'The Rate Calculator enables operators to set base electricity tariffs and schedule custom hourly price adjustments across all 24 hours of every day of the week. It supports base rate steppers, custom percentage overrides, and seamless integration with AI dynamic pricing.',
    workflows: [
      { step: '01', title: 'Selecting a Station & Hardware', detail: 'Use the custom animated dropdown at the top of the Rate Calculator to choose the station and specific charging port.' },
      { step: '02', title: 'Setting Base Electricity Rate', detail: 'Use the dedicated − and + steppers to configure your station baseline electricity rate (e.g. 65.00 LKR / kWh).' },
      { step: '03', title: 'Editing the 24/7 Hourly Matrix', detail: 'Click any hour cell in the 7-day grid to apply a custom multiplier (e.g. +20% for evening peak, -10% for night off-peak).' },
      { step: '04', title: 'Saving & Applying Schedules', detail: 'Click "Save Tariff Schedule". All changes are validated and synced with the driver reservation quote calculator.' }
    ],
    systemLogic: [
      { title: 'Precedence Hierarchy', description: 'Active Rate Order: 1. Manual Hourly Override (Highest) → 2. AI Synchronized Dynamic Rate → 3. Base Station Tariff (Default).' },
      { title: 'Matrix Dimensions', description: 'The scheduler maintains a 7 × 24 matrix (168 hourly slots per station) stored as structured JSON in the station rate document.' }
    ],
    proTips: [
      'Set lower off-peak rates between 11:00 PM and 05:00 AM to encourage overnight commercial fleet charging.',
      'Keep base rates competitive with local CEB / LECO electricity utility costs to maximize driver loyalty.'
    ],
    faqs: [
      { q: 'Can different chargers at the same station have different rates?', a: 'Yes! DC ultra-fast chargers can carry higher kW tariffs than AC standard ports.' },
      { q: 'How quickly do rate changes apply to drivers?', a: 'Rate changes apply instantly to all new booking quotes created after saving.' }
    ],
    relatedTab: 'rates'
  },
  {
    id: 'chat',
    title: 'Driver Support & Messages',
    category: 'Communication',
    badge: 'Live Stream',
    shortDesc: 'Two-way real-time messaging with EV drivers, quick operator response chips, and customer support management.',
    overview: 'The Messages console facilitates direct, real-time communication between station operators and drivers currently charging or planning to arrive. It features a master-detail split pane, live polling updates every 6 seconds, and one-tap quick operator response chips.',
    workflows: [
      { step: '01', title: 'Browsing Conversations', detail: 'View all active driver threads in the left pane, sorted by latest message timestamp. Unread message counters appear with high-priority pulse badges.' },
      { step: '02', title: 'Opening a Conversation', detail: 'Click any thread to view full chat history with timestamps and driver vehicle metadata.' },
      { step: '03', title: 'Sending Quick Replies', detail: 'Click one-tap template chips (e.g. "Your charging port is ready", "Charging started") to reply in 1 second.' },
      { step: '04', title: 'Real-Time Inquiries', detail: 'Type custom responses to answer driver questions regarding plug compatibility, parking access, or billing receipts.' }
    ],
    systemLogic: [
      { title: 'Polling Engine', description: 'When a thread is open, the client polls GET /api/chat/owner/:stationId/:driverId every 6 seconds to fetch new driver replies without page reloads.' },
      { title: 'Message Retention', description: 'Messages are indexed by stationId and driverId in MongoDB, providing complete audit trails for resolved driver inquiries.' }
    ],
    proTips: [
      'Reply within 2 minutes to driver inquiries — responsive station hosts receive top placement on the driver search feed.',
      'Use quick reply chips during busy rush hours to communicate effortlessly with arriving drivers.'
    ],
    faqs: [
      { q: 'Can drivers see when I am online?', a: 'Yes, an active operator indicator informs drivers that a human host is available to assist.' },
      { q: 'Can I message a driver who hasn’t booked yet?', a: 'Drivers initiate the thread when inquiring about station amenities or creating a reservation.' }
    ],
    relatedTab: 'chat'
  },
  {
    id: 'map',
    title: 'Station Network GIS Map',
    category: 'Operations',
    badge: 'GIS Telemetry',
    shortDesc: 'Interactive map layer, geographic station clusters, status pins, and live driver navigation telemetry.',
    overview: 'The Station Network Map offers a rich, full-screen geographic visualization of all your charging stations across Sri Lanka. Powered by Leaflet GIS and OpenStreetMap tiles, it shows real-time station operational pins, cluster densities, and quick action popups.',
    workflows: [
      { step: '01', title: 'Navigating the GIS Map', detail: 'Pan and zoom across provinces to inspect station distribution. Station pins are color-coded by real-time status.' },
      { step: '02', title: 'Inspecting Station Telemetry', detail: 'Click any station marker pin to open an interactive card showing active chargers, occupancy rate, and base tariff.' },
      { step: '03', title: 'Direct Action Shortcuts', detail: 'From the station map popup, click "Manage Station" or "Open POS" to jump directly into live operations.' }
    ],
    systemLogic: [
      { title: 'Marker Clustering', description: 'High-density urban hubs (e.g. Colombo, Kandy) automatically group into cluster bubbles that expand smoothly on zoom.' },
      { title: 'Tile Caching', description: 'OpenStreetMap vector tiles are cached locally in the browser to ensure fluid 60fps pan and zoom performance.' }
    ],
    proTips: [
      'Ensure station latitude and longitude coordinates are accurate to within 5 meters so EV drivers navigate directly to your charger bays.',
      'Use satellite view to plan expansion of additional charging bays in parking lots.'
    ],
    faqs: [
      { q: 'Why is my station marker not showing on the map?', a: 'Ensure your station has valid latitude (5.9°–9.9°) and longitude (79.5°–81.9°) coordinates in Sri Lanka.' },
      { q: 'Can I filter map pins by charger type?', a: 'Yes! Use the map filter bar to view Fast DC vs AC Standard locations.' }
    ],
    relatedTab: 'map'
  },
  {
    id: 'dashboard',
    title: 'Executive Analytics & Revenue',
    category: 'Analytics',
    badge: 'KPI Analytics',
    shortDesc: 'Monitoring total settled revenue, kWh energy delivered, peak charging utilization, and monthly revenue trends.',
    overview: 'The Executive Dashboard aggregates high-level business intelligence across your entire EV charging network. It highlights daily gross revenue, total energy dispensed (kWh), completed session counts, station utilization percentages, and 30-day financial trajectories.',
    workflows: [
      { step: '01', title: 'Reviewing Top KPI Cards', detail: 'Monitor 4 real-time KPI metrics: Total Settled Revenue (LKR), Net Energy Dispatched (kWh), Active Charging Sessions, and Fleet Utilization Rate.' },
      { step: '02', title: 'Inspecting 30-Day Revenue Trend', detail: 'Analyze the revenue area chart to identify top-earning days, weekend surges, and month-over-month growth.' },
      { step: '03', title: 'Station Performance Comparison', detail: 'Review per-station revenue rankings to determine which locations generate the highest return on energy investment.' }
    ],
    systemLogic: [
      { title: 'Real-Time Aggregations', description: 'Financial metrics are computed on the backend using MongoDB aggregation pipelines ($match completed bookings, $group by date, $sum totalAmount).' },
      { title: 'Energy Dispatch Index', description: 'Tracks cumulative kWh delivered to calculate carbon offsets (kg CO2 avoided) across your green fleet.' }
    ],
    proTips: [
      'Compare weekday vs weekend revenue curves to fine-tune your weekend AI dynamic pricing profiles.',
      'Export station ledger CSV files at month-end for accounting and electricity utility cost reconciliation.'
    ],
    faqs: [
      { q: 'How often do dashboard revenue stats update?', a: 'Stats update in real-time as charging sessions are completed and settled at the POS.' },
      { q: 'Are cancelled bookings included in revenue?', a: 'No, only successfully completed and settled sessions are calculated in revenue.' }
    ],
    relatedTab: 'dashboard'
  },
  {
    id: 'security_settings',
    title: 'Profile, Security & System Settings',
    category: 'Security',
    badge: 'Security & Auth',
    shortDesc: 'Managing operator identity, 18 animated avatar faces, password updates, sound alerts, and CSV ledger exports.',
    overview: 'The Account section houses your Operator Profile and System Settings. Here you can personalize your operator name, select an animated avatar face from 18 choices, manage password security, configure portal notification preferences, and export financial records.',
    workflows: [
      { step: '01', title: 'Changing Animated Avatar', detail: 'Navigate to "Operator Profile" and tap any of the 18 animated avatar faces in the quick selector. Confirm the prompt to update your public operator face.' },
      { step: '02', title: 'Updating Display Name', detail: 'Edit your Full Display Name and click "Save Name Changes". A confirmation modal validates the change across Firebase and MongoDB.' },
      { step: '03', title: 'Changing Account Password', detail: 'Enter your current password, new password (min 6 chars), and confirmation. The security strength meter indicates password robustness.' },
      { step: '04', title: 'Configuring Portal Settings', detail: 'Under "System Settings", toggle audio notification chimes, adjust telemetry polling frequency (5s–60s), and export CSV reports.' }
    ],
    systemLogic: [
      { title: 'Re-Authentication Security', description: 'Firebase Auth requires re-authenticating with your current password before committing credential changes, protecting against session hijacking.' },
      { title: 'Immutable Email Protection', description: 'Operator email addresses cannot be altered directly to guarantee host identity verification and payout audit trails.' }
    ],
    proTips: [
      'Choose a unique animated avatar — drivers recognize friendly avatars during live chat inquiries.',
      'Always test notification chimes under System Settings to ensure you never miss an incoming driver request.'
    ],
    faqs: [
      { q: 'Can I change my account login email?', a: 'For security and payout verification, email addresses are immutable. Contact VoltHive platform support to change email credentials.' },
      { q: 'Where are my portal preferences saved?', a: 'Preferences (chimes, clock format, polling rates) are securely stored in your browser local storage.' }
    ],
    relatedTab: 'profile'
  }
];

const CATEGORIES = ['All', 'Operations', 'AI Engine', 'Hardware', 'Tariffs', 'Communication', 'Analytics', 'Security'];

export default function OwnerHelpView({ onNavigate }: OwnerHelpViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalModule, setActiveModalModule] = useState<HelpModule | null>(null);
  const [activeTab, setActiveTab] = useState<'workflows' | 'logic' | 'tips' | 'faqs'>('workflows');

  const filteredModules = HELP_MODULES.filter(m => {
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      m.title.toLowerCase().includes(query) ||
      m.shortDesc.toLowerCase().includes(query) ||
      m.overview.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-full relative font-sans space-y-5 pb-16">
      
      {/* ── 1. CLEAN SAAS HEADER BANNER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:px-6 sm:py-5 bg-white/80 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white font-black flex items-center justify-center shadow-xs shrink-0">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-(--brand-ink)">
                Documentation & System Guidance
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-blue)/20 hidden sm:inline-block">
                Operations Manual
              </span>
            </div>
            <p className="text-xs text-(--brand-muted) font-medium mt-0.5">
              Comprehensive architectural guides, step-by-step procedures, system algorithms, and operator workflows.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px] sm:min-w-[280px]">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 text-(--brand-muted) absolute left-3.5 top-1/2 -translate-y-1/2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documentation, logic, POS..."
            className="w-full pl-10 pr-8 py-2.5 bg-(--surface-soft)/60 border border-[#e0e5e3] rounded-2xl text-xs font-semibold text-(--brand-ink) placeholder:text-(--brand-muted)/70 focus:outline-none focus:ring-2 focus:ring-(--brand-blue)/30 focus:border-(--brand-blue) focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-(--brand-muted) hover:text-(--brand-ink) font-bold text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 2. CLEAN CATEGORY PILL FILTER BAR ── */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white shadow-xs'
                  : 'bg-white/80 hover:bg-white text-(--brand-ink) border border-[#e0e5e3] hover:border-(--brand-blue)/30 shadow-2xs'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── 3. CLEAN SAAS GUIDANCE CARDS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModules.map((mod) => (
          <motion.div
            key={mod.id}
            whileHover={{ y: -3 }}
            onClick={() => {
              setActiveModalModule(mod);
              setActiveTab('workflows');
            }}
            className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-[#e0e5e3]/90 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-(--brand-blue)/40 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Top Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-(--brand-blue) to-(--brand-green) opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-3.5">
              {/* Card Header with SVG Icon & Badges */}
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-(--brand-blue)/10 to-(--brand-green)/10 border border-(--brand-blue)/20 text-(--brand-blue-deep) flex items-center justify-center group-hover:scale-105 group-hover:bg-(--brand-blue) group-hover:text-white transition-all shrink-0 shadow-2xs">
                  {MODULE_ICONS[mod.id] || (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-(--surface-soft)/80 text-(--brand-muted) text-[10px] font-black uppercase tracking-wider border border-[#e0e5e3]">
                    {mod.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-blue)/20">
                    {mod.badge}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-extrabold text-(--brand-ink) group-hover:text-(--brand-blue-deep) transition-colors tracking-tight">
                  {mod.title}
                </h3>
                <p className="text-xs text-(--brand-muted) font-medium mt-1 leading-relaxed line-clamp-2">
                  {mod.shortDesc}
                </p>
              </div>
            </div>

            {/* Card Footer CTA */}
            <div className="pt-4 mt-4 border-t border-[#e0e5e3]/70 flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-(--brand-muted) flex items-center gap-1.5">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-(--brand-blue-deep)">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span>{mod.workflows.length} Step Guides</span>
              </span>

              <span className="font-black text-(--brand-blue-deep) group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>View Guide</span>
                <span>→</span>
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-3xl border border-[#e0e5e3] space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-(--surface-soft) border border-[#e0e5e3] flex items-center justify-center mx-auto text-(--brand-muted)">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="text-base font-black text-(--brand-ink)">No matching guides found</h3>
          <p className="text-xs text-(--brand-muted)">Try adjusting your search keywords or filter category.</p>
        </div>
      )}

      {/* ── 4. PROFESSIONAL SAAS GUIDANCE MODAL ── */}
      <AnimatePresence>
        {activeModalModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-white rounded-3xl border border-[#e0e5e3] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden font-sans"
            >
              {/* Modal Header */}
              <div className="p-5 sm:px-7 sm:py-5 border-b border-[#e0e5e3] bg-(--surface-soft)/40 flex items-start justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-(--brand-blue) to-(--brand-green) text-white flex items-center justify-center shadow-xs shrink-0">
                    {MODULE_ICONS[activeModalModule.id] || (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-wider">
                        {activeModalModule.category}
                      </span>
                      <span className="text-[11px] font-bold text-(--brand-muted)">· VoltHive Guidance Manual</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-(--brand-ink) tracking-tight mt-0.5">
                      {activeModalModule.title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalModule(null)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#e0e5e3] text-(--brand-muted) hover:text-(--brand-ink) hover:bg-(--surface-soft) transition-all cursor-pointer text-xs font-bold shrink-0 shadow-2xs"
                >
                  ✕ Close
                </button>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="px-7 py-2.5 border-b border-[#e0e5e3] bg-white flex items-center gap-2 overflow-x-auto shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {[
                  {
                    id: 'workflows',
                    label: 'Operator Workflow',
                    icon: (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    count: activeModalModule.workflows.length
                  },
                  {
                    id: 'logic',
                    label: 'System Logic',
                    icon: (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                      </svg>
                    ),
                    count: activeModalModule.systemLogic.length
                  },
                  {
                    id: 'tips',
                    label: 'Best Practices',
                    icon: (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.496 1.508 1.333 1.508 2.316V18" />
                      </svg>
                    ),
                    count: activeModalModule.proTips.length
                  },
                  {
                    id: 'faqs',
                    label: 'FAQ',
                    icon: (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                      </svg>
                    ),
                    count: activeModalModule.faqs.length
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-linear-to-r from-(--brand-blue)/15 to-(--brand-green)/15 border border-(--brand-blue) text-(--brand-blue-deep) shadow-2xs'
                          : 'text-(--brand-muted) hover:text-(--brand-ink) hover:bg-(--surface-soft)'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span className="text-[10px] opacity-70">({tab.count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#e0e5e3] [&::-webkit-scrollbar-thumb]:rounded-full">
                
                {/* Executive Overview Box */}
                <div className="p-4 rounded-2xl bg-(--surface-soft)/60 border-l-4 border-l-(--brand-blue) border border-[#e0e5e3] space-y-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-(--brand-blue-deep) flex items-center gap-1.5">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <span>System Architecture Overview</span>
                  </h4>
                  <p className="text-xs text-(--brand-ink) font-medium leading-relaxed">
                    {activeModalModule.overview}
                  </p>
                </div>

                {/* TAB 1: WORKFLOWS */}
                {activeTab === 'workflows' && (
                  <div className="space-y-3.5">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted)">
                      Step-by-Step Operator Procedures
                    </h4>
                    <div className="space-y-3">
                      {activeModalModule.workflows.map((wf, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white border border-[#e0e5e3] shadow-2xs space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-(--brand-blue)/10 text-(--brand-blue-deep) text-[10px] font-black uppercase tracking-wider border border-(--brand-blue)/20">
                              Step {wf.step}
                            </span>
                            <p className="text-xs font-black text-(--brand-ink)">{wf.title}</p>
                          </div>
                          <p className="text-xs text-(--brand-muted) font-medium leading-relaxed pl-1">{wf.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: SYSTEM LOGIC */}
                {activeTab === 'logic' && (
                  <div className="space-y-3.5">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted)">
                      Under-the-Hood Algorithms & Calculations
                    </h4>
                    <div className="space-y-3">
                      {activeModalModule.systemLogic.map((lg, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white border border-[#e0e5e3] shadow-2xs space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-black text-(--brand-ink)">
                            <span className="w-2 h-2 rounded-full bg-(--brand-blue)" />
                            <span>{lg.title}</span>
                          </div>
                          <p className="text-xs text-(--brand-muted) font-medium leading-relaxed pl-4">{lg.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: PRO TIPS */}
                {activeTab === 'tips' && (
                  <div className="space-y-3.5">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted)">
                      Revenue Optimization & Operational Best Practices
                    </h4>
                    <div className="space-y-3">
                      {activeModalModule.proTips.map((tip, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-(--brand-green)/5 border-l-4 border-l-(--brand-green) border border-(--brand-green)/20 flex items-start gap-3">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-(--brand-green-deep) shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.496 1.508 1.333 1.508 2.316V18" />
                          </svg>
                          <p className="text-xs text-(--brand-ink) font-semibold leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: FAQS */}
                {activeTab === 'faqs' && (
                  <div className="space-y-3.5">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-(--brand-muted)">
                      Frequently Asked Questions
                    </h4>
                    <div className="space-y-3">
                      {activeModalModule.faqs.map((faq, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white border border-[#e0e5e3] shadow-2xs space-y-1.5">
                          <p className="text-xs font-black text-(--brand-ink) flex items-center gap-1.5">
                            <span className="text-(--brand-blue) font-black">Q.</span>
                            <span>{faq.q}</span>
                          </p>
                          <p className="text-xs text-(--brand-muted) font-medium leading-relaxed pl-4">
                            {faq.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:px-7 sm:py-4 border-t border-[#e0e5e3] bg-(--surface-soft)/40 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-(--brand-muted) font-semibold">
                  VoltHive Operator Guidance Manual v2.4
                </span>
                {activeModalModule.relatedTab && onNavigate && (
                  <button
                    onClick={() => {
                      const tab = activeModalModule.relatedTab;
                      setActiveModalModule(null);
                      if (tab) onNavigate(tab);
                    }}
                    className="px-4 py-2 rounded-xl bg-linear-to-r from-(--brand-blue) to-(--brand-green) text-white font-black text-xs shadow-xs hover:brightness-105 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Jump to Live Section</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
