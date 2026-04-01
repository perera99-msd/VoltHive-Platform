# VoltHive Backend

Express backend for VoltHive.

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Firebase Admin SDK for token verification

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create `.env` with:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

3. Add Firebase service account file at project root:

```text
volthive-backend/firebase-service-account.json
```

4. Start the server:

```bash
npm run dev
```

## Structure

```text
src/
  config/
    db.js
  middleware/
    authMiddleware.js
  models/
    Station.js
    User.js
  routes/
    stationRoutes.js
    userRoutes.js
  server.js
```

## API Routes

- `GET /` Health route
- `POST /api/users` Create app user (auth required)
- `GET /api/users/profile` Fetch logged-in profile (auth required)
- `POST /api/stations` Register station (owner role)
- `GET /api/stations` List stations
