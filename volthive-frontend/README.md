# VoltHive Frontend 🌐

Next.js 16 application for EV drivers and station owners.

## Stack

- Next.js (App Router) + React + TypeScript
- Firebase Authentication (client)
- Google Maps via `@react-google-maps/api`
- Framer Motion for UI transitions

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

App URL: `http://localhost:3000`

## Environment

Use `.env.example` as the source of truth for required variables.

Important:

- `NEXT_PUBLIC_BACKEND_URL`
- Firebase web config values
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Architecture Notes

- `src/app`: route-level UI and page composition
- `src/components`: reusable widgets and dashboard modules
- `src/context`: auth state and session context
- `src/lib`: API and Firebase client helpers

## Runtime Notes

- The UI expects backend responses in `{ success, data }` shape for most APIs.
- Owner actions require Firebase auth token headers.
- Ensure backend CORS allowlist contains your frontend origin.
