# VoltHive Technology Stack Architecture

> [!NOTE]
> This document specifies the comprehensive technology stack, architectural layers, frameworks, libraries, and tooling powering the VoltHive platform.

---

## 1. Stack Overview Matrix

```mermaid
graph TB
    subgraph Client Layer
        PWA[Next.js 16 PWA Client]
        Biometrics[WebAuthn Biometric Engine]
        MapUI[Leaflet Interactive Geo-Map]
    end

    subgraph API & Event Layer
        Express[Node.js / Express REST API]
        SSE[Server-Sent Events EventBus]
        AuthGuard[Firebase JWT Auth & RBAC Middleware]
    end

    subgraph Data & AI Intelligence Layer
        Mongo[(MongoDB Atlas Multi-Model)]
        ML[Python AI Surge Engine - HistGradientBoosting]
        Weather[Open-Meteo Weather API]
    end

    Client Layer <--> API & Event Layer
    API & Event Layer <--> Data & AI Intelligence Layer
```

---

## 2. Frontend Engineering (Driver PWA & Host Dashboard)

### Core Technologies
- **Next.js 16.2.6 (App Router & Turbopack)**: High-performance React framework leveraging React 19 Server/Client Components, streaming SSR, and Turbopack for sub-second build and reload cycles.
- **React 19**: Modern declarative UI foundation utilizing concurrent rendering, hooks, and seamless transitions.
- **TypeScript 5.x**: End-to-end type safety with strict schema checking.

### Styling & Animation Design System
- **Tailwind CSS 4.x & Modern CSS Variables**: Bespoke design system utilizing custom HSL color palettes, glassmorphism (`backdrop-blur-2xl`), responsive fluid typography, and dark/light ambient gradients.
- **Framer Motion 12.x**: Physics-based micro-interactions, layout morphing, modal entrance/exit transitions, and drawer physics.
- **Canvas-Confetti**: Dynamic celebratory feedback upon successful reservation bookings and POS transaction completions.

### Mapping & Geolocation
- **Leaflet & React-Leaflet 5.x**: Hardware-accelerated interactive map rendering with custom animated SVG markers, radius circles, live user location tracking, and real-time station availability clusters.
- **OpenStreetMap CartoDB Positron**: Crisp, vector-optimized tile layers designed for maximum clarity on mobile screens.

### Progressive Web App (PWA) Capabilities
- **Web App Manifest (`manifest.webmanifest`)**: Standalone display mode, dynamic adaptive theme color matching, high-DPI maskable icons.
- **Native Biometrics Integration (`WebAuthn / FaceID / TouchID`)**: Local biometric key storage for instantaneous passwordless driver authentication on mobile devices.
- **Touch Gesture Handling**: Smooth swipe-to-dismiss bottom drawers and mobile docks.

---

## 3. Backend Engineering & REST API

### Core Runtime & Framework
- **Node.js v20+ LTS**: Asynchronous event-driven JavaScript runtime.
- **Express.js 4.x**: High-throughput REST API framework providing robust routing, middleware pipelines, and error handling.

### Real-Time Event Architecture
- **Custom EventBus (`utils/eventBus.js`)**: In-memory pub/sub engine broadcasting targeted events:
  - `publishToUser(userId, event, data)`
  - `publishToOwner(ownerId, event, data)`
  - `publishToStation(stationId, event, data)`
- **Server-Sent Events (SSE) via `/api/events`**: Ultra-lightweight persistent HTTP connections delivering instant updates for new chat messages, booking status transitions, and charger telemetry without the overhead of heavy WebSocket handshakes.

### Authentication & Authorization
- **Firebase Admin SDK**: Cryptographic verification of client-issued JWT tokens, syncing user profiles, and enforcing Role-Based Access Control (`driver` vs `owner` vs `admin`).
- **Security Middleware**:
  - `helmet`: Comprehensive HTTP header security (HSTS, CSP, XSS filtering).
  - `cors`: Granular origin whitelisting for staging, production, and native PWA runtimes.
  - `express-rate-limit`: Brute-force and DDoS mitigation on auth and prediction endpoints.

---

## 4. Artificial Intelligence & Machine Learning Engine

### Python Environment & Frameworks
- **Python 3.10+**: Runtime environment for data preprocessing, model exploration, and inference.
- **Scikit-Learn 1.3+**: Implementation of the champion **`HistGradientBoostingRegressor`**, `RandomForestRegressor`, `StandardScaler`, and `OneHotEncoder`.
- **Pandas & NumPy**: Vectorized dataset operations across 1.3+ million charging records.
- **Joblib**: Production-grade model serialization and high-speed in-memory loading (`surge_model.pkl`).

### Live Weather Pipeline
- **Open-Meteo Weather API Integration**: Zero-key, ultra-reliable live meteorological data fetching using reverse geocoded station latitude/longitude coordinates (temperature, precipitation, WMO condition codes).

---

## 5. Database & Storage Architecture

### Primary Database: MongoDB Atlas
- **MongoDB 7.0+ Multi-Tenant Cluster**: Document-oriented NoSQL database optimized for rapid JSON serialization and high-frequency writes.
- **Mongoose 8.x ODM**: Schema validation, virtual population, and automated lifecycle hooks.

### Critical Indexes & Data Integrity
- **Geospatial Indexes (`2dsphere`)**: Real-time bounding-box and radius queries for nearby stations.
- **Compound Indexes**:
  - `Message`: `{ stationId: 1, driverId: 1, createdAt: -1 }` (sub-millisecond chat retrieval).
  - `Booking`: `{ station: 1, date: 1, chargerId: 1, status: 1 }` (zero double-booking guarantee).
  - `Station`: `{ ownerId: 1, status: 1 }` (instant host station aggregation).

---

## 6. DevOps, Containerization, & Infrastructure

- **Docker & Docker Compose**: Multi-container containerization packaging the Next.js frontend, Node.js backend, and Python ML service into isolated, reproducible production containers.
- **PM2 Process Manager**: Cluster-mode Node.js execution with automated restarts, zero-downtime reloads, and memory leak safeguards.
- **Nginx Reverse Proxy**: TLS/SSL termination, HTTP/2 multiplexing, Gzip/Brotli compression, and proxy routing.
- **GitHub Actions**: Automated CI/CD pipelines running lint checks, TypeScript verification, unit tests, and production image builds.
