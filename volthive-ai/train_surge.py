import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib
import os

print("⚡ Starting VoltHive Surge Pricing Model Training...")

# 1. Load the Dataset
print("1. Loading dataset...")
try:
    df = pd.read_csv('data/surge_pricing_data.csv')
except FileNotFoundError:
    print("❌ Error: surge_pricing_data.csv not found.")
    exit()

# 2. Select Features (Inputs) and Target (Output)
print("2. Preprocessing features...")
features = ['hour_of_day', 'day_of_week', 'is_weekend', 'is_peak_hour', 
            'weather_condition', 'local_event', 'traffic_congestion_index']
target = 'utilization_rate'

# Remove rows with missing values in these columns
df = df.dropna(subset=features + [target])

X = df[features]
y = df[target]

# One-Hot Encoding: Converts text categories into numbers
X_encoded = pd.get_dummies(X, columns=['weather_condition', 'local_event'])

# Save the column layout for the API to use later
model_columns = list(X_encoded.columns)
if not os.path.exists('models'):
    os.makedirs('models')
joblib.dump(model_columns, 'models/model_columns.pkl')

# 3. Split the Data
X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

# 4. Train the Model
print("4. Training Random Forest... (This may take a few minutes for 339MB)")
model = RandomForestRegressor(n_estimators=50, max_depth=15, n_jobs=-1, random_state=42)
model.fit(X_train, y_train)

# 5. Evaluate
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
print(f"🎯 Model Mean Absolute Error (MAE): {mae:.2f}")

# 6. Save the Model
joblib.dump(model, 'models/surge_model.pkl')
print("✅ Training Complete! Model saved to models/surge_model.pkl")