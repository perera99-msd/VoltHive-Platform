# VoltHive Frontend

Next.js frontend for the VoltHive EV charging aggregator.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Firebase Auth (client)
- Google Maps via `@vis.gl/react-google-maps`

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

3. Start the dev server:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Structure

```text
src/
	app/
		(driver)/driver-dashboard/
		(owner)/owner-dashboard/
		login/
		layout.tsx
		page.tsx
	components/
		ProtectedRoute.tsx
		StationMap.tsx
	context/
		AuthContext.tsx
	lib/
		firebase.ts
```

## Notes

- Routes call backend API at `http://localhost:5000`.
- Ensure backend is running before testing dashboard flows.
