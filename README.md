# ⚡ VoltHive - Smart EV Charging Platform

<div align="center">

![VoltHive Banner](./Images/Banner/bannerVolthive.jpg)

**Smart, Secure, and Seamless EV Charging at Your Fingertips**

[![Node.js](https://img.shields.io/badge/Node.js-v18.x-green)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://python.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.3+-green)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](./LICENSE)

[📖 Quick Start](#-quick-start) • [🏗️ Architecture](#-architecture) • [🔒 Security](#-security) • [🚀 Deployment](#-deployment)

</div>

---

## 🎯 Overview

VoltHive is a **comprehensive, production-ready EV charging platform** designed for academic research and real-world deployment. It bridges drivers seeking charge ports with station owners offering reliable EV charging while helping balance Sri Lanka’s national grid.

### 🌟 Key Highlights

- **Real-time Station Aggregation**: Discover nearby charging stations within a 15km radius using geospatial indexing
- **Smart Matching Algorithm**: AI-powered station ranking combining distance, availability, and dynamic pricing
- **Surge Pricing Intelligence**: Machine learning model predicts optimal pricing based on demand patterns
- **Role-Based Access Control**: Separate dashboards for drivers and station owners
- **Production-Ready Architecture**: Monorepo with 3 independent microservices (Frontend, Backend, AI)
- **Enterprise Security**: Firebase authentication, CORS validation, rate limiting, comprehensive input validation
- **Cloud-Native Deployment**: Vercel (frontend), Azure Container (backend), MongoDB Atlas (database)

---

## 📸 Visual Walkthrough

<!-- Screenshot Grid Start -->
<div align="center">
  <table>
    <tr>
      <td><img src="./Images/Screenshots/Home.png" alt="Home Page" width="180"/></td>
      <td><img src="./Images/Screenshots/Login.png" alt="Login Page" width="180"/></td>
      <td><img src="./Images/Screenshots/MAin%20MAp%28Desktop%29.png" alt="Main Map Desktop" width="180"/></td>
    </tr>
    <tr>
      <td><img src="./Images/Screenshots/Main%20Map%20Mobile.png" alt="Main Map Mobile" width="180"/></td>
      <td><img src="./Images/Screenshots/My%20Cars.png" alt="My Cars Page" width="180"/></td>
      <td><img src="./Images/Screenshots/User%20Profile.png" alt="User Profile Page" width="180"/></td>
    </tr>
  </table>
</div>
<!-- Screenshot Grid End -->

---

## ✨ Core Features

### 🎯 For Drivers

| Feature | Description |
|---------|-------------|
| 🔍 **Station Discovery** | Real-time search with 15km geospatial radius filtering |
| 💰 **Smart Pricing** | AI-driven surge pricing suggestions based on demand |
| 📅 **Booking System** | Reserve charging slots with flexible time scheduling |
| 🗺️ **Navigation Integration** | Google Maps directions and distance matrix |
| 🚗 **Fleet Management** | Track multiple vehicles and charging history |
| ⚡ **Live Status** | Real-time charging station availability and occupancy |

### 🏢 For Station Owners

| Feature | Description |
|---------|-------------|
| 📊 **Live Operations Dashboard** | Real-time monitoring of all charging stations |
| 💵 **Dynamic Rate Setting** | Adjust rates based on demand and availability |
| 📈 **Business Analytics** | Comprehensive revenue tracking and utilization reports |
| 🛠️ **Station Management** | Add, update, and manage charging infrastructure |
| 👥 **Customer Insights** | Monitor booking patterns and customer preferences |

---

## 🏗️ Architecture

### 📁 Project Structure

```
Volthive/
├── 📱 volthive-frontend/          # Next.js 16 + React 19 + TypeScript
│   ├── src/
│   │   ├── app/                   # App router & layouts
│   │   ├── components/            # Reusable UI components
│   │   │   ├── driver/            # Driver dashboard components
│   │   │   ├── owner/             # Owner dashboard components
│   │   │   └── home/              # Landing page sections
│   │   ├── context/               # Auth state management
│   │   └── lib/                   # API client & Firebase config
│   └── vercel.json                # Deployment configuration
│
├── 🔧 volthive-backend/           # Express 5 + Node.js + MongoDB
│   ├── src/
│   │   ├── routes/                # REST API endpoints
│   │   │   ├── aiRoutes.js        # AI pricing service
│   │   │   ├── bookingRoutes.js   # Booking management
│   │   │   ├── stationRoutes.js   # Station operations
│   │   │   └── userRoutes.js      # User management
│   │   ├── services/              # Business logic
│   │   │   ├── aiService.js       # Flask API client
│   │   │   └── rankingService.js  # Smart matching algorithm
│   │   ├── models/                # MongoDB schemas
│   │   │   ├── User.js
│   │   │   ├── Station.js
│   │   │   └── Booking.js
│   │   ├── middleware/            # Auth & validation
│   │   ├── config/                # Database connectivity
│   │   └── server.js              # Express app entry point
│   ├── Dockerfile                 # Multi-stage build container
│   └── .dockerignore              # Optimized build context
│
├── 🤖 volthive-ai/                # Flask + scikit-learn
│   ├── app.py                     # Flask API server
│   ├── train_surge.py             # RandomForest model training
│   ├── inspect_data.py            # Data exploration
│   └── models/                    # Persisted ML models
│
├── 🖼️ Images/
│   ├── Screenshots/               # UI screenshots (6 images)
│   ├── Banner/                    # Marketing banner
│   └── Logo/                      # Branding assets
│
├── 📑 Documentation/
│   ├── SECURITY_AUDIT_REPORT.md   # Detailed security findings
│   ├── DEPLOYMENT_CHECKLIST.md    # Deployment procedures
│   └── QUICK_START.md             # 5-minute setup guide
│
├── .env.example                   # Configuration template
├── .gitignore                     # Git ignore patterns
└── LICENSE                        # MIT License
```

### 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile/Web User                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │   Vercel (Frontend)         │
    │  Next.js 16 + React 19      │
    │  - Auth Context             │
    │  - Google Maps Integration  │
    │  - Real-time Updates        │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  Express.js Backend (Azure) │
    │  - RESTful API              │
    │  - Firebase JWT Validation  │
    │  - Request Validation       │
    │  - Rate Limiting            │
    └────┬──────────────────┬─────┘
         │                  │
    ┌────▼────┐      ┌──────▼──────┐
    │ MongoDB  │      │  Flask AI   │
    │ Atlas    │      │  Service    │
    └──────────┘      │  (Port 5001)│
                      │  - Pricing  │
                      │  - Ranking  │
                      └─────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3 with responsive design
- **Animations**: Framer Motion for smooth transitions
- **State Management**: React Context API + Firebase Auth
- **Maps**: Google Maps JavaScript API with geospatial queries
- **Deployment**: Vercel with automatic deployments

### Backend
- **Runtime**: Node.js 18 LTS
- **Framework**: Express 5.x
- **Database**: MongoDB 9+ with Mongoose ODM
- **Authentication**: Firebase Admin SDK (JWT verification)
- **Security**: Helmet.js, CORS validation, rate limiting
- **API Documentation**: RESTful with comprehensive error handling
- **Deployment**: Docker (multi-stage) → Azure Container Registry

### AI Service
- **Language**: Python 3.10+
- **Framework**: Flask with JSON API
- **ML Model**: scikit-learn RandomForestRegressor
- **Data Processing**: pandas, NumPy
- **Features**: Surge pricing prediction, demand forecasting
- **Deployment**: Standalone containerized service

### Infrastructure & DevOps
- **Container Runtime**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Cloud Services**: 
  - MongoDB Atlas (managed database)
  - Firebase Console (authentication & JWT)
  - Google Cloud (Maps API)
  - Azure Container Registry (backend storage)
  - Vercel (frontend CDN & functions)

---

## 🔒 Security

### Authentication & Authorization
- ✅ **Firebase Auth Integration**: OAuth 2.0 + Email/Password authentication
- ✅ **JWT Token Verification**: All backend requests validated against Firebase tokens
- ✅ **Role-Based Access Control**: Separate driver/owner permissions with granular checks

### API Security
- ✅ **CORS Whitelist**: Only allowed origins can access backend APIs
- ✅ **Rate Limiting**: 300 requests per 15 minutes per IP address
- ✅ **Input Validation**: ObjectId, date format, time slots all validated
- ✅ **Error Handling**: Stack traces never exposed to clients in production
- ✅ **HTTP Security Headers**: Helmet.js protects against common attacks

### Data Protection
- ✅ **Environment Variables**: No hardcoded secrets (URLs, API keys)
- ✅ **Secure Defaults**: Graceful fallbacks if external services unavailable
- ✅ **MongoDB Security**: Connection over TLS, field-level access control
- ✅ **Credential Management**: Service account keys excluded from version control
- ✅ **Health Checks**: Docker HEALTHCHECK and REST endpoints for monitoring

### Deployment Security
- ✅ **Multi-stage Docker Builds**: 30-40% smaller images, distroless where possible
- ✅ **Non-root User Execution**: Container runs as unprivileged user
- ✅ **Secrets Management**: All sensitive config via environment variables
- ✅ **Graceful Shutdown**: SIGTERM handling with connection cleanup

### Compliance
- ✅ **CORS Headers**: Cross-origin requests properly restricted
- ✅ **No PII in Logs**: Personal data not logged to production logs
- ✅ **Secure Defaults**: All services fail-secure with sensible fallbacks
- ✅ **Audit Trail**: Key operations (bookings, price changes) logged with timestamps

**See [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) for detailed security analysis.**

---

## 🚀 Deployment

### Prerequisites

```bash
# Node.js 18+ with npm 11+
node --version  # v18.x or higher
npm --version   # 11.8.0 or higher

# Python 3.10+
python --version  # 3.10 or higher

# Docker (for containerized deployment)
docker --version
```

### 🏃 Quick Start (5 minutes)

#### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd Volthive

# Backend setup
cd volthive-backend
npm install

# Frontend setup (new terminal)
cd volthive-frontend
npm install

# AI Service setup (new terminal)
cd volthive-ai
pip install -r requirements.txt
```

#### 2. Environment Configuration

```bash
# Backend (.env)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/volthive
FLASK_API_URL=http://localhost:5001
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
NODE_ENV=development
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Frontend (.env.local)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# AI Service (.env)
FLASK_DEBUG=True
AI_PORT=5001
AI_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000
```

#### 3. Start Services

```bash
# Terminal 1: Backend (port 4000)
cd volthive-backend
npm start

# Terminal 2: Frontend (port 3000)
cd volthive-frontend
npm run dev

# Terminal 3: AI Service (port 5001)
cd volthive-ai
python app.py
```

#### 4. Access Application

```
Frontend: http://localhost:3000
Backend:  http://localhost:4000
AI API:   http://localhost:5001
Health:   http://localhost:4000/health
```

**See [QUICK_START.md](./QUICK_START.md) for detailed setup guide.**

### ☁️ Production Deployment

#### Frontend (Vercel)

```bash
# Automatic deployment from GitHub
# 1. Connect your repository to Vercel
# 2. Set environment variables in Vercel dashboard
# 3. Each push to main triggers automatic deployment
# 4. Staging preview for pull requests

vercel deploy --prod  # Manual deployment
```

#### Backend (Azure Container Registry)

```bash
# Build and push Docker image
docker build -t volthive-backend:latest .
docker tag volthive-backend:latest <acregistry>.azurecr.io/volthive-backend:latest
docker push <acregistry>.azurecr.io/volthive-backend:latest

# Deploy to container instance or Kubernetes
az container create --resource-group mygroup \
  --name volthive-backend \
  --image <acregistry>.azurecr.io/volthive-backend:latest \
  --cpu 2 --memory 4 \
  --environment-variables MONGO_URI=... FLASK_API_URL=...
```

#### AI Service (Standalone)

```bash
# Build Docker image
docker build -f volthive-ai/Dockerfile -t volthive-ai:latest .

# Push to registry
docker push <registry>/volthive-ai:latest

# Deploy alongside backend
```

**See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step production deployment procedures.**

### 🧪 Health Checks

```bash
# Backend health
curl http://localhost:4000/health

# AI Service health
curl http://localhost:4000/api/ai/health

# MongoDB connection
curl -X POST http://localhost:4000/api/stations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response example:
# { "status": "healthy", "timestamp": "2024-01-15T10:30:00Z" }
```

---

## 📊 API Endpoints

### Station Management
```
GET    /api/stations              # List all stations
GET    /api/stations/:id          # Get station details
POST   /api/stations              # Create new station (owner)
PATCH  /api/stations/:id          # Update station (owner)
GET    /api/stations/nearby       # Smart match (geospatial + AI)
```

### Booking Management
```
GET    /api/bookings              # User's bookings
POST   /api/bookings              # Create new booking
PATCH  /api/bookings/:id          # Update booking status
DELETE /api/bookings/:id          # Cancel booking
```

### AI Pricing
```
POST   /api/ai/suggest-price      # Get AI price suggestion
GET    /api/ai/health             # AI service health check
```

### User Management
```
GET    /api/users/:id             # User profile
POST   /api/users                 # Create user
PATCH  /api/users/:id             # Update profile
```

---

## 🧬 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  email: String,                    // Unique
  firebaseUID: String,              // Firebase ID
  role: "driver" | "owner",
  profile: {
    name: String,
    phone: String,
    location: GeoJSON Point
  },
  vehicles: [ObjectId],             // References to cars
  createdAt: Date,
  updatedAt: Date
}
```

### Station Collection
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId,                // Reference to User
  name: String,
  address: String,
  location: {                       // GeoJSON for geospatial queries
    type: "Point",
    coordinates: [longitude, latitude]
  },
  chargerCount: Number,
  basePrice: Number,                // $/kWh
  currentOccupancy: Number,
  availability: {
    slots: [{ startTime, endTime, available: Boolean }]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Collection
```javascript
{
  _id: ObjectId,
  driverId: ObjectId,               // Reference to User
  stationId: ObjectId,              // Reference to Station
  vehicleId: ObjectId,              // Reference to Vehicle
  status: "pending" | "confirmed" | "active_charging" | "completed" | "cancelled",
  startTime: Date,
  endTime: Date,
  estimatedPrice: Number,
  actualPrice: Number,
  priceMultiplier: Number,          // AI-suggested surge pricing
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🤝 Contributing

We welcome contributions to VoltHive! This is an academic project designed for research and real-world learning.

### Development Workflow
1. Create feature branch from `dev-dimalsha`
2. Make changes with clear commit messages
3. Ensure all tests pass: `npm test`, `python -m pytest`
4. Submit pull request to `develop` branch
5. Merge to `main` after code review (triggers production deployment)

### Code Quality Standards
- ✅ TypeScript with strict mode enabled
- ✅ ESLint configuration must pass
- ✅ All API endpoints have input validation
- ✅ Error handling is comprehensive
- ✅ Documentation updated with changes

### Reporting Issues
Please use GitHub Issues with clear descriptions and reproduction steps.

---

## 📜 License

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) file for details.

---

## 🎓 Academic Context

VoltHive was developed as an academic research project exploring:
- **Smart city infrastructure** for sustainable transportation
- **Machine learning applications** in demand-based pricing
- **Geospatial databases** for location-based services
- **Real-time systems** using microservices architecture
- **Production-grade security** for fintech-like applications

**Thesis Focus**: Implementing intelligent matching algorithms for EV charging infrastructure optimization using geospatial indexing and machine learning.

---

## 📞 Support & Contact

- 📧 **Email**: [Your Email]
- 🐛 **Report Bugs**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 📚 **Documentation**: See service-specific READMEs in each folder

---

## 🎉 Acknowledgments

- **Firebase** for authentication infrastructure
- **MongoDB Atlas** for cloud database services
- **Google Maps API** for geospatial capabilities
- **Vercel** for frontend deployment platform
- **Azure** for container orchestration
- Our academic advisors and reviewers

---

<div align="center">

### Built with ⚡ for a sustainable future

Made with 💚 by the VoltHive Team

[⬆ Back to Top](#-volthive---smart-ev-charging-platform)

</div>
