# VoltHive System Architecture & Engineering Design

> [!NOTE]
> This document details the software architecture, entity relationships, real-time event pipelines, state machines, and security models of the VoltHive platform.

---

## 1. High-Level Architectural Topology

```mermaid
flowchart TB
    subgraph Client Applications
        DriverApp["EV Driver PWA (Mobile / Desktop)"]
        HostDashboard["Station Host POS Dashboard"]
    end

    subgraph Edge & Security
        Nginx["Nginx Reverse Proxy / SSL Termination"]
        FireAuth["Firebase Auth Service (JWT Tokens)"]
    end

    subgraph Backend Core [Node.js / Express Cluster]
        API["REST API Router (/api/*)"]
        AuthMiddleware["Auth & RBAC Middleware"]
        EventEngine["EventBus Pub/Sub Engine"]
        SSEStream["Server-Sent Events Stream (/api/events)"]
    end

    subgraph Intelligence & External Services
        PyAI["Python AI Surge Engine (HistGradientBoosting)"]
        WeatherAPI["Open-Meteo Weather Service"]
    end

    subgraph Data Tier [MongoDB Atlas]
        UserColl[("Users Collection")]
        StationColl[("Stations Collection")]
        ChargerColl[("Chargers Collection")]
        BookingColl[("Bookings Collection")]
        MessageColl[("Messages Collection")]
    end

    DriverApp & HostDashboard <-->|HTTPS / WSS| Nginx
    Nginx <--> API
    DriverApp & HostDashboard <-->|Token Issuance| FireAuth
    API --> AuthMiddleware
    AuthMiddleware -->|Validate JWT| FireAuth
    API --> EventEngine
    EventEngine --> SSEStream
    SSEStream -.->|Push Notifications| DriverApp & HostDashboard
    API <--> PyAI
    PyAI <--> WeatherAPI
    API <--> UserColl & StationColl & ChargerColl & BookingColl & MessageColl
```

---

## 2. Database Entity Relationship Model (ERD)

```mermaid
erDiagram
    USER ||--o{ STATION : "owns (host)"
    USER ||--o{ BOOKING : "books (driver)"
    USER ||--o{ MESSAGE : "sends/receives"
    STATION ||--|{ CHARGER : "contains"
    STATION ||--o{ BOOKING : "hosts"
    STATION ||--o{ MESSAGE : "associated with"
    CHARGER ||--o{ BOOKING : "plugged into"

    USER {
        ObjectId _id PK
        string firebaseUid UK
        string email UK
        string name
        string role "driver | owner | admin"
        string phone
        array vehicles
        boolean biometricEnabled
        timestamps createdAt
    }

    STATION {
        ObjectId _id PK
        ObjectId ownerId FK
        string stationName
        string address
        object location "type: Point, coordinates: [lng, lat]"
        string locationType "Commercial | Residential | Highway"
        number basePricePerKwh
        number currentDynamicPrice
        string status "Active | Maintenance | Offline"
        string phone
        timestamps createdAt
    }

    CHARGER {
        ObjectId _id PK
        ObjectId stationId FK
        string chargerName
        string chargerType "DC_Fast_Level_3 | AC_Level_2 | Ultra_Fast_350kW"
        number powerOutputKw
        string status "Available | Occupied | Reserved | Faulted"
        array supportedConnectors "CCS2, CHAdeMO, Type2"
        timestamps createdAt
    }

    BOOKING {
        ObjectId _id PK
        ObjectId driver FK
        ObjectId station FK
        ObjectId chargerId FK
        string customerName
        string customerPhone
        string date "YYYY-MM-DD"
        string startTime "HH:MM"
        string endTime "HH:MM"
        string status "Pending | Confirmed | Active_Charging | Completed | Cancelled"
        number lockedPricePerKwh
        datetime actualStartedAt
        datetime actualEndedAt
        number totalKwhDelivered
        number totalAmountDue
        timestamps createdAt
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId stationId FK
        ObjectId driverId FK
        string sender "driver | owner"
        string text
        boolean read
        timestamps createdAt
    }
```

---

## 3. Real-Time EventBus & Server-Sent Events (SSE)

To deliver instant, low-latency updates without the high battery and computational overhead of bidirectional WebSockets, VoltHive uses a lightweight **Server-Sent Events (SSE)** architecture:

```mermaid
sequenceDiagram
    autonumber
    participant Driver as Driver PWA
    participant API as Backend REST API
    participant EventBus as EventBus Engine
    participant Host as Host POS Dashboard
    participant DB as MongoDB Atlas

    Driver->>API: Connect to GET /api/events?token=JWT
    Host->>API: Connect to GET /api/events?token=JWT
    API->>EventBus: Register active client connections (DriverId, OwnerId)

    Note over Driver,Host: Driver initiates a booking
    Driver->>API: POST /api/bookings/create
    API->>DB: Save Booking (status: "Pending")
    API->>EventBus: publishToOwner(ownerId, "booking.created", bookingData)
    EventBus-->>Host: SSE Event "booking.created"
    Host->>Host: Display real-time incoming booking alert + audio chime

    Note over Host,Driver: Host starts charging session on POS
    Host->>API: POST /api/bookings/:id/start-charging
    API->>DB: Update Booking (status: "Active_Charging", actualStartedAt: now)
    API->>EventBus: publishToUser(driverId, "booking.updated", bookingData)
    EventBus-->>Driver: SSE Event "booking.updated"
    Driver->>Driver: UI transitions to Live Charging Telemetry
```

---

## 4. Charging Session Lifecycle & POS State Machine

The platform enforces strict state transitions for every charging session to prevent double-booking and guarantee transparent billing:

```mermaid
stateDiagram-v2
    [*] --> Pending: Driver creates booking or Host creates Walk-In
    Pending --> Confirmed: Host confirms slot / Driver checks in
    Pending --> Cancelled: Driver or Host cancels before start
    Pending --> Expired: Driver does not arrive within grace window (15m)

    Confirmed --> Active_Charging: Host plugs in vehicle & clicks "Start Charging"
    Confirmed --> No_Show: Driver fails to appear

    Active_Charging --> Completed: Energy target reached or Host clicks "Stop & Checkout"
    Active_Charging --> Faulted: Hardware trip / Emergency stop triggered

    Completed --> [*]: Final invoice generated & added to ledger
    Cancelled --> [*]
    Expired --> [*]
    No_Show --> [*]
```

### State Descriptions:
1. **Pending**: Slot is reserved; charger is held. Awaiting host confirmation or arrival.
2. **Confirmed**: Reservation is locked in. Charger indicator turns orange ("Reserved").
3. **Active_Charging**: Vehicle is physically plugged in. Energy delivery timer and kWh counters are active.
4. **Completed**: Charging finished; vehicle unplugged. Final ledger transaction recorded with exact duration, kWh consumed, and tariff price.
5. **Cancelled / Expired / No-Show**: Lock released; charger immediately returns to `Available`.

---

## 5. Persistent 1-to-1 Chat Architecture

A core architectural principle of VoltHive is **Single Persistent Thread per Station**:
- A conversation is strictly keyed by `(stationId, driverId)`.
- When a driver clicks "Message" from the Map, Booking Drawer, or Reservations list, the application loads the single historical thread.
- If no prior messages exist, the thread is initialized on first message.
- The Host POS Dashboard groups incoming driver messages by station, showing an aggregated unread count and real-time reply stream.
