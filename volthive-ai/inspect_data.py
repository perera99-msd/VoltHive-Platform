import pandas as pd

# Load the dataset to check unique categories
try:
    df = pd.read_csv('data/surge_pricing_data.csv')
    
    print("--- Unique Weather Values ---")
    print(df['weather_condition'].unique())

    print("\n--- Unique Event Values ---")
    print(df['local_event'].unique())
except FileNotFoundError:
    print("❌ Error: surge_pricing_data.csv not found in 'data' folder.")