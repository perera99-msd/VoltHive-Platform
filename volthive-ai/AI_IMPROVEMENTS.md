# VoltHive AI — Engineering Corrections & Improvements

This document records the engineering fixes applied to make the AI service statistically correct, fully aligned with training data, and deployment-ready.

---

## 1. Category Mapping Fix (Critical)

**Problem:** The inference layer used `.title()` on category strings, producing values like `"Light Rain"` (with space), while the training pipeline produces `"Light_Rain"` (with underscore). Mismatched one-hot columns meant the model received **zero signal** from weather and events.

**Fix:** Added four canonical mapping functions in `app.py` that map any input to the EXACT training category names from `models/model_columns.pkl`:
- `map_weather_category()` → Clear, Cloudy, Extreme_Heat, Freezing, Heavy_Rain, Light_Rain, Partly_Cloudy
- `map_event_category()` → Concert, Conference, Festival, None, Sports_Game
- `map_location_type()` → Airport, Highway Corridor, Hotel/Hospitality, Residential, Shopping Center, Suburban, Urban Center, Workplace
- `map_charger_type()` → Dc Fast Charge, Hyper-Fast, Level 2, Tesla Dc Fast

Verified Tesla/NACS is checked **before** the AC-substring check (NACS contains "ac").

---

## 2. Removed Fake JS Training Script

**Problem:** `train_multi_models.js` printed hardcoded/simulated metrics and overwrote `model_metrics.json` with fake data if run after the real Python pipeline.

**Fix:** Rewritten as a **validator** — it checks model artifacts exist, reads the real metrics from `model_metrics.json`, and reports them. It never fabricates data.

---

## 3. Corrected Accuracy Metric

**Problem:** `accuracy_pct = (1 - MAE) × 100` was statistically misleading (MAE 0.0565 ≠ 94.35% "accuracy").

**Fix:** Replaced with industry-standard **threshold-based accuracy** in `train_multi_models.py`:
- `within_5pct_accuracy`: % of predictions within ±5 percentage points of actual
- `within_10pct_accuracy`: % of predictions within ±10 percentage points of actual

Both are stored in `model_metrics.json`, alongside MAE, RMSE, and R².

---

## 4. Forecast Now Uses Real Station Context

**Problem:** `app.py` hardcoded `location_type="Urban Center"`, `charger_type="Dc Fast Charge"`, fake precipitation, and a fixed `hour_of_day=18` for daily forecasts.

**Fix:**
- Reads `location_type`, `charger_type`, and `power_output_kw` from the request
- `weather_service.py` now returns real `precipitation_mm` from Open-Meteo
- Daily forecast averages predictions across peak hours (7-9am, 5-9pm) instead of a single 6pm sample

---

## 5. Formalized Business Rule Layer

**New file:** `models/surge_rules.json` — a transparent, versioned config documenting:
- Multiplier thresholds (≥82% → 1.25x, ≥58% → 1.15x, ≤30% → 0.90x)
- Event surge bonuses (+15/+18/+15 percentage points)
- Hard clamps on prediction ranges

This clearly separates the **ML prediction layer** from the **human business policy layer**.

---

## 6. Backend Now Sends Real Station Context

**File:** `volthive-backend/src/services/aiService.js`

**Fix:** The payload to Flask now includes:
- `latitude` / `longitude` of the station → enables **per-station live weather**
- `location_type`, `charger_type`, `power_output_kw` → aligns with training features

`stationController.js` derives these from the first nearby station in the smart-match flow.

---

## 7. New Model Validation Script

**New file:** `validate_model.py`

- Loads `surge_model.pkl` + `model_columns.pkl`
- Runs a test inference through the **same preprocessing path** as `app.py`
- Reports model type, feature count, test prediction, and stored metrics
- Exits non-zero on failure → ready for CI integration

---

## 8. Deployment Readiness

- **New Dockerfile** for the AI service (Python 3.11-slim) with healthcheck
- **Fixed `.gitignore`** so `surge_model.pkl`, `model_columns.pkl`, `model_metrics.json`, `tuning_records.json`, and `surge_rules.json` are committed to version control — required for Docker builds and production deployment

---

## Verification

Run these commands to verify:

```bash
# Validate model artifacts + test inference
cd volthive-ai
python validate_model.py

# Verify category mapping
python -c "import app; print(app.map_weather_category('Light Rain'))"  # Light_Rain
python -c "import app; print(app.map_charger_type('Tesla NACS'))"     # Tesla Dc Fast

# Build the container
docker build -t volthive-ai:latest .