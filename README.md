# VoltHive

Monorepo-style workspace for the VoltHive EV charging aggregator.

## Project Layout

```text
Volthive/
  Images/
    Banner/
    Logo/
  volthive-backend/
    src/
      config/
      middleware/
      models/
      routes/
      server.js
  volthive-frontend/
    public/
    src/
      app/
      components/
      context/
      lib/
```

## Services

- `volthive-backend`: Express API + MongoDB + Firebase Admin token verification
- `volthive-frontend`: Next.js app for drivers and station owners

## Run Locally

### 1) Backend

```bash
cd volthive-backend
npm install
npm run dev
```

API runs at `http://localhost:5000`.

### 2) Frontend

```bash
cd volthive-frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Cleanup Notes

- Removed default Next.js starter assets and template files.
- Normalized backend Firebase credential filename to `firebase-service-account.json`.
- Kept environment and generated folders out of version control via `.gitignore`.
