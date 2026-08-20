# VoltHive Deployment, DevOps & Production Runbook

> [!NOTE]
> This guide outlines the environment configuration, local development setup, multi-container Docker deployment, and cloud production operations for the VoltHive platform.

---

## 1. Environment Variables Configuration

### A. Frontend (`volthive-frontend/.env.local`)
```env
# Next.js Public Backend API Endpoint
NEXT_PUBLIC_API_URL=https://api.volthive.app

# Firebase Client SDK Credentials (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA1B2C3D4E5F6G7H8I9J0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=volthive-platform.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=volthive-platform
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=volthive-platform.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# PWA Application Metadata
NEXT_PUBLIC_APP_NAME="VoltHive EV Network"
```

### B. Backend (`volthive-backend/.env`)
```env
# Server Port & Environment
PORT=5000
NODE_ENV=production

# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/volthive_production?retryWrites=true&w=majority

# Firebase Admin Service Account Credentials
FIREBASE_PROJECT_ID=volthive-platform
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@volthive-platform.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"

# Python AI Engine URL (if running as microservice)
AI_SERVICE_URL=http://localhost:8000

# Client CORS Allowed Origins
CORS_ORIGIN=https://volthive.app,https://admin.volthive.app
```

### C. AI Engine (`volthive-ai/.env`)
```env
PORT=8000
ENVIRONMENT=production
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1/forecast
MODEL_FILE_PATH=models/surge_model.pkl
```

---

## 2. Local Development Setup (Step-by-Step)

```mermaid
flowchart LR
    A[Clone Repository] --> B[Setup Backend npm & env]
    B --> C[Setup Frontend npm & env]
    C --> D[Setup Python ML venv]
    D --> E[Launch Multi-Terminal Dev Servers]
```

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **Python**: `3.10.x` or higher
- **MongoDB**: Local Community Server or free MongoDB Atlas cluster

### 2. Backend Setup
```bash
cd volthive-backend
npm install
cp .env.example .env   # Configure your MONGODB_URI and Firebase keys
npm run dev            # Starts server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd volthive-frontend
npm install
cp .env.example .env.local
npm run dev            # Starts Next.js on http://localhost:3000
```

### 4. AI Engine Setup (Optional / Standalone)
```bash
cd volthive-ai
python -m venv .venv
# Activate venv:
# Windows: .venv\Scripts\activate | Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python app.py          # Starts microservice on http://localhost:8000
```

---

## 3. Production Deployment with Docker Compose

### Complete `docker-compose.yml`
```yaml
version: '3.8'

services:
  volthive-backend:
    build:
      context: ./volthive-backend
      dockerfile: Dockerfile
    restart: always
    environment:
      - PORT=5000
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
    ports:
      - "5000:5000"
    networks:
      - volthive-network

  volthive-frontend:
    build:
      context: ./volthive-frontend
      dockerfile: Dockerfile
    restart: always
    environment:
      - NEXT_PUBLIC_API_URL=https://api.volthive.app
    ports:
      - "3000:3000"
    depends_on:
      - volthive-backend
    networks:
      - volthive-network

networks:
  volthive-network:
    driver: bridge
```

### Build & Start Containers
```bash
docker-compose up --build -d
```

---

## 4. Nginx Reverse Proxy & SSL Configuration

```nginx
# /etc/nginx/sites-available/volthive.conf

# 1. Frontend Web App & PWA
server {
    server_name volthive.app www.volthive.app;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/volthive.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/volthive.app/privkey.pem;
}

# 2. Backend REST API & Server-Sent Events (SSE)
server {
    server_name api.volthive.app;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Critical for SSE (Server-Sent Events) live streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/api.volthive.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.volthive.app/privkey.pem;
}
```

---

## 5. Production Health Checks & Monitoring

1. **API Health Endpoint**: `GET /api/health` returns `200 OK` with database ping and memory consumption.
2. **PM2 Process Monitoring**:
   ```bash
   pm2 status
   pm2 logs volthive-backend --lines 100
   pm2 monit
   ```
3. **MongoDB Atlas Alerts**:
   - Connection spike triggers (> 500 connections)
   - CPU utilization > 80%
   - Query execution time > 100ms
