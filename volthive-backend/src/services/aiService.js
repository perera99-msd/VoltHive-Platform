// volthive-backend/src/services/aiService.js
const axios = require('axios');

// Assuming your Flask app runs on port 5000
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000/api/ai';

const getDynamicPriceMultiplier = async (stationData, currentContext) => {
  try {
    // Construct the payload expected by your app.py
    const payload = {
      hour_of_day: currentContext.hour,
      day_of_week: currentContext.dayOfWeek,
      is_weekend: currentContext.isWeekend,
      is_peak_hour: currentContext.isPeakHour,
      weather_condition: currentContext.weather, // e.g., 'Clear'
      local_event: currentContext.event,         // e.g., 'None'
      traffic_congestion_index: currentContext.trafficScore // 1-10
    };

    const response = await axios.post(`${FLASK_API_URL}/suggest-price`, payload);
    
    // Returns { predicted_occupancy, suggested_multiplier, ai_recommendation }
    return response.data; 

  } catch (error) {
    console.error("AI Service Error: Could not fetch price multiplier. Defaulting to 1.0", error.message);
    // Fallback: If Python server is down, don't break the app, just use base price
    return { suggested_multiplier: 1.0, ai_recommendation: "System Fallback" };
  }
};

module.exports = { getDynamicPriceMultiplier };