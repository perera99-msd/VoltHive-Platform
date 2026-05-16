# VoltHive Backend ⚙️

Production-oriented Express API for VoltHive.

## Stack

- Node.js + Express 5
- MongoDB + Mongoose
- Firebase Admin SDK
- Security middleware: Helmet, CORS allowlist, rate limiting

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Server URL: `http://localhost:5000`

## Environment Variables

See `.env.example` for full list.

Required in most environments:

- `MONGO_URI`
- `CORS_ALLOWED_ORIGINS`
- One of:
  - `FIREBASE_SERVICE_ACCOUNT_BASE64`
  - `FIREBASE_SERVICE_ACCOUNT_PATH`

## Key API Endpoints

- `GET /` health
- `GET /api/stations` public station list
- `GET /api/stations/:id` station detail
- `POST /api/stations/smart-match` smart matching
- `POST /api/stations` owner-only create station
- `DELETE /api/stations/:id` owner-only delete station
- `PUT /api/stations/:id/rates` owner-only tariff update
- `POST /api/bookings` driver-only create booking
- `GET /api/bookings/driver` driver booking list
- `GET /api/bookings/owner` owner booking list

## Security Notes

- Do not commit `.env` or credential JSON files.
- Restrict `CORS_ALLOWED_ORIGINS` per environment.
- Use least-privilege Firebase service account roles.
- Rotate keys and database credentials periodically.
