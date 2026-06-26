import sys
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import pandas as pd
import numpy as np
import os
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

print("[INFO] Starting VoltHive Advanced Multi-Model AI Training Pipeline...")

DATASET_PATH = os.path.join("Data Set", "ev_charging_station_data.csv")
if not os.path.exists(DATASET_PATH):
    DATASET_PATH = "ev_charging_station_data.csv"

if not os.path.exists(DATASET_PATH):
    print(f"[ERROR] Dataset not found at {DATASET_PATH}")
    exit(1)

print(f"1. Loading dataset from '{DATASET_PATH}'...")
df_raw = pd.read_csv(DATASET_PATH)

# To ensure rapid, responsive training while preserving full statistical variance, sample 60,000 rows
SAMPLE_SIZE = min(60000, len(df_raw))
print(f"   Sampling {SAMPLE_SIZE:,} random charging records for multi-model benchmarking...")
df = df_raw.sample(n=SAMPLE_SIZE, random_state=42).copy()

# Preprocessing features
features = ['hour_of_day', 'day_of_week', 'is_weekend', 'is_peak_hour', 
            'weather_condition', 'local_event']
target = 'utilization_rate'

df = df.dropna(subset=features + [target])

# Clean text categories
df['weather_condition'] = df['weather_condition'].astype(str).str.strip().str.title()
df['local_event'] = df['local_event'].astype(str).str.strip().str.title()
df['is_weekend'] = df['is_weekend'].astype(bool).astype(int)
df['is_peak_hour'] = df['is_peak_hour'].astype(bool).astype(int)

X = df[features]
y = df[target]

# One-hot encoding
X_encoded = pd.get_dummies(X, columns=['weather_condition', 'local_event'])
model_columns = list(X_encoded.columns)

os.makedirs('models', exist_ok=True)
joblib.dump(model_columns, 'models/model_columns.pkl')

X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

print("\n2. Training & Benchmarking Candidate AI Models...")

candidate_models = {
    "Random Forest Regressor": RandomForestRegressor(n_estimators=60, max_depth=14, n_jobs=-1, random_state=42),
    "HistGradientBoosting (XGBoost Fast)": HistGradientBoostingRegressor(max_iter=120, max_depth=10, random_state=42),
    "Ridge Linear Baseline": Ridge(alpha=1.0)
}

metrics_results = []
trained_models = {}

best_mae = float('inf')
winning_model_name = ""
winning_model_obj = None

for name, clf in candidate_models.items():
    print(f"   [...] Training {name}...")
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    
    preds = np.clip(preds, 0.0, 1.0)
    
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    accuracy_pct = max(0.0, min(100.0, (1.0 - mae) * 100.0))
    
    print(f"      [OK] MAE: {mae:.4f} | RMSE: {rmse:.4f} | R2 Score: {r2:.4f} | Est. Accuracy: {accuracy_pct:.1f}%")
    
    metrics_results.append({
        "model": name,
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2_score": round(r2, 4),
        "accuracy_pct": round(accuracy_pct, 1)
    })
    
    trained_models[name] = clf
    if mae < best_mae:
        best_mae = mae
        winning_model_name = name
        winning_model_obj = clf

print("\n==========================================================")
print("MODEL BENCHMARK COMPARISON MATRIX")
print("==========================================================")
print(f"{'Algorithm Name':<36} | {'MAE':<8} | {'RMSE':<8} | {'R2':<8} | {'Accuracy':<8}")
print("-" * 76)
for res in metrics_results:
    star = " * (WINNER)" if res['model'] == winning_model_name else ""
    print(f"{res['model']:<36} | {res['mae']:<8.4f} | {res['rmse']:<8.4f} | {res['r2_score']:<8.4f} | {res['accuracy_pct']:<6.1f}%{star}")
print("==========================================================")

print(f"\nSelected Best Performing Architecture: '{winning_model_name}' (MAE: {best_mae:.4f})")

joblib.dump(winning_model_obj, 'models/surge_model.pkl')
joblib.dump(winning_model_obj, 'models/best_surge_model.pkl')

summary_payload = {
    "winner": winning_model_name,
    "winning_accuracy_pct": round((1.0 - best_mae) * 100.0, 1),
    "trained_records": SAMPLE_SIZE,
    "comparison_table": metrics_results
}

with open('models/model_metrics.json', 'w') as f:
    json.dump(summary_payload, f, indent=2)

print("[SUCCESS] Pipeline Successfully Completed! Model & Comparison Data stored in 'models/'")
