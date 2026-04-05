# VoltHive ⚡

Smart EV charging platform with a modern web app, secure backend APIs, and an AI demand-pricing service.

## 📦 Monorepo Structure

```text
Volthive/
  Images/
  volthive-ai/
    app.py
    train_surge.py
    inspect_data.py
    requirements.txt
  volthive-backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
  volthive-frontend/
    public/
    src/
      app/
      components/
      context/
      lib/
```

## 🧩 Services 

- `volthive-frontend`: Next.js 16 + TypeScript app for drivers and station owners.
- `volthive-backend`: Express 5 + MongoDB API with Firebase token verification.
- `volthive-ai`: Flask service for surge demand prediction and price multiplier suggestions.

## 🚀 Quick Start

### 1) Backend

```bash
cd volthive-backend
cp .env.example .env
npm install
npm run dev
```

Runs at `http://localhost:5000`.

### 2) Frontend

```bash
cd volthive-frontend
cp .env.example .env.local
npm install
npm run dev
```

Runs at `http://localhost:3000`.

### 3) AI Service (Optional)

```bash
cd volthive-ai
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Runs at `http://localhost:5001`.

## 🔐 Security Baseline

- No secrets in tracked files.
- Environment templates provided via `.env.example` files.
- Backend includes `helmet`, CORS allowlist, compression, request logging, and rate limiting.
- Firebase Admin credentials loaded only from environment configuration.

## 🛠️ Developer Notes

- Keep generated folders (`node_modules`, `.next`, `venv`) untracked.
- Use feature branches for changes and keep commits scoped by service.
- For production, rotate keys regularly and enforce least-privilege cloud roles.

## 📄 License

This project is licensed under the MIT License. See `LICENSE`.
