# VoltHive User & Operator Manual

> [!NOTE]
> This guide provides step-by-step operating instructions for both **EV Drivers** using the VoltHive Progressive Web App (PWA) and **Station Hosts/Operators** managing charging facilities via the Host POS Dashboard.

---

## Part 1: EV Driver User Guide

```mermaid
flowchart LR
    A[Install PWA & Setup Biometrics] --> B[Browse Map & Check Real-Time Availability]
    B --> C[Select Slot & Lock Dynamic Tariff]
    C --> D[Navigate to Station via GPS]
    D --> E[Plug-in & Monitor Live Charging]
    E --> F[Automated Digital Checkout & Invoice]
```

### 1. Account Onboarding & Native Biometric Login
1. **Accessing the App**: Navigate to `https://volthive.app` (or your local environment at `http://localhost:3000/driver-login`).
2. **PWA Installation**: Tap the browser's **Install** or **Add to Home Screen** prompt. VoltHive installs as a standalone app with full-screen native feel and offline asset caching.
3. **Biometric Setup**: Navigate to **Profile (Account Center) $\to$ App Security & Biometrics**. Toggle **Biometric Login** on to enable instant FaceID / TouchID authentication for subsequent sessions.

### 2. Finding Stations on the Interactive Map
1. **Map Exploration**: The home screen renders an interactive map highlighting all nearby charging hubs.
2. **Station Status Badges**:
   - 🟢 **Available (Green)**: Chargers are ready for immediate plug-in.
   - 🟠 **Busy / High Demand (Amber)**: Chargers are currently occupied or heavily booked.
   - 🔴 **Offline / Maintenance (Red)**: Station is currently undergoing maintenance.
3. **Hardware Filtering**: Filter stations by connector type (**CCS2**, **CHAdeMO**, **Type 2 AC**) or minimum power output (e.g., $\ge 50\text{ kW}$ DC Fast).

### 3. Slot Reservation & AI Dynamic Pricing
1. Click on any active station marker to open the **Station Booking Drawer**.
2. **Review Dynamic Tariff**: Inspect the live AI-optimized price per kWh (calculated based on real-time grid load, weather, and time of day).
3. **Select Charger & Time Window**: Choose an available charger bay and your estimated arrival time.
4. **Confirm Reservation**: Tap **Book Charging Slot**. Confetti confirms your locked-in rate, and the slot is reserved exclusively for your vehicle.

### 4. Live Charging Session Monitoring
1. Once plugged in at the station, the driver dashboard displays the **Active Session Telemetry**:
   - Real-time energy delivered ($\text{kWh}$)
   - Elapsed charging time and estimated completion
   - Running total cost based on the locked tariff
2. Upon completion, a digital receipt is generated and stored in your **Transaction Ledger**.

### 5. 1-to-1 Direct Host Messaging
- Tap the **Message** button on any station card or from your **Reservations** tab.
- This opens the persistent chat channel for that specific station, allowing you to ask the station operator about bay access, gate codes, or amenities.

### 6. My Garage: Vehicle Profile Management
- Navigate to the **My Garage** tab.
- Add your EV make, model, battery capacity ($\text{kWh}$), maximum charging rate ($\text{kW}$), and license plate number.
- Set a **Primary Vehicle** so reservation forms automatically calculate your optimal charging duration and battery top-up estimates.

---

## Part 2: Station Host & Operator Guide

```mermaid
flowchart LR
    A[Onboard Station & Chargers] --> B[Configure Base Tariffs & AI Surge]
    B --> C[Open POS Terminal for Walk-ins & Bookings]
    C --> D[Plug-in / Unplug Vehicle Operations]
    D --> E[Review Revenue Ledger & Analytics]
```

### 1. Station & Charger Hardware Provisioning
1. Log in via `https://volthive.app/owner-login`.
2. Navigate to **Stations $\to$ Add New Station**.
3. Enter your station address, GPS coordinates, location type (*Commercial, Highway, Residential*), and base tariff ($\text{LKR or USD per kWh}$).
4. Add individual charger hardware units under **Chargers $\to$ Add Charger**:
   - Assign unique bay IDs (e.g., `Bay A - 150kW DC Fast`).
   - Specify connector protocols (*CCS2, CHAdeMO, AC Type 2*).
   - Set maximum continuous power output ($\text{kW}$).

### 2. AI Dynamic Pricing & Grid Surge Controls
1. Navigate to **AI Prediction & Surge Engine**.
2. **Automated AI Optimization**: Enable AI dynamic pricing to allow the HistGradientBoosting model to optimize tariffs based on real-time weather and demand forecasts.
3. **Manual Overrides & Rate Calendar**: Set custom peak/off-peak multipliers for holidays, weekend promotions, or grid demand response events.

### 3. Live POS Terminal & Charging Operations
1. Open **Live Operations (POS Terminal)**.
2. **Handling App Reservations**: Incoming reservations appear with sound alerts and driver vehicle details.
3. **Handling Walk-In Drivers**:
   - Tap **New Walk-In Booking**.
   - Select an available charger bay, enter the driver's phone number, and choose target energy ($\text{kWh}$) or full charge.
4. **Starting Charging**: When the vehicle is connected, click **Start Charging (Plug In)** to begin the energy delivery timer.
5. **Stopping & Checkout**: When charging completes, click **Stop Charging (Unplug)**. The POS automatically calculates:
   - Base energy charges ($\text{kWh} \times \text{Tariff}$)
   - Overtime parking fees (if the vehicle remained plugged in past grace window)
   - Final payment status (Cash, Card, Digital Wallet)

### 4. Financial Ledger & Revenue Analytics
1. Navigate to **Analytics & Reports**.
2. Review real-time KPIs:
   - Total Gross Revenue ($\text{LKR}$)
   - Total Energy Delivered ($\text{MWh}$)
   - Average Station Utilization Rate ($\%$)
   - Peak utilization hours by day of week
3. Export transaction ledgers in CSV/JSON format for tax, accounting, and power utility audits.

### 5. Driver Support & Communication Center
1. Navigate to **Driver Support & Messages**.
2. View all active and past driver conversations across all your stations.
3. Use **Quick Replies** (*"🔌 Port ready"*, *"⚡ Charging started"*, *"📞 Operator on way"*) for rapid one-touch responses to driver queries.
