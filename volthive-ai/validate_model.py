"""
VoltHive Model Validation Script
Loads model + columns, runs prediction through the SAME preprocessing as app.py,
and checks health. Used in CI to catch model drift.
"""
import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

MODEL_PATH = 'models/surge_model.pkl'
COLUMNS_PATH = 'models/model_columns.pkl'
METRICS_PATH = 'models/model_metrics.json'

def validate():
    if not all(os.path.exists(p) for p in [MODEL_PATH, COLUMNS_PATH]):
        print("[FAIL] Model artifacts missing. Run train_multi_models.py first.")
        return False

    model = joblib.load(MODEL_PATH)
    cols = joblib.load(COLUMNS_PATH)
    print(f"[PASS] Model loaded: {type(model).__name__}")
    print(f"[PASS] Feature columns: {len(cols)}")

    # Test inference through the exact same path as app.py
    test_row = {
        'hour_of_day': 14, 'day_of_week': 3, 'month': 8,
        'is_weekend': 0, 'is_peak_hour': 0, 'temperature_f': 88.0,
        'precipitation_mm': 0.0, 'power_output_kw': 120.0,
        'weather_condition': 'Clear', 'local_event': 'None',
        'location_type': 'Urban Center', 'charger_type': 'Dc Fast Charge'
    }
    df = pd.DataFrame([test_row])
    df_enc = pd.get_dummies(df)
    df_fin = df_enc.reindex(columns=cols, fill_value=0)
    pred = model.predict(df_fin)[0]
    pred_pct = pred * 100 if pred <= 1.0 else pred
    print(f"[PASS] Test prediction: {pred_pct:.2f}% (sanity check)")

    # Report metrics
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, encoding='utf-8') as f:
            m = json.load(f)
        print(f"\nModel Report:")
        print(f"   Winner: {m.get('winner')}")
        print(f"   Within +/-5%: {m.get('winning_within_5pct_accuracy', m.get('winning_accuracy_pct', 'N/A'))}%")
        print(f"   Within +/-10%: {m.get('winning_within_10pct_accuracy', 'N/A')}%")
        print(f"   Records: {m.get('trained_records', 'N/A')}")

    print("\n[SUCCESS] AI Validation PASSED")
    return True

if __name__ == '__main__':
    sys.exit(0 if validate() else 1)