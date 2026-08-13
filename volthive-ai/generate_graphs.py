import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Ensure output directory exists
output_dir = "graphs"
os.makedirs(output_dir, exist_ok=True)

# Set professional design styling
plt.style.use('ggplot')
plt.rcParams['font.sans-serif'] = 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'
plt.rcParams['axes.edgecolor'] = '#cccccc'
plt.rcParams['axes.linewidth'] = 0.8


def map_weather_category(cond):
    """Map any weather string to the EXACT training category name (mirrors app.py)."""
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


# 1. MODEL COMPARISON BAR CHART  (REAL metrics loaded from model_metrics.json — no hardcoded values)
print("Generating Model Comparison Chart...")
with open('models/model_metrics.json') as f:
    metrics = json.load(f)

# Keep chart order: winner first, then others, matching model_metrics.json
lookup = {
    'HistGradientBoosting': ('HistGradientBoosting\n(Winner)', True),
    'Random Forest Regressor': ('Random Forest', False),
    'Ridge Linear Baseline': ('Ridge Linear\nBaseline', False),
}
models, mae_scores, r2_scores, acc_texts = [], [], [], []
for mrow in metrics['comparison_table']:
    if mrow['model'] not in lookup:
        continue
    label, is_winner = lookup[mrow['model']]
    models.append(label)
    mae_scores.append(mrow['mae'])
    r2_scores.append(mrow['r2_score'])
    if is_winner:
        acc_texts.append(
            f"MAE {mrow['mae']:.4f}\nR² {mrow['r2_score']:.4f}\n±5%: {mrow.get('within_5pct_accuracy', 0):.1f}%")
    else:
        acc_texts.append(f"MAE {mrow['mae']:.4f}\nR² {mrow['r2_score']:.4f}")

fig, ax1 = plt.subplots(figsize=(9, 5.5), dpi=300)

colors = ['#10b981', '#3b82f6', '#94a3b8']
bars = ax1.bar(models, mae_scores, color=colors, width=0.5, edgecolor='black', linewidth=0.7)

ax1.set_ylabel('Mean Absolute Error (utilization 0–1, lower is better)', fontsize=12, fontweight='bold', color='#1e293b')
ax1.set_title('VoltHive Candidate AI Models — Real Held-Out Test Metrics', fontsize=14, fontweight='bold', pad=15)
ax1.set_ylim(0, max(mae_scores) * 1.55)

# Add data labels on top of bars
for bar, acc_text in zip(bars, acc_texts):
    yval = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2.0, yval + 0.01, acc_text,
             ha='center', va='bottom', fontsize=9.5, fontweight='bold', color='#0f172a')

plt.tight_layout()
plt.savefig(os.path.join(output_dir, "model_comparison_accuracy.png"))
plt.close()

# 2. 24-HOUR DEMAND CURVE — REAL MODEL OUTPUT + REAL LIVE WEATHER (no simulated telemetry)
print("Generating 24-Hour Demand Curve Chart (real model predictions)...")
from datetime import datetime
import joblib
from weather_service import get_live_weather

# Chart station: Colombo Urban Center, DC Fast 120 kW (defaults, same as production station-forecast)
CHART_LAT, CHART_LON = 6.9271, 79.8612
chart_loc = "Urban Center"
chart_charger = "Dc Fast Charge"
chart_power = 120.0

model_ = joblib.load('models/surge_model.pkl')
cols_ = joblib.load('models/model_columns.pkl')

live = get_live_weather(CHART_LAT, CHART_LON)
weather_cat = map_weather_category(live['condition'])
temp_c = live['temperature_c']
precip = live.get('precipitation_mm', 0.0)


def _predict_utilization(hour, dw, month, is_weekend, is_peak, event_cat):
    row = {
        "hour_of_day": hour, "day_of_week": dw, "month": month,
        "is_weekend": 1 if is_weekend else 0, "is_peak_hour": 1 if is_peak else 0,
        "temperature_f": float(temp_c * 9/5 + 32), "precipitation_mm": precip,
        "power_output_kw": chart_power, "weather_condition": weather_cat,
        "local_event": event_cat, "location_type": chart_loc, "charger_type": chart_charger,
    }
    df = pd.get_dummies(pd.DataFrame([row])).reindex(columns=cols_, fill_value=0)
    raw = float(model_.predict(df)[0])
    occ = raw * 100 if raw <= 1.0 else raw
    return min(98.0, max(12.0, occ))

hours = np.arange(0, 24)
now = datetime.now()
dw = now.weekday()
is_wk = dw in [5, 6]
ai_predicted = [
    _predict_utilization(h, dw, now.month, is_wk, (17 <= h <= 21) or (7 <= h <= 9), "None")
    for h in hours
]
# Production applies a +18 surge boost when a local event is active (same logic as /api/ai/forecast)
ai_predicted_event = [
    min(98.0, max(12.0, _predict_utilization(h, dw, now.month, is_wk, (17 <= h <= 21) or (7 <= h <= 9), "Sports_Game") + 18.0))
    for h in hours
]

fig, ax2 = plt.subplots(figsize=(10, 5.5), dpi=300)

ax2.plot(hours, ai_predicted, label='Real model forecast (no event)', color='#10b981', linewidth=2.5, marker='o', markersize=4)
ax2.plot(hours, ai_predicted_event, label='Real model forecast (active Sports event, +18 boost)', color='#f59e0b', linewidth=2.2, linestyle='--', marker='s', markersize=4)

ax2.set_xlabel('Hour of Day (24h Clock)', fontsize=12, fontweight='bold')
ax2.set_ylabel('Predicted Charger Utilization Rate (%)', fontsize=12, fontweight='bold')
ax2.set_title(f'24-Hour Charging Demand Forecast — Real Model Output\nLive weather at station: {live["condition"]}, {temp_c}°C ({live["source"]})',
              fontsize=13, fontweight='bold', pad=15)
ax2.set_xticks(hours)
ax2.set_ylim(0, 110)
ax2.legend(frameon=True, facecolor='white', framealpha=0.9, fontsize=10)
ax2.grid(True, linestyle='--', alpha=0.6)

plt.tight_layout()
plt.savefig(os.path.join(output_dir, "actual_vs_predicted_24h.png"))
plt.close()

# 3. MODEL FEATURE COMPOSITION (REAL — from model_columns.pkl)
# NOTE: the serialized HistGradientBoosting model exposes no feature_importances_, so instead of
# fabricating weights we chart the real composition of the 32 model features by category.
print("Generating Feature Composition Chart (real model columns)...")
cols_list = list(cols_)
groups = {
    'Time (hour/day/\nweekend/month)': [],
    'Weather numeric\n(temp, precip)': [],
    'Weather condition\n(one-hot)': [],
    'Local events\n(one-hot)': [],
    'Location type\n(one-hot)': [],
    'Charger type\n(one-hot)': [],
    'Station spec\n(power, plugs)': [],
}
for c in cols_list:
    if c.startswith('weather_condition_'):
        groups['Weather condition\n(one-hot)'].append(c)
    elif c.startswith('local_event_'):
        groups['Local events\n(one-hot)'].append(c)
    elif c.startswith('location_type_'):
        groups['Location type\n(one-hot)'].append(c)
    elif c.startswith('charger_type_'):
        groups['Charger type\n(one-hot)'].append(c)
    elif c in ('temperature_f', 'precipitation_mm'):
        groups['Weather numeric\n(temp, precip)'].append(c)
    elif c in ('power_output_kw', 'num_plugs'):
        groups['Station spec\n(power, plugs)'].append(c)
    else:
        groups['Time (hour/day/\nweekend/month)'].append(c)

labels = [k for k in groups if groups[k]]
counts = [len(groups[k]) for k in labels]

fig, ax3 = plt.subplots(figsize=(9, 5), dpi=300)

y_pos = np.arange(len(labels))
bar_colors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5']

ax3.barh(y_pos, counts, align='center', color=bar_colors[:len(labels)], edgecolor='#065f46', height=0.6)
ax3.set_yticks(y_pos)
ax3.set_yticklabels(labels, fontsize=9.5, fontweight='bold', color='#1e293b')
ax3.invert_yaxis()  # labels read top-to-bottom
ax3.set_xlabel('Number of Model Features', fontsize=12, fontweight='bold')
ax3.set_title(f'AI Demand Model — Feature Composition ({len(cols_list)} real features)', fontsize=14, fontweight='bold', pad=15)
ax3.set_xlim(0, max(counts) + 1.5)

for i, v in enumerate(counts):
    ax3.text(v + 0.2, i, str(v), fontsize=10, fontweight='bold', color='#064e3b')

plt.tight_layout()
plt.savefig(os.path.join(output_dir, "feature_importance.png"))
plt.close()

print("[SUCCESS] Graphs successfully generated and saved in 'graphs/' directory!")
