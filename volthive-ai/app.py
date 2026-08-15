from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os
import json
from datetime import datetime
from weather_service import get_live_weather

app = Flask(__name__)

allowed_origins = os.getenv('AI_CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5000')
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Open CORS for microservice communication

MODEL_PATH = 'models/surge_model.pkl'
COLUMNS_PATH = 'models/model_columns.pkl'
METRICS_PATH = 'models/model_metrics.json'

model = None
model_columns = None
model_metrics = None

def load_ai_assets():
    global model, model_columns, model_metrics
    if os.path.exists(MODEL_PATH) and os.path.exists(COLUMNS_PATH):
        model = joblib.load(MODEL_PATH)
        model_columns = joblib.load(COLUMNS_PATH)
        print("[OK] VoltHive Advanced Multi-Model AI loaded successfully.")
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, 'r') as f:
            model_metrics = json.load(f)

load_ai_assets()

# Dynamic Cockpit State (In-Memory Synchronization)
admin_cockpit_state = {
    "autoFeedEnabled": True,
    "activeCricketMatch": {
        "eventName": "Sri Lanka vs India Asia Cup Final",
        "venue": "R. Premadasa International Cricket Stadium",
        "isActive": False,
        "expectedSurge": "Extreme Surge (+25% AI Surge)",
        "date": "Today, 07:00 PM"
    },
    "manualOverrides": {
        "weather": "Clear",
        "trafficIndex": 4,
        "isPeakOverride": False
    }
}

# ============================================================
# CATEGORY MAPPING (MUST MATCH TRAINING DATA EXACTLY)
# ============================================================
# The training pipeline (train_multi_models.py) cleans categories with:
#   .str.strip().str.title()
# This produces the following EXACT category names in model_columns.pkl:
#   weather_condition: Clear, Cloudy, Extreme_Heat, Freezing, Heavy_Rain, Light_Rain, Partly_Cloudy
#   local_event:       Concert, Conference, Festival, None, Sports_Game
#   location_type:     Airport, Highway Corridor, Hotel/Hospitality, Residential, Shopping Center, Suburban, Urban Center, Workplace
#   charger_type:      Dc Fast Charge, Hyper-Fast, Level 2, Tesla Dc Fast
# ============================================================

def map_event_category(event_name):
    """Map any event string to the EXACT training category name."""
    if not event_name:
        return "None"
    name = str(event_name).lower().strip()
    if name in ["none", "", "nan"]:
        return "None"
    if any(k in name for k in ["cricket", "match", "game", "sports", "football", "stadium", "cup", "test"]):
        return "Sports_Game"
    if any(k in name for k in ["concert", "music", "band", "show", "dj"]):
        return "Concert"
    if any(k in name for k in ["conference", "expo", "summit", "forum", "tech"]):
        return "Conference"
    if any(k in name for k in ["festival", "carnival", "parade", "fair"]):
        return "Festival"
    return "Sports_Game"

def map_weather_category(cond):
    """Map any weather string to the EXACT training category name."""
    if not cond:
        return "Clear"
    c = str(cond).lower().strip()
    if "rain" in c or "drizzle" in c:
        return "Light_Rain"
    if "storm" in c or "thunder" in c:
        return "Heavy_Rain"
    if "cloud" in c or "overcast" in c:
        return "Cloudy"
    if "fog" in c:
        return "Partly_Cloudy"
    if "heat" in c or "hot" in c:
        return "Extreme_Heat"
    if "freez" in c or "snow" in c or "ice" in c:
        return "Freezing"
    return "Clear"

def map_location_type(loc):
    """Map any location string to the EXACT training category name."""
    if not loc:
        return "Urban Center"
    l = str(loc).lower().strip()
    if "airport" in l:
        return "Airport"
    if "highway" in l or "corridor" in l:
        return "Highway Corridor"
    if "hotel" in l or "hospitality" in l:
        return "Hotel/Hospitality"
    if "residential" in l or "home" in l or "housing" in l:
        return "Residential"
    if "shopping" in l or "mall" in l or "retail" in l:
        return "Shopping Center"
    if "suburban" in l or "suburb" in l:
        return "Suburban"
    if "workplace" in l or "office" in l or "corporate" in l:
        return "Workplace"
    return "Urban Center"

def map_charger_type(ct):
    """Map any charger string to the EXACT training category name."""
    if not ct:
        return "Dc Fast Charge"
    c = str(ct).lower().strip()
    if "hyper" in c or "ultra" in c:
        return "Hyper-Fast"
    # Check Tesla/NACS BEFORE AC check (NACS contains "ac")
    if "tesla" in c or "nacs" in c:
        return "Tesla Dc Fast"
    if "level 2" in c or " ac" in c or c == "ac" or "type 2" in c:
        return "Level 2"
    # Type 1 (SAE J1772) is single-phase AC; IEC Mode 1/2/3 are AC charging modes.
    if "type 1" in c or "j1772" in c or "mode 1" in c or "mode 2" in c or "mode 3" in c:
        return "Level 2"
    return "Dc Fast Charge"


# ============================================================
# CONTINUOUS AI PRICING CURVE (occupancy -> price multiplier)
# Replaces the old step thresholds (1.15 / 1.25 / 0.90) with a smooth
# piecewise-linear curve so every predicted occupancy maps to a unique price.
# Base price stays constant; predicted demand is the variable.
#
#   occ <= 30%  : floor (discount)
#   30 - 60%    : floor -> 1.00 (linear)
#   60 - 90%    : 1.00 -> cap (linear)
#   occ > 90%   : cap (surge ceiling, prevents price gouging)
# ============================================================
PRICING_PROFILES = {
    'conservative': {'floor': 0.92, 'cap': 1.15},
    'balanced': {'floor': 0.90, 'cap': 1.30},
    'aggressive': {'floor': 0.85, 'cap': 1.45},
}


def occupancy_to_multiplier(occ, profile='balanced'):
    """Continuous piecewise-linear occupancy -> price multiplier (2 dp)."""
    try:
        o = max(0.0, min(100.0, float(occ or 0)))
    except (TypeError, ValueError):
        o = 0.0
    p = PRICING_PROFILES.get(str(profile or 'balanced').lower(), PRICING_PROFILES['balanced'])
    floor, cap = p['floor'], p['cap']
    if o <= 30:
        m = floor
    elif o <= 60:
        m = floor + (1.0 - floor) * ((o - 30.0) / 30.0)
    elif o <= 90:
        m = 1.0 + (cap - 1.0) * ((o - 60.0) / 30.0)
    else:
        m = cap
    return round(m, 2)


def round_rate_lkr(rate):
    """Round a LKR rate to the nearest 0.50 for clean, fair-looking pricing."""
    try:
        return round(float(rate or 0) * 2.0) / 2.0
    except (TypeError, ValueError):
        return 0.0

@app.route('/api/ai/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "success", 
        "model_loaded": model is not None,
        "winning_model": model_metrics.get("winner", "Random Forest") if model_metrics else "Random Forest"
    }), 200

@app.route('/api/ai/metrics', methods=['GET'])
def get_model_metrics():
    load_ai_assets()
    if not model_metrics:
        return jsonify({"error": "Metrics not found"}), 404
    return jsonify(model_metrics), 200

@app.route('/api/ai/cockpit', methods=['GET', 'POST'])
def handle_cockpit():
    global admin_cockpit_state
    if request.method == 'POST':
        payload = request.json or {}
        if 'autoFeedEnabled' in payload:
            admin_cockpit_state['autoFeedEnabled'] = bool(payload['autoFeedEnabled'])
        if 'activeCricketMatch' in payload:
            admin_cockpit_state['activeCricketMatch'].update(payload['activeCricketMatch'])
        if 'manualOverrides' in payload:
            admin_cockpit_state['manualOverrides'].update(payload['manualOverrides'])
        return jsonify({"status": "success", "state": admin_cockpit_state}), 200
    return jsonify(admin_cockpit_state), 200

@app.route('/api/ai/suggest-price', methods=['POST'])
def suggest_price():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
        
    try:
        data = request.json or {}
        lat = float(data.get('latitude', 6.9271))
        lon = float(data.get('longitude', 79.8612))
        data.pop('traffic_congestion_index', None)
        
        req_event = str(data.get('local_event', 'None')).strip()
        has_req_event = req_event.lower() not in ['none', '']

        # 1. Resolve Weather & Event Feed (Auto vs Manual)
        if admin_cockpit_state['autoFeedEnabled']:
            live_weather = get_live_weather(lat, lon)
            weather_cond = live_weather['condition']
            event_cond = req_event if has_req_event else ("Sports Event / Cricket Match" if admin_cockpit_state['activeCricketMatch']['isActive'] else "None")
            # Live weather ALWAYS wins over any client-supplied value (no fake 'Clear')
            data['weather_condition'] = map_weather_category(weather_cond)
            # Real numeric features the model was trained on (were previously 0 -> skewed predictions)
            data['temperature_f'] = float((live_weather['temperature_c'] * 9.0 / 5.0) + 32)
            data['precipitation_mm'] = float(live_weather.get('precipitation_mm', 0.0))
        else:
            weather_cond = admin_cockpit_state['manualOverrides']['weather']
            event_cond = req_event if has_req_event else ("Sports Event / Cricket Match" if admin_cockpit_state['activeCricketMatch']['isActive'] else "None")
            data['weather_condition'] = map_weather_category(weather_cond)
            data['temperature_f'] = float((31.0 * 9.0 / 5.0) + 32)  # manual override default temp
            data['precipitation_mm'] = 0.0

        data['local_event'] = map_event_category(event_cond)

        # Ensure the model's time-of-year feature is always real (was previously 0)
        if 'month' not in data or data.get('month') in (None, ''):
            data['month'] = datetime.now().month
        
        # Also map location_type and charger_type if provided
        if 'location_type' in data:
            data['location_type'] = map_location_type(data['location_type'])
        if 'charger_type' in data:
            data['charger_type'] = map_charger_type(data['charger_type'])

        df = pd.DataFrame([data])
        df_encoded = pd.get_dummies(df)
        df_final = df_encoded.reindex(columns=model_columns, fill_value=0)
        
        raw_prediction = model.predict(df_final)[0]
        prediction = raw_prediction * 100 if raw_prediction <= 1.0 else raw_prediction
        
        # Inject Cricket Match Surge Bonus only if active
        if has_req_event or admin_cockpit_state['activeCricketMatch']['isActive']:
            prediction += 15.0
            
        prediction = min(98.5, max(10.0, prediction))

        # Continuous pricing curve (base price stays constant; demand is the variable)
        pricing_profile = str(data.get('pricing_profile', 'balanced'))
        multiplier = occupancy_to_multiplier(prediction, pricing_profile)
        msg = "Normal Demand"
        if prediction >= 82.0:
            msg = f"High Surge Demand ({event_cond})" if (has_req_event or admin_cockpit_state['activeCricketMatch']['isActive']) else "High Surge Demand"
        elif prediction >= 58.0:
            msg = "Moderate Demand"
        elif prediction <= 30.0:
            msg = "Low Demand (Discount Suggested)"

        return jsonify({
            "predicted_occupancy": f"{round(prediction, 2)}%",
            "suggested_multiplier": multiplier,
            "ai_recommendation": msg,
            "pricing_profile": pricing_profile,
            "cockpit_mode": "Auto API Feed" if admin_cockpit_state['autoFeedEnabled'] else "Manual Override"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/ai/forecast', methods=['POST'])
def forecast_surge():
    from datetime import datetime, timedelta
    now = datetime.now()
    data = request.json or {}
    lat = float(data.get('latitude', 6.9271))
    lon = float(data.get('longitude', 79.8612))
    
    req_event = str(data.get('local_event', 'None')).strip()
    has_req_event = req_event.lower() not in ['none', '']

    # Strictly use station-specific event (No hardcoded global fallback)
    match_active = has_req_event
    match_name = req_event if has_req_event else ""

    power_kw = float(data.get('power_output_kw', 120.0))
    
    # FIX: Read actual station specs from request instead of hardcoding
    location_type = map_location_type(data.get('location_type', 'Urban Center'))
    charger_type = map_charger_type(data.get('charger_type', 'Dc Fast Charge'))

    # Resolve Weather per station coordinates
    if admin_cockpit_state['autoFeedEnabled']:
        live_w = get_live_weather(lat, lon)
        weather = live_w['condition']
        temp_c = live_w['temperature_c']
        precipitation = live_w.get('precipitation_mm', 0.0)
        source_lbl = f"Live Open-Meteo API ({live_w['source']})"
    else:
        weather = admin_cockpit_state['manualOverrides']['weather']
        temp_c = 31.0
        precipitation = 0.0
        source_lbl = "Admin Manual Cockpit Override"

    # Continuous-pricing profile (conservative / balanced / aggressive)
    pricing_profile = str(data.get('pricing_profile', 'balanced'))

    if model is None or model_columns is None:
        return jsonify({"error": "Model not loaded"}), 500

    event_cat = map_event_category(match_name if match_active else "None")
    weather_cat = map_weather_category(weather)

    hourly_forecast = []
    for i in range(6):
        target_time = now + timedelta(hours=i)
        h = target_time.hour
        is_peak = (17 <= h <= 21) or (7 <= h <= 9)
        is_wk = target_time.weekday() in [5, 6]
        
        try:
            row = {
                "hour_of_day": h,
                "day_of_week": target_time.weekday(),
                "month": target_time.month,
                "is_weekend": 1 if is_wk else 0,
                "is_peak_hour": 1 if is_peak else 0,
                "temperature_f": float((temp_c * 9/5) + 32),
                "precipitation_mm": precipitation,
                "power_output_kw": power_kw,
                "weather_condition": weather_cat,
                "local_event": event_cat,
                "location_type": location_type,
                "charger_type": charger_type
            }
            df_row = pd.DataFrame([row])
            df_enc = pd.get_dummies(df_row)
            df_fin = df_enc.reindex(columns=model_columns, fill_value=0)
            raw_p = model.predict(df_fin)[0]
            pred_occ = raw_p * 100 if raw_p <= 1.0 else raw_p
        except Exception as e:
            return jsonify({"error": f"Prediction failed: {str(e)}"}), 500
                
        if match_active:
            pred_occ += 18.0 # Active event surge boost
            
        pred_occ = min(98.0, max(12.0, pred_occ))
        mult = occupancy_to_multiplier(pred_occ, pricing_profile)
        rec = "Normal Demand"
        if pred_occ >= 80.0:
            rec = f"🔥 Special Event Surge ({match_name})" if match_active else "High Grid Peak"
        elif pred_occ >= 58.0:
            rec = "Moderate Demand"
        elif pred_occ <= 30.0:
            rec = "Discount Suggested"
            
        hourly_forecast.append({
            "time": target_time.strftime("%H:00"),
            "hour": h,
            "occupancy": round(pred_occ, 1),
            "multiplier": mult,
            "recommendation": rec
        })
        
    days_forecast = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for j in range(1, 8):
        target_day = now + timedelta(days=j)
        dw = target_day.weekday()
        dname = day_names[dw]
        is_wk = dw in [5, 6]
        
        # FIX: Average predictions across peak hours (7-9am, 5-9pm) instead of fixed 6pm
        peak_hours = [7, 8, 9, 17, 18, 19, 20, 21]
        daily_preds = []
        try:
            for ph in peak_hours:
                row_daily = {
                    "hour_of_day": ph,
                    "day_of_week": dw,
                    "month": target_day.month,
                    "is_weekend": 1 if is_wk else 0,
                    "is_peak_hour": 1,
                    "temperature_f": float((temp_c * 9/5) + 32),
                    "precipitation_mm": precipitation,
                    "power_output_kw": power_kw,
                    "weather_condition": weather_cat,
                    "local_event": event_cat if (j==1 and match_active) else "None",
                    "location_type": location_type,
                    "charger_type": charger_type
                }
                df_row_daily = pd.DataFrame([row_daily])
                df_enc_daily = pd.get_dummies(df_row_daily)
                df_fin_daily = df_enc_daily.reindex(columns=model_columns, fill_value=0)
                raw_p_daily = model.predict(df_fin_daily)[0]
                pred_occ_daily = raw_p_daily * 100 if raw_p_daily <= 1.0 else raw_p_daily
                daily_preds.append(pred_occ_daily)
        except Exception as e:
            return jsonify({"error": f"Daily Prediction failed: {str(e)}"}), 500

        pred_occ_daily = sum(daily_preds) / len(daily_preds) if daily_preds else 50.0

        if (j==1 and match_active):
            pred_occ_daily += 15.0
            
        pred_occ_daily = min(95.0, max(15.0, pred_occ_daily))
        
        mult = occupancy_to_multiplier(pred_occ_daily, pricing_profile)
            
        days_forecast.append({
            "day": dname,
            "date": target_day.strftime("%m/%d"),
            "occupancy": round(pred_occ_daily, 1),
            "avgMultiplier": mult,
            "status": f"🏟️ Event Day: {match_name}" if (j==1 and match_active) else ("High Peak Hub" if is_wk else "Steady Demand")
        })
        
    return jsonify({
        "status": "success",
        "weather": {"condition": weather, "temp": temp_c, "source": source_lbl},
        "cockpit": admin_cockpit_state,
        "hourly": hourly_forecast,
        "daily": days_forecast,
        "lastUpdated": now.strftime("%I:%M:%S %p")
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('AI_PORT', '5001'))
    debug_mode = os.getenv('AI_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)