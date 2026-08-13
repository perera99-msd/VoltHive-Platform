import sys
import time

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
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def run_production_pipeline():
    start_total_time = time.time()
    
    print("==========================================================================")
    print("[INFO] Starting VoltHive 2-PHASE PRODUCTION Multi-Model AI Pipeline")
    print("==========================================================================\n")

    DATASET_PATH = os.path.join("Data Set", "ev_charging_station_data.csv")
    if not os.path.exists(DATASET_PATH):
        DATASET_PATH = "ev_charging_station_data.csv"

    if not os.path.exists(DATASET_PATH):
        print(f"[ERROR] Dataset not found at {DATASET_PATH}")
        exit(1)

    print(f"1. Loading FULL dataset from '{DATASET_PATH}' (This may take a moment)...")
    df = pd.read_csv(DATASET_PATH)
    
    total_records = len(df)
    print(f"   [SUCCESS] Loaded {total_records:,} real-world charging records.")

    print("\n2. Processing 12 Practical Features (No Traffic Data)...")
    features = [
        'hour_of_day', 'day_of_week', 'month', 'is_weekend', 'is_peak_hour', 
        'weather_condition', 'temperature_f', 'precipitation_mm',
        'location_type', 'charger_type', 'power_output_kw',
        'local_event'
    ]
    target = 'utilization_rate'

    # Handle missing values
    df = df.dropna(subset=[target])
    
    # Fill numeric NaNs
    numeric_features = ['temperature_f', 'precipitation_mm', 'power_output_kw']
    for col in numeric_features:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
    
    # Clean and fill string categories
    string_features = ['weather_condition', 'local_event', 'location_type', 'charger_type']
    for col in string_features:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().str.title().replace('Nan', 'Unknown')
    
    # Boolean conversions
    df['is_weekend'] = df['is_weekend'].astype(bool).astype(int)
    df['is_peak_hour'] = df['is_peak_hour'].astype(bool).astype(int)

    X = df[features]
    y = df[target]

    print("   One-Hot Encoding Categorical Variables on Full Dataset...")
    X_encoded = pd.get_dummies(X, columns=string_features)
    model_columns = list(X_encoded.columns)

    os.makedirs('models', exist_ok=True)
    joblib.dump(model_columns, 'models/model_columns.pkl')

    print(f"   Final Feature Space: {len(model_columns)} variables.")

    # Create the Master Train/Test Split (80/20) on the FULL dataset
    X_train_full, X_test, y_train_full, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)
    print(f"   Master Train Set: {len(X_train_full):,} rows | Test Set: {len(X_test):,} rows.")

    print("\n==========================================================================")
    print(" PHASE 1: HYPERPARAMETER SEARCH (GridSearchCV on 300,000 row sample)")
    print("==========================================================================")
    
    # Sample 300,000 rows from the training set for fast GridSearch
    search_sample_size = min(300000, len(X_train_full))
    print(f"   Sampling {search_sample_size:,} rows from Master Train Set to prevent data leakage...")
    
    # Using same random state to keep indices aligned
    X_train_sample = X_train_full.sample(n=search_sample_size, random_state=42)
    y_train_sample = y_train_full.loc[X_train_sample.index]

    grid_configs = {
        "Random Forest Regressor": {
            "estimator": RandomForestRegressor(random_state=42, n_jobs=-1),
            "param_grid": {
                "n_estimators": [100, 200, 300],
                "max_depth": [15, 25, None],
                "min_samples_split": [2, 10, 20]
            }
        },
        "HistGradientBoosting": {
            "estimator": HistGradientBoostingRegressor(random_state=42),
            "param_grid": {
                "learning_rate": [0.01, 0.05, 0.1],
                "max_iter": [200, 500],
                "max_depth": [10, 20, 30],
                "l2_regularization": [0.0, 0.5, 1.0]
            }
        },
        "Ridge Linear Baseline": {
            "estimator": Ridge(),
            "param_grid": {
                "alpha": [0.01, 0.1, 1.0, 10.0, 100.0]
            }
        }
    }

    best_params_dict = {}

    for name, config in grid_configs.items():
        print(f"\n   [SEARCHING] {name}...")
        grid_search = GridSearchCV(
            estimator=config["estimator"],
            param_grid=config["param_grid"],
            cv=3,
            scoring='neg_mean_absolute_error',
            n_jobs=-1,
            verbose=1
        )
        grid_search.fit(X_train_sample, y_train_sample)
        best_params_dict[name] = grid_search.best_params_
        print(f"      > Best Params Found: {grid_search.best_params_}")

    print("\n==========================================================================")
    print(" PHASE 2: FINAL PRODUCTION TRAINING (Full Dataset)")
    print("==========================================================================")
    
    final_models = {
        "Random Forest Regressor": RandomForestRegressor(random_state=42, n_jobs=-1, **best_params_dict["Random Forest Regressor"]),
        "HistGradientBoosting": HistGradientBoostingRegressor(random_state=42, **best_params_dict["HistGradientBoosting"]),
        "Ridge Linear Baseline": Ridge(**best_params_dict["Ridge Linear Baseline"])
    }

    metrics_results = []
    tuning_records = []
    best_overall_mae = float('inf')
    champion_model_name = ""
    champion_model_obj = None

    for name, model in final_models.items():
        print(f"\n   [TRAINING ON FULL {len(X_train_full):,} ROWS] {name}...")
        
        # Fit on the ENTIRE training set using the best params from Phase 1
        model.fit(X_train_full, y_train_full)
        
        # Evaluate on the unseen Test set
        preds = model.predict(X_test)
        preds = np.clip(preds, 0.0, 1.0)
        
        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        r2 = r2_score(y_test, preds)
        # Threshold-based accuracy (industry standard for regression):
        # % of predictions within ±5% of actual utilization
        within_5 = float(np.mean(np.abs(preds - y_test) <= 0.05) * 100.0)
        within_10 = float(np.mean(np.abs(preds - y_test) <= 0.10) * 100.0)
        
        print(f"      > [TEST EVALUATION] MAE: {mae:.4f} | RMSE: {rmse:.4f} | R2: {r2:.4f} | Within±5%: {within_5:.2f}% | Within±10%: {within_10:.2f}%")
        
        metrics_results.append({
            "model": name,
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2_score": round(r2, 4),
            "within_5pct_accuracy": round(within_5, 2),
            "within_10pct_accuracy": round(within_10, 2)
        })
        
        tuning_records.append({
            "model": name,
            "phase_1_best_params": best_params_dict[name],
            "phase_2_test_mae": round(mae, 4)
        })
        
        if mae < best_overall_mae:
            best_overall_mae = mae
            champion_model_name = name
            champion_model_obj = model

    print("\n========================================================================")
    print("                 PRODUCTION BENCHMARK COMPARISON MATRIX")
    print("========================================================================")
    print(f"{'Algorithm Name':<35} | {'MAE':<8} | {'RMSE':<8} | {'R2':<8} | {'±5% Acc':<8}")
    print("-" * 75)
    for res in metrics_results:
        star = " * (WINNER)" if res['model'] == champion_model_name else ""
        print(f"{res['model']:<35} | {res['mae']:<8.4f} | {res['rmse']:<8.4f} | {res['r2_score']:<8.4f} | {res['within_5pct_accuracy']:<6.2f}%{star}")
    print("========================================================================")

    print(f"\n[VICTORY] Selected Champion Architecture: '{champion_model_name}' (MAE: {best_overall_mae:.4f})")

    joblib.dump(champion_model_obj, 'models/surge_model.pkl')
    joblib.dump(champion_model_obj, 'models/best_surge_model.pkl')

    total_time_elapsed = time.time() - start_total_time
    m, s = divmod(total_time_elapsed, 60)
    h, m = divmod(m, 60)
    time_str = f"{int(h)}h {int(m)}m {int(s)}s"

    # Find champion's within-5% accuracy for the summary
    champion_metrics = next((m for m in metrics_results if m["model"] == champion_model_name), {})
    summary_payload = {
        "winner": champion_model_name,
        "winning_accuracy_pct": champion_metrics.get("within_5pct_accuracy", round((1.0 - best_overall_mae) * 100.0, 2)),
        "winning_within_5pct_accuracy": champion_metrics.get("within_5pct_accuracy", None),
        "winning_within_10pct_accuracy": champion_metrics.get("within_10pct_accuracy", None),
        "trained_records": total_records,
        "total_training_time": time_str,
        "comparison_table": metrics_results
    }

    with open('models/model_metrics.json', 'w') as f:
        json.dump(summary_payload, f, indent=2)

    with open('models/tuning_records.json', 'w') as f:
        json.dump({
            "champion_model": champion_model_name,
            "total_time": time_str,
            "records": tuning_records
        }, f, indent=2)

    print(f"\n[SUCCESS] 2-Phase Production Training Complete in {time_str}! Champion Model serialized to 'models/surge_model.pkl'")

if __name__ == '__main__':
    run_pipeline = True
    if run_pipeline:
        run_production_pipeline()
