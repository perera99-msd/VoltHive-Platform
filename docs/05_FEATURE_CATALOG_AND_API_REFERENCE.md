# VoltHive Feature Catalog & REST API Reference

> [!NOTE]
> This document details the complete feature catalog of the VoltHive ecosystem alongside a comprehensive reference for all backend REST API endpoints.

---

## 1. Complete Platform Feature Catalog

| Module | Feature Name | Description | User Persona |
| :--- | :--- | :--- | :--- |
| **Mapping & Discovery** | Interactive Geo-Map | Real-time map displaying station clusters, power ratings, and live status. | Driver, Guest |
| | Intelligent Hardware Filters | Filter by connector (CCS2, CHAdeMO, Type 2) and power rating ($\ge 50\text{ kW}$). | Driver |
| **Reservations & Booking** | Guaranteed Slot Booking | Reserve a specific charger bay and time window with instant confirmation. | Driver |
| | Dynamic Tariff Lock | Locks in the dynamic tariff rate at time of booking to protect against spikes. | Driver |
| **AI Demand Forecasting** | Real-Time Utilization Engine | HistGradientBoosting model forecasting utilization based on weather & time. | Host, Admin |
| | Dynamic Surge Multipliers | Automatic tariff adjustments (+0% to +60%) balancing grid load and revenue. | Host |
| **POS Terminal & Ops** | Live Charging Operations | Track live charging sessions with real-time kWh and elapsed time counters. | Host, Operator |
| | Walk-In Driver Support | Quickly issue walk-in charging slots directly from the POS terminal. | Host, Operator |
| **Communication** | 1-to-1 Persistent Station Chat | Continuous direct messaging between driver and station operator. | Driver, Host |
| | Real-Time SSE Notifications | Live audio and visual alerts for new messages, bookings, and status changes. | Driver, Host |
| **Vehicle Management** | My Garage | Register multiple EV models, battery specs, and preferred primary car. | Driver |
| **Security & PWA** | Native Biometric Authentication | Instant passwordless login via FaceID/TouchID on mobile devices. | Driver |
| | Standalone PWA Installation | Zero-app-store installable web app with offline caching and maskable icon. | Driver |

---

## 2. REST API Specification

### Base URLs
- **Local Development**: `http://localhost:5000/api`
- **Production**: `https://api.volthive.app/api`

### Authentication Headers
All protected endpoints require a valid Firebase JWT bearer token in the `Authorization` header:
```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

---

### A. Authentication & User Profile (`/api/auth`, `/api/users`)

#### 1. Sync / Create User Profile
- **Endpoint**: `POST /api/auth/sync`
- **Auth Required**: Yes (`Bearer <Token>`)
- **Body**:
  ```json
  {
    "name": "Jane Driver",
    "role": "driver",
    "phone": "+94771234567"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "user": {
      "_id": "664b1f8e2a3b4c0012a4e5f6",
      "firebaseUid": "FIREBASE_UID_123",
      "email": "jane@example.com",
      "name": "Jane Driver",
      "role": "driver",
      "vehicles": []
    }
  }
  ```

#### 2. Get User Profile & Garage Vehicles
- **Endpoint**: `GET /api/users/profile`
- **Auth Required**: Yes
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "profile": {
      "name": "Jane Driver",
      "email": "jane@example.com",
      "phone": "+94771234567",
      "vehicles": [
        {
          "_id": "664b200e2a3b4c0012a4e5f7",
          "make": "Hyundai",
          "model": "Ioniq 5",
          "batteryCapacity": 77.4,
          "maxChargeRate": 220,
          "licensePlate": "WP-CAB-1234",
          "isPrimary": true
        }
      ]
    }
  }
  ```

#### 3. Add Vehicle to Garage
- **Endpoint**: `POST /api/users/vehicles`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "make": "Tesla",
    "model": "Model Y",
    "batteryCapacity": 75.0,
    "maxChargeRate": 250,
    "licensePlate": "WP-CBA-5678",
    "isPrimary": false
  }
  ```
- **Response (`201 Created`)**: Updated vehicles array.

---

### B. Stations Management (`/api/stations`)

#### 1. List Nearby Active Stations
- **Endpoint**: `GET /api/stations`
- **Auth Required**: Optional (public browse)
- **Query Parameters**:
  - `lat` (optional): User latitude (e.g., `6.9271`)
  - `lng` (optional): User longitude (e.g., `79.8612`)
  - `radius` (optional): Search radius in km (default `50`)
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "stations": [
      {
        "_id": "664b215e2a3b4c0012a4e5f8",
        "stationName": "Colombo Port City SuperHub",
        "address": "Financial District, Port City, Colombo",
        "location": { "type": "Point", "coordinates": [79.8450, 6.9350] },
        "locationType": "Commercial",
        "basePricePerKwh": 85.0,
        "currentDynamicPrice": 93.5,
        "status": "Active",
        "chargers": [
          {
            "_id": "664b220e2a3b4c0012a4e5f9",
            "chargerName": "Bay 1 - 150kW DC",
            "chargerType": "DC_Fast_Level_3",
            "powerOutputKw": 150,
            "status": "Available",
            "supportedConnectors": ["CCS2"]
          }
        ]
      }
    ]
  }
  ```

#### 2. Create Station (Host Only)
- **Endpoint**: `POST /api/stations`
- **Auth Required**: Yes (`role: owner`)
- **Body**:
  ```json
  {
    "stationName": "Kandy City Center EV Hub",
    "address": "Dalada Veediya, Kandy",
    "latitude": 7.2906,
    "longitude": 80.6337,
    "locationType": "Commercial",
    "basePricePerKwh": 90.0
  }
  ```

---

### C. Booking & POS Charging Engine (`/api/bookings`)

#### 1. Create Driver Reservation
- **Endpoint**: `POST /api/bookings`
- **Auth Required**: Yes (`role: driver`)
- **Body**:
  ```json
  {
    "stationId": "664b215e2a3b4c0012a4e5f8",
    "chargerId": "664b220e2a3b4c0012a4e5f9",
    "date": "2026-08-20",
    "startTime": "14:00",
    "endTime": "14:45",
    "customerName": "Jane Driver",
    "customerPhone": "+94771234567"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "booking": {
      "_id": "664b230e2a3b4c0012a4e5fa",
      "status": "Confirmed",
      "lockedPricePerKwh": 93.5,
      "date": "2026-08-20",
      "startTime": "14:00",
      "endTime": "14:45"
    }
  }
  ```

#### 2. POS Start Physical Charging (Host Action)
- **Endpoint**: `POST /api/bookings/:id/start-charging`
- **Auth Required**: Yes (`role: owner`)
- **Response (`200 OK`)**: Updates booking status to `Active_Charging` and sets `actualStartedAt = new Date()`.

#### 3. POS Stop Charging & Digital Checkout (Host Action)
- **Endpoint**: `POST /api/bookings/:id/stop-charging`
- **Auth Required**: Yes (`role: owner`)
- **Body**:
  ```json
  {
    "totalKwhDelivered": 34.2
  }
  ```
- **Response (`200 OK`)**: Calculates total billing, updates status to `Completed`, and releases charger bay back to `Available`.

---

### D. Real-Time Chat Engine (`/api/chat`)

#### 1. Get Driver Conversations List
- **Endpoint**: `GET /api/chat/driver/conversations`
- **Auth Required**: Yes (`role: driver`)
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "stationId": "664b215e2a3b4c0012a4e5f8",
        "stationName": "Colombo Port City SuperHub",
        "lastMessage": "Your charging port is ready and unlocked.",
        "lastTime": "2026-08-20T08:15:00.000Z",
        "unread": 0
      }
    ]
  }
  ```

#### 2. Send Message to Station (Driver $\to$ Host)
- **Endpoint**: `POST /api/chat/driver/:stationId`
- **Auth Required**: Yes (`role: driver`)
- **Body**:
  ```json
  {
    "text": "Hello, is Bay 1 open for early arrival?"
  }
  ```
- **Response (`201 Created`)**: Appends message to the persistent thread and pushes real-time event to host.

#### 3. Send Reply to Driver (Host $\to$ Driver)
- **Endpoint**: `POST /api/chat/owner/:stationId/:driverId`
- **Auth Required**: Yes (`role: owner`)
- **Body**:
  ```json
  {
    "text": "Yes! Bay 1 is clear. You may plug in now."
  }
  ```

---

### E. AI Demand & Surge Predictions (`/api/ai`)

#### 1. Forecast Station Demand & Optimal Tariff
- **Endpoint**: `POST /api/ai/predict-surge`
- **Auth Required**: Optional / Internal
- **Body**:
  ```json
  {
    "stationId": "664b215e2a3b4c0012a4e5f8",
    "hour": 18,
    "dayOfWeek": 3,
    "month": 8
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "predictedUtilization": 0.84,
    "confidenceScore": 0.9276,
    "surgeMultiplier": 0.31,
    "basePrice": 85.0,
    "recommendedDynamicPrice": 111.35,
    "weather": {
      "temperatureF": 84.2,
      "condition": "Clear",
      "precipitationMm": 0.0
    }
  }
  ```
