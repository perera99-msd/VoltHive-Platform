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

/**
 * GET /api/ai/forecast
 * Get 6-hour hourly and 5-day weekly surge prediction charts
 */
router.get('/forecast', verifyToken, async (req, res) => {
  try {
    const aiServiceUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    const payload = {
      weather_condition: req.query.weather || 'Clear',
      temperature_c: Number(req.query.temp) || 28
    };

    const response = await axios.post(`${aiServiceUrl}/api/ai/forecast`, payload, { timeout: 5000 });
    return res.status(200).json(response.data);
  } catch (error) {
    console.warn('AI forecast service failed or offline, using fallback:', error.message);
    
    // Solid fallback if Python AI service isn't running locally
    const now = new Date();
    const hourly = [];
    for (let i = 0; i < 6; i++) {
      const t = new Date(now.getTime() + i * 3600000);
      const h = t.getHours();
      const peak = (17 <= h && h <= 20) || (7 <= h && h <= 9);
      hourly.push({
        time: `${String(h).padStart(2, '0')}:00`,
        hour: h,
        occupancy: peak ? 85.0 : 45.0,
        multiplier: peak ? 1.25 : 1.0,
        recommendation: peak ? "High Surge Demand" : "Normal Demand"
      });
    }

    const daily = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].slice(0, 5).map((day, idx) => ({
      day,
      date: `06/${26 + idx}`,
      occupancy: 68 + idx * 4,
      avgMultiplier: idx > 2 ? 1.15 : 1.05,
      status: idx > 2 ? "High Peak Hub" : "Steady Demand"
    }));

    return res.status(200).json({
      status: "success",
      weather: { condition: "Clear", temp: 28, source: "System Fallback Forecast" },
      hourly,
      daily,
      lastUpdated: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }
});

module.exports = router;