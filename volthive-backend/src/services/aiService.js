// volthive-backend/src/services/aiService.js
const axios = require('axios');

/**
 * Fetches AI-based dynamic price multiplier from Flask service
 * 
 * Environment Variable:
 *   FLASK_API_URL - URL of Flask AI service (default: http://localhost:5001)
 * 
 * Returns:
 *   {
 *     predicted_occupancy: string (e.g., "62.50%"),
 *     suggested_multiplier: number (0.90 - 1.25),
 *     ai_recommendation: string
 *   }
 * 
 * Fallback (if service unavailable):
 *   { suggested_multiplier: 1.0, ai_recommendation: "System Fallback" }
 */
const getDynamicPriceMultiplier = async (stationData, currentContext) => {
  try {
    // Get Flask API URL from environment, with development default
    const flaskApiUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    
    if (!flaskApiUrl) {
      throw new Error('FLASK_API_URL environment variable is not set');
    }

    // Construct the payload expected by Flask app.py
    const payload = {
      hour_of_day: Number(currentContext.hour) || new Date().getHours(),
      day_of_week: Number(currentContext.dayOfWeek) || new Date().getDay(),
      is_weekend: currentContext.isWeekend ? 1 : 0,
      is_peak_hour: currentContext.isPeakHour ? 1 : 0,
      weather_condition: String(currentContext.weather || 'Clear'),
      local_event: String(currentContext.event || 'None'),
      traffic_congestion_index: Math.min(10, Math.max(1, Number(currentContext.trafficScore) || 5))
    };

    const response = await axios.post(
      `${flaskApiUrl}/api/ai/suggest-price`,
      payload,
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Validate response format
    if (!response.data || typeof response.data.suggested_multiplier === 'undefined') {
      throw new Error('Invalid response format from AI service');
    }

    return response.data;

  } catch (error) {
    // Log error details for debugging (but don't expose sensitive info)
    const errorInfo = {
      message: error.message,
      code: error.code || 'UNKNOWN',
      isTimeout: error.code === 'ECONNABORTED'
    };
    
    console.error('AI Service Error:', errorInfo);
    
    // Return safe fallback: use base price (multiplier = 1.0)
    // This ensures the app never breaks if AI service is down
    return {
      suggested_multiplier: 1.0,
      ai_recommendation: 'System Fallback',
      predicted_occupancy: 'Unknown',
      warning: 'AI service unavailable - using standard pricing'
    };
  }
};

module.exports = { getDynamicPriceMultiplier };