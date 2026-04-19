# VoltHive Technical Documentation

Last updated: 2026-04-19
Scope: Full technical documentation for current implementation state (separate from README)

## 1. Document Purpose
This document is the technical source of truth for the VoltHive project at the current development state. It covers:
- Full system architecture
- Frontend, backend, and AI service internals
- File structure and module responsibilities
- Technology stack and dependency versions
- API design and data models
- Environment variables and configuration
- Deployment topology and operations
- Security posture
- Current limitations and future extension points
- Maintenance/update process for continuous documentation updates

## 2. Current Deployment Status
- Frontend: Deployed on Vercel
- Backend: Deployed on Azure as a containerized image
- AI Service: Not deployed yet (currently local/dev runtime)

## 3. High-Level System Overview
VoltHive is a 3-service platform for EV charging discovery and booking:
1. Frontend web app (Next.js/React) for drivers and station owners
2. Backend API (Express + MongoDB + Firebase token validation)
3. AI microservice (Flask + scikit-learn) for surge pricing suggestions

Primary data/identity systems:
- MongoDB for application data (users, stations, bookings)
- Firebase Authentication for identity and JWT verification
- Google Maps APIs for map rendering and traffic-aware routing calculations

## 4. Monorepo Structure
Root folders:
- Images: branding and screenshots
- volthive-frontend: web client application
- volthive-backend: API and business logic
- volthive-ai: machine learning service for pricing support

Root technical files:
- README.md
- QUICK_START.md
- DEPLOYMENT_CHECKLIST.md
- PROJECT_PROFESSIONAL_ASSESSMENT.md
- LICENSE (MIT)
- .gitignore
- .dockerignore
- .github/workflows/backend-ci.yml

## 5. Architecture and Runtime Flow
### 5.1 Request/response flow
1. User accesses frontend deployed on Vercel
2. Frontend authenticates user with Firebase Auth
3. Frontend requests Firebase ID token from current user session
4. Frontend calls backend API with Authorization: Bearer token
5. Backend verifies token using Firebase Admin SDK middleware
6. Backend queries MongoDB and returns normalized data
7. For AI pricing endpoints and smart match, backend calls Flask AI service
8. Backend returns data in success/data payload structure used by UI

### 5.2 Smart Match flow (current)
1. User submits plug preference + location context
2. Backend finds nearby stations via MongoDB geospatial query (15 km)
3. Backend calls AI service to get suggested pricing multiplier
4. Backend applies multiplier to station base prices
5. Backend ranking service calculates value score (time and price weighted)
6. Top ranked stations returned to frontend

### 5.3 Booking flow (driver/owner)
1. Driver selects station and charger
2. Booking API validates payload (ObjectId/date/time/price/time ordering)
3. Backend creates booking status Pending
4. Charger state set to PENDING_APPROVAL and booking linked via activeBookingId
5. Owner sees pending items in POS queue
6. Owner transitions status: Confirmed -> Active_Charging -> Completed
7. Completion computes consumed energy and total cost from duration and power
8. Auto-cancel endpoint can release pending booking if not approved in time

## 6. Technology Stack and Versions
## 6.1 Frontend (volthive-frontend)
Core:
- next: 16.2.1
- react: 19.2.4
- react-dom: 19.2.4
- typescript: ^5

UI and integration:
- framer-motion: ^12.38.0
- firebase: ^12.11.0
- @react-google-maps/api: ^2.20.8
- @vis.gl/react-google-maps: ^1.8.1
- recharts: ^3.8.1

Styling/linting:
- tailwindcss: ^4
- @tailwindcss/postcss: ^4
- eslint: ^9
- eslint-config-next: 16.2.1

## 6.2 Backend (volthive-backend)
Core:
- node runtime target: 18.x (Docker/CI)
- express: ^5.2.1
- mongoose: ^9.3.3
- firebase-admin: ^13.7.0

Supporting:
- axios: ^1.14.0
- helmet: ^8.1.0
- cors: ^2.8.6
- compression: ^1.8.1
- express-rate-limit: ^8.1.0
- dotenv: ^17.3.1
- morgan: ^1.10.1
- nodemon (dev): ^3.1.14

## 6.3 AI service (volthive-ai)
Python package requirements:
- flask >= 3.0.0
- flask-cors >= 4.0.0
- pandas >= 2.2.0
- numpy >= 1.26.0
- scikit-learn >= 1.4.0
- joblib >= 1.3.0

## 6.4 CI/CD and infra tooling
- GitHub Actions for backend CI + Docker push
- Docker (alpine-based Node image)
- Vercel for frontend deployment
- Azure container deployment for backend

## 7. Backend Code Structure and Responsibilities
### 7.1 Entry and infrastructure
- src/server.js:
  - Express app setup
  - CORS allowlist parsing and enforcement
  - Rate limiter setup on /api
  - Helmet/compression/morgan configuration
  - JSON payload size limits
  - Health endpoint (/health)
  - Route registration
  - 404 and global error handlers
  - Graceful SIGTERM shutdown

- src/config/db.js:
  - MongoDB connection fallback strategy:
    - MONGO_URI
    - LOCAL_MONGO_URI
    - mongodb://127.0.0.1:27017/Volthive_DB
  - Optional DB_REQUIRED hard-fail behavior
  - Runtime disconnected/error listeners

### 7.2 Auth middleware
- src/middleware/authMiddleware.js:
  - Firebase Admin initialization from:
    - FIREBASE_SERVICE_ACCOUNT_BASE64, or
    - FIREBASE_SERVICE_ACCOUNT_PATH
  - Bearer token validation
  - Attaches decoded token to req.user

### 7.3 Models
- src/models/User.js:
  - name, email(unique), role(driver/owner), firebaseUid(unique)
  - timestamps enabled

- src/models/Station.js:
  - ownerId reference
  - stationName, address, location GeoJSON Point
  - chargers subdocuments
  - basePricePerKwh
  - rateConfig (baseRate + customRates)
  - isBookingEnabled
  - 2dsphere index on location

- src/models/Booking.js:
  - driver/station references
  - chargerId
  - date, startTime, endTime
  - status lifecycle fields
  - lockedPricePerKwh
  - actualStartedAt/actualEndedAt
  - energyConsumedKWh and totalCostLKR

### 7.4 Controllers and services
- src/controllers/stationController.js:
  - public station listing
  - owner station listing
  - create/get/delete station
  - station rate update
  - smart match orchestration (geo query + AI multiplier + ranking)

- src/services/aiService.js:
  - backend-side call to Flask suggest-price endpoint
  - context payload shaping and timeout handling
  - safe fallback response when AI unavailable

- src/services/rankingService.js:
  - compatibility filtering by plug type
  - Google Distance Matrix request for drive-time
  - weighted value score (time + price)
  - top 3 station return

- src/utils/stationSerializer.js:
  - canonical frontend-facing station format
  - normalizes charger status labels and numeric fields
  - maps stationName -> name and basePricePerKwh -> pricePerKWh

### 7.5 Routes
- src/routes/userRoutes.js:
  - POST /api/users
  - GET /api/users/profile

- src/routes/stationRoutes.js:
  - GET /api/stations
  - POST /api/stations/smart-match
  - GET /api/stations/owner
  - GET /api/stations/:id
  - POST /api/stations
  - DELETE /api/stations/:id
  - PUT /api/stations/:id/rates

- src/routes/bookingRoutes.js:
  - POST /api/bookings
  - GET /api/bookings/driver
  - GET /api/bookings/station/:stationId
  - GET /api/bookings/owner
  - PATCH /api/bookings/:id/status
  - PATCH /api/bookings/:id/auto-cancel

- src/routes/aiRoutes.js:
  - GET /api/ai/health
  - GET /api/ai/pricing-suggestion

### 7.6 Data seeding utility
- src/seedStations.js:
  - generates synthetic station data across Sri Lankan city hubs
  - binds seeded stations to existing owner account
  - creates randomized charger setups and rates

## 8. Frontend Code Structure and Responsibilities
### 8.1 App shell and routing
- src/app/layout.tsx:
  - global metadata
  - fonts
  - AuthProvider wrapping
  - MotionShell route transitions

- src/app/page.tsx:
  - landing page + map mode toggle
  - fetches public station data
  - shows marketing sections and public station drawer

- src/app/login/page.tsx:
  - login/signup UI
  - Firebase auth calls
  - backend user profile/bootstrap calls
  - role-based post-auth navigation

- src/app/(driver)/driver-dashboard/page.tsx:
  - protected driver workspace
  - keeps map mounted for smooth tab transitions
  - hosts booking drawer and driver views

- src/app/(owner)/owner-dashboard/page.tsx:
  - protected owner workspace
  - owner station loading via auth token
  - tabbed owner operations surfaces

### 8.2 Shared infrastructure
- src/context/AuthContext.tsx:
  - user/loading state
  - login/signup/logout methods
  - auth state subscription

- src/lib/firebase.ts:
  - frontend Firebase app init and auth export

- src/lib/api.ts:
  - backend base URL normalization
  - path builder apiUrl
  - fetchJson helper with error parsing

- src/components/ProtectedRoute.tsx:
  - redirects unauthenticated users to /login

- src/components/MotionShell.tsx:
  - route transition container animation

### 8.3 Map and booking experience
- src/components/StationMap.tsx:
  - Google map rendering and advanced markers
  - geolocation detection
  - idle/search/results states
  - route rendering with DirectionsRenderer
  - smart-match UI flow scaffolding
  - station detail modal and booking handoff

- src/components/driver/BookingDrawer.tsx:
  - station-specific booking panel
  - charger selection
  - booking submit + 3-minute auto-cancel scheduling

- src/components/driver/BookingConfirmModal.tsx:
  - date/time selection and pre-confirmation summary

- src/components/driver/DatePicker.tsx and TimeSlotPicker.tsx:
  - booking date/time UX and booked-slot conflict visualization

### 8.4 Driver views
- src/components/driver/DriverSidebar.tsx
- src/components/driver/views/DriverHome.tsx
- src/components/driver/views/MyGarage.tsx
- src/components/driver/views/ReservationsView.tsx
- src/components/driver/views/AccountView.tsx

These implement driver UI navigation, summary cards, reservation surfaces, profile/settings surfaces, and supporting actions.

### 8.5 Owner views
- src/components/owner/OwnerSidebar.tsx
- src/components/owner/views/OwnerHome.tsx
- src/components/owner/views/LiveOperationsView.tsx
- src/components/owner/views/StationsView.tsx
- src/components/owner/AddChargerForm.tsx
- src/components/owner/RateCalendar.tsx

These implement owner dashboard metrics, live POS queue, station inventory CRUD UI, and tariff scheduling UI.

### 8.6 Home marketing sections
- src/components/home/HomeNavbar.tsx
- src/components/home/Hero.tsx
- src/components/home/Features.tsx
- src/components/home/Footer.tsx

### 8.7 Styling and design system
- src/app/globals.css defines:
  - brand color variables
  - motion timings/easing
  - gradients and utility classes
  - custom scrollbar/theme polish

## 9. AI Service Structure and Responsibilities
- app.py:
  - Flask app startup
  - CORS allowlist parsing
  - model and training columns loading from models folder
  - /api/ai/health endpoint
  - /api/ai/suggest-price endpoint
  - preprocessing and one-hot alignment with training schema
  - occupancy prediction and pricing multiplier mapping

- train_surge.py:
  - dataset read from data/surge_pricing_data.csv
  - feature selection and one-hot encoding
  - random forest training
  - MAE reporting
  - saves model and model_columns artifacts

- inspect_data.py:
  - utility script to inspect category values in weather/event columns

- .gitignore excludes data/models/venv from source control

## 10. Data Contracts and API Payload Shapes
### 10.1 Standard backend response pattern
Many endpoints return:
- success: boolean
- data: object or array
- optional count/message/error fields

Frontend code generally expects this shape and falls back if plain arrays are returned.

### 10.2 Key domain entities
- User:
  - name, email, role, firebaseUid

- Station:
  - ownerId, stationName, address, location
  - chargers[]
  - basePricePerKwh
  - rateConfig
  - isBookingEnabled

- Booking:
  - driver, station, chargerId
  - date/time range
  - status lifecycle
  - billing metrics

## 11. Environment Variables
## 11.1 Backend (.env)
Core:
- PORT
- NODE_ENV
- DB_REQUIRED

Database:
- MONGO_URI
- LOCAL_MONGO_URI

Security/Auth:
- CORS_ALLOWED_ORIGINS
- FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_PATH

External integrations:
- GOOGLE_MAPS_API_KEY
- FLASK_API_URL

Operational:
- RATE_LIMIT_MAX
- LOG_LEVEL
- DEBUG_MODE

## 11.2 Frontend (.env.local)
- NEXT_PUBLIC_BACKEND_URL
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- NEXT_PUBLIC_GOOGLE_MAP_ID

## 11.3 AI (.env)
- AI_PORT
- AI_DEBUG
- AI_CORS_ALLOWED_ORIGINS
- MODEL_PATH
- COLUMNS_PATH
- LOG_LEVEL

## 12. Security Posture (Current)
Implemented controls:
- Firebase JWT verification in backend middleware
- Role-gated owner and driver endpoints
- CORS allowlist validation
- Helmet headers and compression
- Rate limiting on /api
- Input validation for booking payloads
- Payload size limiting
- Graceful fallback behavior when AI service unavailable
- Credential files and .env patterns ignored by git

Current operational cautions:
- Do not commit .env, Firebase private keys, or runtime credentials
- Ensure production CORS origins are explicitly configured
- Run AI in non-debug mode for production
- Rotate API keys/secrets regularly

## 13. CI/CD and Deployment Pipeline
### 13.1 GitHub Actions backend workflow
File: .github/workflows/backend-ci.yml
- Triggers on push/PR to develop for backend path changes
- Job 1: npm ci + syntax check
- Job 2: Docker login + build and push image to Docker Hub

### 13.2 Frontend deployment
- Platform: Vercel
- Config: vercel.json with Next.js framework declaration
- Environment variables managed in Vercel project settings

### 13.3 Backend deployment
- Platform: Azure container runtime using container image
- Dockerfile present with multi-stage optimization and healthcheck

Note: A legacy/simple Dockerfile-like content currently appears in volthive-backend/.dockerignore, which should be reviewed for correctness because .dockerignore should list ignored paths, not Docker build instructions.

### 13.4 AI deployment
- Not deployed currently
- Runs locally via python app.py
- Ready for containerization and cloud deployment once model artifact/data strategy is finalized

## 14. Build and Run Procedures (Current)
### 14.1 Local development (three terminals)
1. Backend:
   - cd volthive-backend
   - npm install
   - npm run dev

2. Frontend:
   - cd volthive-frontend
   - npm install
   - npm run dev

3. AI:
   - cd volthive-ai
   - python -m venv venv
   - source venv/bin/activate
   - pip install -r requirements.txt
   - python app.py

### 14.2 Health checks
- Backend: GET /health
- AI: GET /api/ai/health

## 15. Complete Maintained File Inventory and Responsibilities
### 15.1 Root-level
- DEPLOYMENT_CHECKLIST.md: deployment procedures and readiness checklist
- QUICK_START.md: fast setup path
- PROJECT_PROFESSIONAL_ASSESSMENT.md: architecture/security assessment narrative
- README.md: project overview
- LICENSE: MIT license
- .gitignore: repository-wide ignore rules
- .dockerignore: repository-wide docker context exclusions
- .github/workflows/backend-ci.yml: backend CI/CD workflow

### 15.2 volthive-backend
- Dockerfile
- .dockerignore
- .env.example
- .gitignore
- package.json
- package-lock.json
- README.md
- src/server.js
- src/seedStations.js
- src/config/db.js
- src/controllers/stationController.js
- src/middleware/authMiddleware.js
- src/models/User.js
- src/models/Station.js
- src/models/Booking.js
- src/routes/userRoutes.js
- src/routes/stationRoutes.js
- src/routes/bookingRoutes.js
- src/routes/aiRoutes.js
- src/services/aiService.js
- src/services/rankingService.js
- src/utils/stationSerializer.js

### 15.3 volthive-frontend
- .env.example
- .gitignore
- package.json
- package-lock.json
- README.md
- eslint.config.mjs
- postcss.config.mjs
- next.config.ts
- tsconfig.json
- vercel.json
- src/app/globals.css
- src/app/layout.tsx
- src/app/page.tsx
- src/app/login/page.tsx
- src/app/(driver)/driver-dashboard/page.tsx
- src/app/(owner)/owner-dashboard/page.tsx
- src/components/MotionShell.tsx
- src/components/ProtectedRoute.tsx
- src/components/StationMap.tsx
- src/components/home/HomeNavbar.tsx
- src/components/home/Hero.tsx
- src/components/home/Features.tsx
- src/components/home/Footer.tsx
- src/components/driver/BookingConfirmModal.tsx
- src/components/driver/BookingDrawer.tsx
- src/components/driver/DatePicker.tsx
- src/components/driver/DriverSidebar.tsx
- src/components/driver/SmartMatchPanel.tsx
- src/components/driver/TimeSlotPicker.tsx
- src/components/driver/views/AccountView.tsx
- src/components/driver/views/DriverHome.tsx
- src/components/driver/views/MyGarage.tsx
- src/components/driver/views/ReservationsView.tsx
- src/components/owner/AddChargerForm.tsx
- src/components/owner/OwnerSidebar.tsx
- src/components/owner/RateCalendar.tsx
- src/components/owner/views/LiveOperationsView.tsx
- src/components/owner/views/OwnerHome.tsx
- src/components/owner/views/StationsView.tsx
- src/context/AuthContext.tsx
- src/lib/api.ts
- src/lib/firebase.ts

### 15.4 volthive-ai
- .env.example
- .gitignore
- README.md
- requirements.txt
- app.py
- train_surge.py
- inspect_data.py

### 15.5 Assets
- Images/Banner/*
- Images/Logo/*
- Images/Screenshots/*
- volthive-frontend/public/brand/*
- volthive-frontend/public/icons/*

## 16. Known Gaps and Risks
1. AI service is not yet deployed, so production AI pricing depends on availability strategy and deployment completion.
2. Frontend includes some placeholder/mock UX sections (for example chart placeholders and map-based demo flows) that should be tied to fully live data for production analytics fidelity.
3. Legacy/incorrect content in backend .dockerignore should be corrected to avoid operational confusion.
4. Some documentation references mention additional files (for example detailed security audit report) that are not part of the current tracked structure snapshot.
5. Google Maps and Firebase credentials must be managed carefully across environments to avoid runtime failures.

## 17. License
Project is licensed under MIT License.
- Copyright (c) 2026 VoltHive
- Permission for use/copy/modify/distribute/sublicense/sell with notice inclusion
- Software provided as-is without warranty

## 18. Documentation Maintenance Protocol
Use this protocol whenever new features are added:
1. Update this file in the same pull request as code changes.
2. Keep version/dependency sections aligned with package.json and requirements.txt.
3. Add/adjust route and model sections when API contracts change.
4. Add new files to the inventory and describe module responsibility.
5. Update deployment status if any service hosting state changes.
6. Update Known Gaps and Risks for unresolved technical debt.
7. Keep date stamp at top current.

Recommended changelog block for each update:
- Date
- Changed modules
- API contract changes
- Data model changes
- Deployment impact
- Migration/backward-compatibility notes

## 19. Current Technical Summary
VoltHive currently implements a full-stack EV charging platform with role-based user journeys, geospatial station discovery, booking lifecycle management, and AI-assisted dynamic pricing support. Frontend and backend are deployment-ready and hosted (Vercel/Azure), while AI remains locally operable and technically prepared for future deployment integration.
