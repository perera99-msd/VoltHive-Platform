from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os

app = Flask(__name__)

allowed_origins = os.getenv('AI_CORS_ALLOWED_ORIGINS', 'http://localhost:3000')
CORS(app, resources={r"/api/*": {"origins": [origin.strip() for origin in allowed_origins.split(',') if origin.strip()]}})

MODEL_PATH = 'models/surge_model.pkl'
COLUMNS_PATH = 'models/model_columns.pkl'

# Load the trained AI on startup
model = None
model_columns = None

if os.path.exists(MODEL_PATH) and os.path.exists(COLUMNS_PATH):
    model = joblib.load(MODEL_PATH)
    model_columns = joblib.load(COLUMNS_PATH)
    print("✅ VoltHive Surge AI Model loaded.")
else:
    print("⚠️ Warning: Model files not found.")

@app.route('/api/ai/health', methods=['GET'])
def health_check():
    return jsonify({"status": "success", "model_loaded": model is not None}), 200

@app.route('/api/ai/suggest-price', methods=['POST'])
def suggest_price():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
        
    try:
        data = request.json
        
        # Ensure the input text matches the casing used in your CSV (e.g., Title Case)
        if 'weather_condition' in data:
            data['weather_condition'] = str(data['weather_condition']).strip().title()
        if 'local_event' in data:
            data['local_event'] = str(data['local_event']).strip().title()

        df = pd.DataFrame([data])
        df_encoded = pd.get_dummies(df)
        
        # Align columns with the training data
        df_final = df_encoded.reindex(columns=model_columns, fill_value=0)
        
        # Predict occupancy (This comes out as a decimal, e.g., 0.62)
        raw_prediction = model.predict(df_final)[0]
        
        # THE FIX: Convert decimal to a proper 0-100 percentage
        prediction = raw_prediction * 100 if raw_prediction <= 1.0 else raw_prediction
        
        # Dynamic Pricing Multipliers
        multiplier = 1.0
        msg = "Normal Demand"
        
        if prediction >= 85.0:
            multiplier = 1.25
            msg = "High Surge Demand"
        elif prediction >= 60.0:  # Adjusted this slightly to catch the 62% mark!
            multiplier = 1.15
            msg = "Moderate Demand"
        elif prediction <= 30.0:
            multiplier = 0.90
            msg = "Low Demand (Discount Suggested)"

        return jsonify({
            "predicted_occupancy": f"{round(prediction, 2)}%",
            "suggested_multiplier": multiplier,
            "ai_recommendation": msg
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    port = int(os.getenv('AI_PORT', '5001'))
    debug_mode = os.getenv('AI_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)