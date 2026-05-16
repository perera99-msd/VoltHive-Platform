const express = require('express');
const router = express.Router();
const axios = require('axios');
const verifyToken = require('../middleware/authMiddleware');

/**
 * GET /api/ai/health
 * Check if AI service is available
 */
router.get('/health', async (req, res) => {
  try {
    const aiServiceUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    const response = await axios.get(`${aiServiceUrl}/api/ai/health`, { timeout: 3000 });
    res.status(200).json({ status: 'ok', aiService: response.data });
  } catch (error) {
    console.warn('AI service health check failed:', error.message);
    res.status(503).json({ status: 'unavailable', message: 'AI service is offline' });
  }
});

/**
 * GET /api/ai/pricing-suggestion
 * Get AI-based dynamic pricing suggestion for current conditions
 * 
 * Response: {
 *   predicted_occupancy: string (e.g., "62.50%"),
 *   suggested_multiplier: number (e.g., 1.15),
 *   ai_recommendation: string (e.g., "Moderate Demand")
 * }
 */
router.get('/pricing-suggestion', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    
    // 1. Calculate current time features
    const hour = now.getHours();
    const day = now.getDay(); // 0 (Sun) to 6 (Sat)
    const isWeekend = (day === 0 || day === 6);
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);

    // 2. Prepare the data payload for the Python AI
    // NOTE: Weather and traffic are mocked. Integrate real APIs later:
    // - OpenWeatherMap API for weather
    // - TomTom/HERE Maps API for traffic
    const environmentalData = {
      hour_of_day: hour,
      day_of_week: day,
      is_weekend: isWeekend ? 1 : 0,
      is_peak_hour: isPeakHour ? 1 : 0,
      weather_condition: 'Clear',  // TODO: Integrate OpenWeatherMap
      local_event: 'None',          // TODO: Integrate event calendar
      traffic_congestion_index: 5   // TODO: Integrate traffic API
    };

    // 3. Request the prediction from the Python Microservice
    const aiServiceUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    if (!aiServiceUrl) {
      return res.status(500).json({ 
        error: 'AI service URL not configured',
        fallback: true,
        suggested_multiplier: 1.0 
      });
    }

    const aiResponse = await axios.post(
      `${aiServiceUrl}/api/ai/suggest-price`,
      environmentalData,
      { timeout: 5000 }
    );

    // 4. Send the result back to the React frontend
    res.status(200).json({
      ...aiResponse.data,
      timestamp: now.toISOString(),
      context: environmentalData
    });

  } catch (error) {
    console.error('AI Service Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status
    });

    // Graceful fallback: return safe default pricing
    res.status(503).json({
      error: 'AI pricing service is currently unavailable',
      fallback: true,
      suggested_multiplier: 1.0,
      ai_recommendation: 'System Fallback - Using Base Price',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;