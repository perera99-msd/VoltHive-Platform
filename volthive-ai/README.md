# VoltHive AI Service 🤖

Flask-based demand prediction service used for surge pricing assistance.

## Stack

- Python 3.10+
- Flask + Flask-CORS
- pandas, scikit-learn, joblib

## Setup

```bash
cp .env.example .env
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run API

```bash
python app.py
```

Default URL: `http://localhost:5001`

## Training

```bash
python train_surge.py
```

## Health Check

```bash
curl http://localhost:5001/api/ai/health
```

## Security Notes

- Keep model artifacts and datasets out of git unless intentionally versioned.
- Keep CORS origins restricted using `AI_CORS_ALLOWED_ORIGINS`.
- Never run with `AI_DEBUG=true` in production.
