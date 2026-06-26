import pandas as pd
import os

dataset_path = os.path.join("Data Set", "ev_charging_station_data.csv")
if not os.path.exists(dataset_path):
    dataset_path = "ev_charging_station_data.csv"

try:
    df = pd.read_csv(dataset_path)
    
    print("--- Unique Weather Values ---")
    print(df['weather_condition'].unique())

    print("\n--- Unique Event Values ---")
    print(df['local_event'].unique())
except Exception as e:
    print(f"❌ Error loading dataset: {e}")