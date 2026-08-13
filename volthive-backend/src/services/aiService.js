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
      // Pass station location so Flask can fetch per-station live weather
      latitude: stationData?.location?.coordinates?.[1] ?? currentContext.lat ?? 6.9271,
      longitude: stationData?.location?.coordinates?.[0] ?? currentContext.lng ?? 79.8612,
      // Pass station specs for better inference alignment
      location_type: stationData?.locationType || currentContext.locationType || 'Urban Center',
      charger_type: stationData?.chargerType || currentContext.chargerType || 'Dc Fast Charge',
      power_output_kw: stationData?.maxPowerKW || currentContext.powerKW || 120,
      pricing_profile: stationData?.pricingProfile || currentContext.pricingProfile || 'balanced'
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